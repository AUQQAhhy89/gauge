// Gauge — desktop host.
//
// The desktop build is a small local HTTP server. The UI is a static web app;
// all Steam requests go through this process so the browser only ever talks to
// 127.0.0.1. This keeps referer/UA handling and rate limiting in one place and
// avoids cross-origin restrictions in the browser.
package main

import (
	"context"
	"crypto/sha1"
	"embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	appVersion        = "1.5.0-beta"
	disclaimerVersion = 1
	stateFileName     = "state.json"
)

//go:embed web
var webFS embed.FS

// ---------------------------------------------------------------- data types

type Settings struct {
	Language           string `json:"language"`
	Country            string `json:"country"`
	DisclaimerAccepted bool   `json:"disclaimerAccepted"`
	DisclaimerVersion  int    `json:"disclaimerVersion"`
	Mirror             string `json:"mirror"`
	Theme              string `json:"theme"`
	PublicService      bool   `json:"publicService"`
	Platform           string `json:"platform"`
}

type HistoryItem struct {
	Kind  string `json:"kind"` // search | game
	AppID int    `json:"appid,omitempty"`
	Name  string `json:"name,omitempty"`
	Image string `json:"image,omitempty"`
	Query string `json:"query,omitempty"`
	At    int64  `json:"at"`
}

type Favorite struct {
	AppID    int    `json:"appid"`
	Name     string `json:"name"`
	Image    string `json:"image"`
	At       int64  `json:"at"`
	Price    *int   `json:"price"`
	Currency string `json:"currency"`
	Free     bool   `json:"free"`
	Discount int    `json:"discount"`
}

type PricePoint struct {
	Date     string `json:"date"`
	Final    int    `json:"final"`
	Initial  int    `json:"initial"`
	Discount int    `json:"discount"`
	Currency string `json:"currency"`
}

type State struct {
	Settings  Settings                `json:"settings"`
	History   []HistoryItem           `json:"history"`
	Favorites []Favorite              `json:"favorites"`
	Prices    map[string][]PricePoint `json:"prices"`
}

type LaunchRecord struct {
	At      int64 `json:"at"`
	Seconds int64 `json:"seconds"`
}

type Usage struct {
	FirstLaunch  int64          `json:"firstLaunch"`
	LastLaunch   int64          `json:"lastLaunch"`
	TotalSeconds int64          `json:"totalSeconds"`
	Launches     []LaunchRecord `json:"launches"`
}

type app struct {
	dataDir string

	stateMu sync.Mutex
	usageMu sync.Mutex

	sessionStart time.Time
	lastBeat     time.Time

	cache *ttlCache

	client *http.Client

	hostMu   sync.Mutex
	hostLast map[string]time.Time
}

// ---------------------------------------------------------------- main

func main() {
	log.SetFlags(log.LstdFlags)

	dataDir, err := initialiseDataDir()
	if err != nil {
		// A failed data directory is fatal, but the process has no console in
		// the Windows GUI build. Write next to the executable as a last resort.
		fallback := filepath.Join(filepath.Dir(os.Args[0]), "GaugeData")
		_ = os.MkdirAll(fallback, 0o755)
		f, _ := os.OpenFile(filepath.Join(fallback, "logs", "fatal.log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
		if f != nil {
			fmt.Fprintf(f, "%s %v\n", time.Now().Format(time.RFC3339), err)
			f.Close()
		}
		os.Exit(1)
	}
	setupLogging(dataDir)

	a := &app{
		dataDir:  dataDir,
		client:   newHTTPClient(),
		cache:    newTTLCache(),
		hostLast: map[string]time.Time{},
	}
	a.recordLaunch()

	sub, err := fs.Sub(webFS, "web")
	if err != nil {
		log.Fatalf("embed web: %v", err)
	}
	static := http.FileServer(http.FS(sub))

	mux := http.NewServeMux()
	mux.HandleFunc("/api/state", a.handleState)
	mux.HandleFunc("/api/steam", a.handleSteam)
	mux.HandleFunc("/api/img", a.handleImage)
	mux.HandleFunc("/api/usage", a.handleUsage)
	mux.HandleFunc("/api/usage/beat", a.handleBeat)
	mux.HandleFunc("/api/open-url", a.handleOpenURL)
	mux.HandleFunc("/api/open-folder", a.handleOpenFolder)
	mux.HandleFunc("/api/clear-cache", a.handleClearCache)
	mux.HandleFunc("/api/public-ads", handlePublicAds)
	mux.HandleFunc("/api/info", a.handleInfo)
	mux.HandleFunc("/api/quit", func(w http.ResponseWriter, r *http.Request) {
		writeJSONResponse(w, http.StatusOK, map[string]any{"ok": true})
		go func() {
			time.Sleep(350 * time.Millisecond)
			os.Exit(0)
		}()
	})
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		io.WriteString(w, `{"ok":true}`)
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// No SPA fallback is required: the client uses hash routing.
		if r.URL.Path == "/" {
			w.Header().Set("Cache-Control", "no-cache")
		}
		static.ServeHTTP(w, r)
	})

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatalf("listen: %v", err)
	}
	addr := ln.Addr().(*net.TCPAddr)
	page := fmt.Sprintf("http://127.0.0.1:%d/", addr.Port)
	log.Printf("Gauge %s listening on %s", appVersion, page)
	log.Printf("data directory: %s", dataDir)

	srv := &http.Server{
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       90 * time.Second,
	}

	go func() {
		time.Sleep(250 * time.Millisecond)
		if err := openApplicationWindow(page); err != nil {
			log.Printf("open browser: %v", err)
		}
	}()

	if err := srv.Serve(ln); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("serve: %v", err)
	}
}

// ---------------------------------------------------------------- storage

func initialiseDataDir() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	root := filepath.Join(cwd, "GaugeData")
	// Migrate the data folder used by the pre-rename builds.
	oldRoot := filepath.Join(cwd, "SteamViewerData")
	if _, err := os.Stat(root); os.IsNotExist(err) {
		if _, err := os.Stat(oldRoot); err == nil {
			_ = os.Rename(oldRoot, root)
		}
	}
	for _, d := range []string{
		root,
		filepath.Join(root, "config"),
		filepath.Join(root, "data"),
		filepath.Join(root, "cache"),
		filepath.Join(root, "cache", "images"),
		filepath.Join(root, "logs"),
	} {
		if err := os.MkdirAll(d, 0o755); err != nil {
			return "", err
		}
	}

	// The image cache is always discarded at startup. This is deliberate:
	// Steam artwork URLs rotate and stale images are the main source of a
	// wrong-looking first screen.
	clearDir(filepath.Join(root, "cache", "images"))

	statePath := filepath.Join(root, "config", stateFileName)
	if _, err := os.Stat(statePath); os.IsNotExist(err) {
		st := defaultState()
		if err := writeJSON(statePath, st); err != nil {
			return "", err
		}
	}
	// Usage file is created on first launch when recordLaunch is called.
	return root, nil
}

func setupLogging(dataDir string) {
	p := filepath.Join(dataDir, "logs", "app.log")
	if fi, err := os.Stat(p); err == nil && fi.Size() > 2*1024*1024 {
		_ = os.Rename(p, filepath.Join(dataDir, "logs", "app.old.log"))
	}
	f, err := os.OpenFile(p, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err == nil {
		log.SetOutput(io.MultiWriter(os.Stderr, f))
	}
}

func defaultState() State {
	return State{
		Settings: Settings{
			Language:           "zh",
			Country:            "CN",
			DisclaimerAccepted: false,
			DisclaimerVersion:  disclaimerVersion,
			Mirror:             "official",
			Theme:              "system",
			PublicService:      false,
			Platform:           "steam",
		},
		History:   []HistoryItem{},
		Favorites: []Favorite{},
		Prices:    map[string][]PricePoint{},
	}
}

func clearDir(dir string) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return
	}
	for _, e := range entries {
		_ = os.RemoveAll(filepath.Join(dir, e.Name()))
	}
}

func writeJSON(path string, v any) error {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, b, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

func readJSON(path string, v any) error {
	b, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(b, v)
}

func (a *app) loadState() (State, error) {
	a.stateMu.Lock()
	defer a.stateMu.Unlock()
	return a.loadStateLocked()
}

func (a *app) loadStateLocked() (State, error) {
	path := filepath.Join(a.dataDir, "config", stateFileName)
	st := defaultState()
	if err := readJSON(path, &st); err != nil {
		if os.IsNotExist(err) {
			return st, nil
		}
		// Keep a copy of a corrupt state rather than silently overwriting it.
		_ = os.Rename(path, path+".broken."+strconv.FormatInt(time.Now().Unix(), 10))
		_ = writeJSON(path, st)
		return st, nil
	}
	st = normaliseState(st)
	return st, nil
}

func normaliseState(st State) State {
	langs := map[string]bool{"zh": true, "en": true, "ja": true, "de": true, "ko": true, "ar": true}
	if !langs[st.Settings.Language] {
		st.Settings.Language = "zh"
	}
	if len(st.Settings.Country) != 2 {
		st.Settings.Country = "CN"
	}
	st.Settings.Country = strings.ToUpper(st.Settings.Country)
	if st.Settings.DisclaimerVersion == 0 {
		st.Settings.DisclaimerVersion = disclaimerVersion
	}
	if st.Settings.Mirror != "china" {
		st.Settings.Mirror = "official"
	}
	if st.Settings.Theme != "light" && st.Settings.Theme != "dark" {
		st.Settings.Theme = "system"
	}
	if st.Settings.Platform == "" {
		st.Settings.Platform = "steam"
	}
	if st.History == nil {
		st.History = []HistoryItem{}
	}
	if len(st.History) > 160 {
		st.History = st.History[:160]
	}
	if st.Favorites == nil {
		st.Favorites = []Favorite{}
	}
	if len(st.Favorites) > 200 {
		st.Favorites = st.Favorites[:200]
	}
	if st.Prices == nil {
		st.Prices = map[string][]PricePoint{}
	}
	// Cap the number of tracked apps and points per app.
	if len(st.Prices) > 300 {
		type kv struct {
			k string
			t int64
		}
		list := make([]kv, 0, len(st.Prices))
		for k, pts := range st.Prices {
			var last int64
			if len(pts) > 0 {
				if ts, err := time.Parse("2006-01-02", pts[len(pts)-1].Date); err == nil {
					last = ts.Unix()
				}
			}
			list = append(list, kv{k, last})
		}
		sort.Slice(list, func(i, j int) bool { return list[i].t > list[j].t })
		keep := map[string][]PricePoint{}
		for i := 0; i < 300 && i < len(list); i++ {
			keep[list[i].k] = st.Prices[list[i].k]
		}
		st.Prices = keep
	}
	for k, pts := range st.Prices {
		if len(pts) > 120 {
			pts = pts[len(pts)-120:]
		}
		st.Prices[k] = pts
	}
	return st
}

func (a *app) saveState(st State) error {
	a.stateMu.Lock()
	defer a.stateMu.Unlock()
	st = normaliseState(st)
	return writeJSON(filepath.Join(a.dataDir, "config", stateFileName), st)
}

func (a *app) usagePath() string { return filepath.Join(a.dataDir, "data", "usage.json") }

func (a *app) loadUsage() Usage {
	var u Usage
	_ = readJSON(a.usagePath(), &u)
	return u
}

func (a *app) saveUsage(u Usage) {
	_ = writeJSON(a.usagePath(), u)
}

func (a *app) recordLaunch() {
	a.usageMu.Lock()
	defer a.usageMu.Unlock()
	now := time.Now()
	u := a.loadUsage()
	if u.FirstLaunch == 0 {
		u.FirstLaunch = now.Unix()
	}
	u.LastLaunch = now.Unix()
	u.Launches = append(u.Launches, LaunchRecord{At: now.Unix()})
	if len(u.Launches) > 200 {
		u.Launches = u.Launches[len(u.Launches)-200:]
	}
	a.saveUsage(u)
	a.sessionStart = now
	a.lastBeat = now
}

// beatUsage adds elapsed time since the last beat. It is bounded so a laptop
// sleeping for eight hours cannot inflate the usage record.
func (a *app) beatUsage() Usage {
	a.usageMu.Lock()
	defer a.usageMu.Unlock()
	now := time.Now()
	u := a.loadUsage()
	elapsed := int64(now.Sub(a.lastBeat).Seconds())
	if elapsed < 0 {
		elapsed = 0
	}
	if elapsed > 120 {
		elapsed = 120
	}
	if elapsed > 0 {
		u.TotalSeconds += elapsed
		if n := len(u.Launches); n > 0 {
			u.Launches[n-1].Seconds += elapsed
		}
		a.lastBeat = now
		a.saveUsage(u)
	}
	return u
}

// ---------------------------------------------------------------- API handlers

func (a *app) handleState(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		st, err := a.loadState()
		if err != nil {
			writeJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSONResponse(w, http.StatusOK, map[string]any{
			"state":    st,
			"usage":    a.beatUsage(),
			"version":  appVersion,
			"dataDir":  a.dataDir,
			"platform": runtime.GOOS,
		})
	case http.MethodPost:
		var st State
		body := http.MaxBytesReader(w, r.Body, 4<<20)
		if err := json.NewDecoder(body).Decode(&st); err != nil {
			writeJSONResponse(w, http.StatusBadRequest, map[string]any{"error": "invalid state"})
			return
		}
		if err := a.saveState(st); err != nil {
			writeJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		writeJSONResponse(w, http.StatusOK, map[string]any{"ok": true})
	default:
		w.Header().Set("Allow", "GET, POST")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (a *app) handleUsage(w http.ResponseWriter, r *http.Request) {
	writeJSONResponse(w, http.StatusOK, a.beatUsage())
}

func (a *app) handleBeat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	writeJSONResponse(w, http.StatusOK, a.beatUsage())
}

func handlePublicAds(w http.ResponseWriter, r *http.Request) {
	body, err := webFS.ReadFile("web/public-ads.json")
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": "public ads unavailable"})
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.Write(body)
}

func (a *app) handleInfo(w http.ResponseWriter, r *http.Request) {
	writeJSONResponse(w, http.StatusOK, map[string]any{
		"version":  appVersion,
		"dataDir":  a.dataDir,
		"platform": runtime.GOOS,
		"source":   "open source / MIT",
	})
}

func (a *app) handleOpenURL(w http.ResponseWriter, r *http.Request) {
	target := r.URL.Query().Get("url")
	u, err := url.Parse(target)
	if err != nil || (u.Scheme != "https" && u.Scheme != "http") || u.Host == "" {
		writeJSONResponse(w, http.StatusBadRequest, map[string]any{"error": "invalid url"})
		return
	}
	if !isSteamWebHost(u.Hostname()) {
		writeJSONResponse(w, http.StatusBadRequest, map[string]any{"error": "only Steam web pages are supported"})
		return
	}
	if err := openExternal(u.String()); err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSONResponse(w, http.StatusOK, map[string]any{"ok": true})
}

func (a *app) handleOpenFolder(w http.ResponseWriter, r *http.Request) {
	var err error
	switch runtime.GOOS {
	case "windows":
		err = exec.Command("explorer", a.dataDir).Start()
	case "darwin":
		err = exec.Command("open", a.dataDir).Start()
	default:
		err = exec.Command("xdg-open", a.dataDir).Start()
	}
	if err != nil {
		writeJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSONResponse(w, http.StatusOK, map[string]any{"ok": true, "path": a.dataDir})
}

func (a *app) handleClearCache(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	dir := filepath.Join(a.dataDir, "cache", "images")
	entries, _ := os.ReadDir(dir)
	clearDir(dir)
	writeJSONResponse(w, http.StatusOK, map[string]any{"ok": true, "removed": len(entries)})
}

// ---------------------------------------------------------------- Steam proxy

var steamAPIHosts = []string{
	"store.steampowered.com",
	"api.steampowered.com",
	"steamcommunity.com",
	"www.steamcommunity.com",
	"steamcharts.com",
}

func isSteamAPIHost(host string) bool {
	host = strings.ToLower(host)
	for _, h := range steamAPIHosts {
		if host == h {
			return true
		}
	}
	return false
}

func isSteamWebHost(host string) bool {
	host = strings.ToLower(host)
	for _, suffix := range []string{
		"steampowered.com", "steamcommunity.com", "valvesoftware.com",
		"steamstatic.com", "steamcontent.com", "eccdnx.com",
		"playstation.com", "xbox.com", "epicgames.com", "wegame.com.cn",
	} {
		if host == suffix || strings.HasSuffix(host, "."+suffix) {
			return true
		}
	}
	return false
}

func isSteamImageHost(host string) bool {
	host = strings.ToLower(host)
	for _, suffix := range []string{
		"steamstatic.com", "akamai.steamstatic.com", "steamcommunity-a.akamaihd.net",
		"images.steamusercontent.com", "steamuserimages-a.akamaihd.net", "eccdnx.com",
	} {
		if host == suffix || strings.HasSuffix(host, "."+suffix) {
			return true
		}
	}
	return false
}

func (a *app) handleSteam(w http.ResponseWriter, r *http.Request) {
	raw := r.URL.Query().Get("url")
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "https" || u.Host == "" || !isSteamAPIHost(u.Hostname()) {
		writeJSONResponse(w, http.StatusBadRequest, map[string]any{"error": "url not allowed"})
		return
	}
	cacheKey := u.String()
	if entry, ok := a.cache.get(cacheKey); ok {
		w.Header().Set("Content-Type", entry.ContentType)
		w.Header().Set("X-Cache", "hit")
		w.WriteHeader(http.StatusOK)
		w.Write(entry.Body)
		return
	}

	ctx := r.Context()
	if strings.Contains(u.Path, "GetNumberOfCurrentPlayers") {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
	}
	body, ctype, status, err := a.fetch(ctx, u.String(), r.URL.Query().Get("lang"))
	if err != nil {
		writeJSONResponse(w, http.StatusBadGateway, map[string]any{"error": err.Error()})
		return
	}
	if status == http.StatusOK {
		a.cache.put(cacheKey, body, ctype, cacheTTL(u))
	}
	if ctype == "" {
		ctype = "application/json; charset=utf-8"
	}
	w.Header().Set("Content-Type", ctype)
	w.Header().Set("X-Cache", "miss")
	w.WriteHeader(status)
	w.Write(body)
}

func cacheTTL(u *url.URL) time.Duration {
	switch {
	case strings.Contains(u.Path, "storesearch"):
		return 90 * time.Second
	case strings.Contains(u.Path, "appdetails"):
		return 10 * time.Minute
	case strings.Contains(u.Path, "GetNumberOfCurrentPlayers"):
		return 30 * time.Second
	default:
		return 60 * time.Second
	}
}

func (a *app) fetch(ctx context.Context, rawurl, lang string) ([]byte, string, int, error) {
	u, err := url.Parse(rawurl)
	if err != nil {
		return nil, "", 0, err
	}
	if !isSteamAPIHost(u.Hostname()) {
		return nil, "", 0, fmt.Errorf("host not allowed")
	}
	acceptLang := "zh-CN,zh;q=0.9,en;q=0.7"
	switch lang {
	case "en":
		acceptLang = "en-US,en;q=0.9"
	case "ja":
		acceptLang = "ja-JP,ja;q=0.9,en;q=0.6"
	case "de":
		acceptLang = "de-DE,de;q=0.9,en;q=0.6"
	case "ko":
		acceptLang = "ko-KR,ko;q=0.9,en;q=0.6"
	case "ar":
		acceptLang = "ar,en;q=0.6"
	}
	referer := "https://store.steampowered.com/"
	if strings.Contains(u.Hostname(), "steamcommunity") {
		referer = "https://steamcommunity.com/"
	}

	attempts := 2
	if strings.Contains(u.Path, "GetNumberOfCurrentPlayers") {
		attempts = 1
	}
	var lastErr error
	for attempt := 0; attempt < attempts; attempt++ {
		a.waitHost(u.Hostname(), 320*time.Millisecond)
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
		if err != nil {
			return nil, "", 0, err
		}
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
		req.Header.Set("Accept", "application/json, text/plain, */*")
		req.Header.Set("Accept-Language", acceptLang)
		req.Header.Set("Referer", referer)
		req.Header.Set("Sec-Fetch-Site", "same-site")
		req.Header.Set("Sec-Fetch-Mode", "cors")
		req.Header.Set("Sec-Fetch-Dest", "empty")
		req.Header.Set("Sec-Ch-Ua", `"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"`)
		req.Header.Set("Sec-Ch-Ua-Mobile", "?0")
		req.Header.Set("Sec-Ch-Ua-Platform", `"Windows"`)
		req.Header.Set("Cookie", "birthtime=283993201; lastagecheckage=1-0-1990; mature_content=1; Steam_Language=english")
		resp, err := a.client.Do(req)
		if err != nil {
			lastErr = err
			time.Sleep(time.Duration(attempt+1) * 700 * time.Millisecond)
			continue
		}
		body, readErr := io.ReadAll(io.LimitReader(resp.Body, 8<<20))
		resp.Body.Close()
		if readErr != nil {
			lastErr = readErr
			continue
		}
		ctype := resp.Header.Get("Content-Type")
		if resp.StatusCode == http.StatusTooManyRequests || resp.StatusCode >= 500 {
			lastErr = fmt.Errorf("steam returned %d", resp.StatusCode)
			time.Sleep(time.Duration(attempt+1) * 1200 * time.Millisecond)
			continue
		}
		return body, ctype, resp.StatusCode, nil
	}
	if lastErr == nil {
		lastErr = errors.New("request failed")
	}
	return nil, "", 0, lastErr
}

func (a *app) waitHost(host string, min time.Duration) {
	host = strings.ToLower(host)
	a.hostMu.Lock()
	next := a.hostLast[host].Add(min)
	now := time.Now()
	if next.Before(now) {
		next = now
	}
	a.hostLast[host] = next
	a.hostMu.Unlock()
	if d := time.Until(next); d > 0 {
		time.Sleep(d)
	}
}

func (a *app) handleImage(w http.ResponseWriter, r *http.Request) {
	raw := r.URL.Query().Get("url")
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "https" || !isSteamImageHost(u.Hostname()) {
		http.Error(w, "image url not allowed", http.StatusBadRequest)
		return
	}
	sum := sha1.Sum([]byte(u.String()))
	name := hex.EncodeToString(sum[:])
	dir := filepath.Join(a.dataDir, "cache", "images")
	path := filepath.Join(dir, name+".img")
	if _, err := os.Stat(path); err != nil {
		if err := a.downloadImage(u, path); err != nil {
			log.Printf("image %s: %v", u.Hostname(), err)
			http.Error(w, "image fetch failed", http.StatusBadGateway)
			return
		}
	}
	f, err := os.Open(path)
	if err != nil {
		http.Error(w, "cache read failed", http.StatusInternalServerError)
		return
	}
	defer f.Close()
	fi, _ := f.Stat()
	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.Header().Set("Content-Type", imageMIME(path))
	http.ServeContent(w, r, "", fi.ModTime(), f)
}

func imageMIME(path string) string {
	f, err := os.Open(path)
	if err != nil {
		return "application/octet-stream"
	}
	defer f.Close()
	buf := make([]byte, 512)
	n, _ := f.Read(buf)
	return http.DetectContentType(buf[:n])
}

func (a *app) downloadImage(u *url.URL, path string) error {
	a.waitHost(u.Hostname(), 45*time.Millisecond)
	req, err := http.NewRequest(http.MethodGet, u.String(), nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "image/avif,image/webp,image/apng,image/*,*/*;q=0.8")
	req.Header.Set("Referer", "https://store.steampowered.com/")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
	req.Header.Set("Sec-Fetch-Dest", "image")
	req.Header.Set("Sec-Fetch-Mode", "no-cors")
	req.Header.Set("Sec-Fetch-Site", "cross-site")
	req.Header.Set("Sec-Ch-Ua", `"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"`)
	req.Header.Set("Sec-Ch-Ua-Mobile", "?0")
	req.Header.Set("Sec-Ch-Ua-Platform", `"Windows"`)
	resp, err := a.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("status %d", resp.StatusCode)
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	tmp := path + ".part"
	f, err := os.Create(tmp)
	if err != nil {
		return err
	}
	n, err := io.Copy(f, io.LimitReader(resp.Body, 16<<20))
	closeErr := f.Close()
	if err != nil {
		_ = os.Remove(tmp)
		return err
	}
	if closeErr != nil {
		_ = os.Remove(tmp)
		return closeErr
	}
	if n == 0 {
		_ = os.Remove(tmp)
		return errors.New("empty image")
	}
	return os.Rename(tmp, path)
}

// ---------------------------------------------------------------- helpers

type cacheEntry struct {
	Body        []byte
	ContentType string
	Expires     time.Time
}

type ttlCache struct {
	mu sync.Mutex
	m  map[string]cacheEntry
}

func newTTLCache() *ttlCache { return &ttlCache{m: map[string]cacheEntry{}} }

func (c *ttlCache) get(key string) (cacheEntry, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	e, ok := c.m[key]
	if !ok || time.Now().After(e.Expires) {
		if ok {
			delete(c.m, key)
		}
		return cacheEntry{}, false
	}
	return e, true
}

func (c *ttlCache) put(key string, body []byte, ctype string, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if len(c.m) > 400 {
		for k := range c.m {
			delete(c.m, k)
			if len(c.m) < 200 {
				break
			}
		}
	}
	cp := make([]byte, len(body))
	copy(cp, body)
	c.m[key] = cacheEntry{Body: cp, ContentType: ctype, Expires: time.Now().Add(ttl)}
}

func newHTTPClient() *http.Client {
	jar, _ := cookiejar.New(nil)
	return &http.Client{
		Timeout: 22 * time.Second,
		Jar:     jar,
		Transport: &http.Transport{
			Proxy:                 http.ProxyFromEnvironment,
			MaxIdleConns:          20,
			IdleConnTimeout:       60 * time.Second,
			TLSHandshakeTimeout:   10 * time.Second,
			ResponseHeaderTimeout: 18 * time.Second,
		},
	}
}

func writeJSONResponse(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// openApplicationWindow prefers a Chrome/Edge app window on Windows, which
// gives the local UI a standalone window instead of a normal browser tab. If
// neither browser is installed it falls back to the system default browser.
func openApplicationWindow(target string) error {
	if runtime.GOOS == "windows" {
		candidates := []string{
			filepath.Join(os.Getenv("ProgramFiles(x86)"), "Microsoft", "Edge", "Application", "msedge.exe"),
			filepath.Join(os.Getenv("ProgramFiles"), "Microsoft", "Edge", "Application", "msedge.exe"),
			filepath.Join(os.Getenv("LocalAppData"), "Microsoft", "Edge", "Application", "msedge.exe"),
			filepath.Join(os.Getenv("ProgramFiles"), "Google", "Chrome", "Application", "chrome.exe"),
			filepath.Join(os.Getenv("ProgramFiles(x86)"), "Google", "Chrome", "Application", "chrome.exe"),
			filepath.Join(os.Getenv("LocalAppData"), "Google", "Chrome", "Application", "chrome.exe"),
		}
		for _, exe := range candidates {
			if exe == "" {
				continue
			}
			if fi, err := os.Stat(exe); err == nil && !fi.IsDir() {
				cmd := exec.Command(exe, "--app="+target, "--window-size=1400,960")
				if err := cmd.Start(); err == nil {
					return nil
				}
			}
		}
	}
	return openExternal(target)
}

func openExternal(target string) error {
	switch runtime.GOOS {
	case "windows":
		return exec.Command("rundll32", "url.dll,FileProtocolHandler", target).Start()
	case "darwin":
		return exec.Command("open", target).Start()
	default:
		return exec.Command("xdg-open", target).Start()
	}
}
