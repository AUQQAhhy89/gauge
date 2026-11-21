package io.github.steamviewer;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.util.Log;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class MainActivity extends Activity {
    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private static final String VERSION = "1.5.0-beta";
    private static final int LIGHT_BG = Color.rgb(233, 233, 231);
    private static final int DARK_BG = Color.rgb(27, 27, 26);
    private static final String UA =
            "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/124.0.0.0 Mobile Safari/537.36 Gauge/1.5.0-beta";
    private static final String[] API_HOSTS = {
            "store.steampowered.com", "api.steampowered.com", "steamcommunity.com",
            "www.steamcommunity.com", "steamcharts.com"
    };
    private static final String[] IMAGE_SUFFIXES = {
            "steamstatic.com", "steamcommunity-a.akamaihd.net", "images.steamusercontent.com",
            "steamuserimages-a.akamaihd.net", "eccdnx.com"
    };

    private WebView webView;
    private SharedPreferences prefs;
    private File dataRoot;
    private boolean foreground = true;
    private long lastBeat = 0;
    private static long lastNetwork = 0;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            startApp();
        } catch (Throwable t) {
            showStartupError(t);
        }
    }

    private void startApp() {
        prefs = getSharedPreferences("steam_viewer", MODE_PRIVATE);
        File oldData = new File(getFilesDir(), "SteamViewerData");
        dataRoot = new File(getFilesDir(), "GaugeData");
        if (!dataRoot.exists() && oldData.exists()) oldData.renameTo(dataRoot);
        ensureDataDir();
        clearImageCacheFiles();
        recordLaunch();

        boolean systemDark = preferredDark();
        webView = new WebView(this);
        webView.setBackgroundColor(systemDark ? DARK_BG : LIGHT_BG);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setSupportZoom(false);
        s.setUseWideViewPort(false);
        s.setLoadWithOverviewMode(false);
        s.setLoadsImagesAutomatically(true);
        s.setBlockNetworkImage(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setTextZoom(100);
        s.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.NORMAL);
        s.setUserAgentString(UA);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);
        webView.addJavascriptInterface(new Bridge(), "Android");
        webView.setWebViewClient(new Client());
        webView.setWebChromeClient(new WebChromeClient());
        setContentView(webView);

        // WindowInsetsController needs an installed decor view. Calling it
        // before setContentView can crash on Android 11+.
        configureSystemBars(systemDark);

        // A fresh start should not show artwork cached by a previous run.
        webView.clearCache(true);
        webView.loadUrl("https://" + ASSET_HOST + "/assets/index.html");
    }

    private void showStartupError(Throwable t) {
        Log.e("Gauge", "startup failed", t);
        try {
            File dir = new File(getFilesDir(), "GaugeData/logs");
            if (!dir.exists()) dir.mkdirs();
            java.io.PrintWriter pw = new java.io.PrintWriter(new File(dir, "crash.log"), "UTF-8");
            t.printStackTrace(pw);
            pw.close();
        } catch (Exception ignored) {}
        String detail = t.getClass().getSimpleName() + ": " + String.valueOf(t.getMessage());
        boolean dark = isSystemDark();
        TextView tv = new TextView(this);
        tv.setBackgroundColor(dark ? DARK_BG : LIGHT_BG);
        tv.setTextColor(dark ? Color.rgb(240, 240, 237) : Color.rgb(20, 20, 20));
        tv.setTextSize(15);
        tv.setPadding(56, 120, 56, 56);
        tv.setText("Gauge 启动失败 / failed to start\n\n" + detail +
                "\n\n请更新 Android System WebView 后重试。\nUpdate Android System WebView and try again.\nLog: GaugeData/logs/crash.log");
        setContentView(tv);
    }

    private boolean isSystemDark() {
        int mode = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        return mode == Configuration.UI_MODE_NIGHT_YES;
    }

    private boolean preferredDark() {
        try {
            String raw = readState();
            if (raw != null && !raw.isEmpty()) {
                String theme = new JSONObject(raw).optJSONObject("settings").optString("theme", "system");
                if ("dark".equals(theme)) return true;
                if ("light".equals(theme)) return false;
            }
        } catch (Exception ignored) {}
        return isSystemDark();
    }

    private void configureSystemBars(boolean dark) {
        Window w = getWindow();
        int bg = dark ? DARK_BG : LIGHT_BG;
        w.setStatusBarColor(bg);
        w.setNavigationBarColor(bg);
        int lightFlags = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS |
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                c.setSystemBarsAppearance(dark ? 0 : lightFlags, lightFlags);
            }
        } else {
            int flags = dark ? 0 : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 26 && !dark) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            w.getDecorView().setSystemUiVisibility(flags);
        }
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = w.getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            w.setAttributes(lp);
        }
    }

    // ------------------------------------------------------------- storage

    private void ensureDataDir() {
        for (String p : new String[]{"config", "data", "cache/images", "logs"}) {
            File d = new File(dataRoot, p);
            if (!d.exists()) d.mkdirs();
        }
    }

    private void clearImageCacheFiles() {
        File dir = new File(dataRoot, "cache/images");
        File[] files = dir.listFiles();
        if (files != null) for (File f : files) deleteRecursive(f);
        File wv = new File(getCacheDir(), "WebView");
        deleteRecursive(wv);
    }

    private void deleteRecursive(File f) {
        if (f == null || !f.exists()) return;
        if (f.isDirectory()) {
            File[] kids = f.listFiles();
            if (kids != null) for (File k : kids) deleteRecursive(k);
        }
        //noinspection ResultOfMethodCallIgnored
        f.delete();
    }

    private synchronized void recordLaunch() {
        long now = System.currentTimeMillis();
        long first = prefs.getLong("first_launch", 0);
        if (first == 0) first = now;
        JSONArray launches = loadLaunchArray();
        try {
            launches.put(new JSONObject().put("at", now).put("seconds", 0));
        } catch (Exception ignored) {}
        while (launches.length() > 200) launches.remove(0);
        prefs.edit()
                .putLong("first_launch", first)
                .putLong("last_launch", now)
                .putString("launches", launches.toString())
                .apply();
        lastBeat = SystemClock.elapsedRealtime();
        foreground = true;
    }

    private JSONArray loadLaunchArray() {
        try {
            return new JSONArray(prefs.getString("launches", "[]"));
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    private synchronized void beat(int ignoredSeconds) {
        long now = SystemClock.elapsedRealtime();
        if (lastBeat == 0) {
            lastBeat = now;
            return;
        }
        long delta = (now - lastBeat) / 1000L;
        lastBeat = now;
        if (delta <= 0) return;
        if (delta > 120) delta = 120;
        long total = prefs.getLong("total_seconds", 0) + delta;
        JSONArray launches = loadLaunchArray();
        if (launches.length() > 0) {
            try {
                JSONObject last = launches.getJSONObject(launches.length() - 1);
                last.put("seconds", last.optLong("seconds", 0) + delta);
            } catch (Exception ignored) {}
        }
        prefs.edit()
                .putLong("total_seconds", total)
                .putString("launches", launches.toString())
                .apply();
    }

    private String usageJSON() {
        beat(0);
        try {
            JSONObject o = new JSONObject();
            o.put("firstLaunch", prefs.getLong("first_launch", 0));
            o.put("lastLaunch", prefs.getLong("last_launch", 0));
            o.put("totalSeconds", prefs.getLong("total_seconds", 0));
            o.put("launches", loadLaunchArray());
            return o.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    private synchronized String readState() {
        File f = new File(dataRoot, "config/state.json");
        if (!f.exists()) return "";
        try (FileInputStream in = new FileInputStream(f)) {
            byte[] buf = new byte[(int) f.length()];
            int n = in.read(buf);
            return n > 0 ? new String(buf, 0, n, StandardCharsets.UTF_8) : "";
        } catch (Exception e) {
            return "";
        }
    }

    private synchronized void writeState(String json) {
        try {
            File dir = new File(dataRoot, "config");
            if (!dir.exists()) dir.mkdirs();
            File tmp = new File(dir, "state.json.tmp");
            try (FileOutputStream out = new FileOutputStream(tmp)) {
                out.write(json.getBytes(StandardCharsets.UTF_8));
            }
            File target = new File(dir, "state.json");
            if (!tmp.renameTo(target)) {
                deleteRecursive(target);
                tmp.renameTo(target);
            }
        } catch (Exception ignored) {}
    }

    // ------------------------------------------------------------- lifecycle

    @Override
    protected void onPause() {
        beat(0);
        foreground = false;
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (!foreground) {
            lastBeat = SystemClock.elapsedRealtime();
            foreground = true;
        }
    }

    @Override
    protected void onDestroy() {
        beat(0);
        if (webView != null) webView.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    // ------------------------------------------------------------- bridge

    public class Bridge {
        @JavascriptInterface
        public String getState() {
            return readState();
        }

        @JavascriptInterface
        public void saveState(String json) {
            writeState(json);
        }

        @JavascriptInterface
        public String getUsage() {
            return usageJSON();
        }

        @JavascriptInterface
        public void beat(int seconds) {
            MainActivity.this.beat(seconds);
        }

        @JavascriptInterface
        public void openInAppBrowser(String raw, final boolean darkTheme) {
            if (raw == null) return;
            Uri u = Uri.parse(raw);
            String scheme = u.getScheme() == null ? "" : u.getScheme().toLowerCase();
            if (!"https".equals(scheme) && !"http".equals(scheme)) return;
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(MainActivity.this, BrowserActivity.class);
                    intent.putExtra("url", raw);
                    intent.putExtra("dark", darkTheme);
                    startActivity(intent);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "No browser activity", Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void setThemeChrome(final boolean dark) {
            runOnUiThread(() -> configureSystemBars(dark));
        }

        @JavascriptInterface
        public String getInfo() {
            try {
                return new JSONObject()
                        .put("version", VERSION)
                        .put("dataDir", dataRoot.getAbsolutePath())
                        .put("platform", "android")
                        .put("mobile", true)
                        .toString();
            } catch (Exception e) {
                return "{\"version\":\"" + VERSION + "\",\"platform\":\"android\"}";
            }
        }

        @JavascriptInterface
        public void openExternal(String raw) {
            if (!isSteamWebUrl(raw)) return;
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(raw)));
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "No browser found", Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void quit() {
            runOnUiThread(() -> finish());
        }

        @JavascriptInterface
        public void clearImageCache() {
            runOnUiThread(() -> {
                clearImageCacheFiles();
                if (webView != null) webView.clearCache(true);
            });
        }

        @JavascriptInterface
        public void openConfigFolder() {
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, dataRoot.getAbsolutePath(), Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    // ------------------------------------------------------------- WebView client

    private class Client extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (!"https".equals(uri.getScheme()) || !ASSET_HOST.equals(uri.getHost())) return null;
            String path = uri.getPath() == null ? "/" : uri.getPath();
            try {
                if (path.startsWith("/assets/")) {
                    return serveAsset(path.substring("/assets/".length()));
                }
                if ("/api/steam".equals(path)) {
                    return proxySteam(uri);
                }
                if ("/api/img".equals(path)) {
                    return proxyImage(uri);
                }
                if ("/api/public-ads".equals(path)) {
                    return serveAsset("public-ads.json");
                }
                if ("/api/info".equals(path)) {
                    return jsonResponse("{\"version\":\"" + VERSION + "\",\"platform\":\"android\",\"dataDir\":\"" +
                            escapeJSON(dataRoot.getAbsolutePath()) + "\"}", 200);
                }
                if ("/api/health".equals(path)) {
                    return jsonResponse("{\"ok\":true}", 200);
                }
                return textResponse("Not found", 404);
            } catch (Exception e) {
                return textResponse("Proxy error: " + e.getMessage(), 502);
            }
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if ("https".equals(uri.getScheme()) && ASSET_HOST.equals(uri.getHost())) return false;
            if ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (Exception ignored) {}
                return true;
            }
            return true;
        }
    }

    private WebResourceResponse serveAsset(String rel) throws IOException {
        if (rel.isEmpty() || rel.endsWith("/")) rel += "index.html";
        if (rel.contains("..")) return textResponse("Forbidden", 403);
        InputStream in = getAssets().open(rel);
        String mime = mimeFor(rel);
        String enc = mime.startsWith("text/") || mime.contains("javascript") || mime.contains("json") ? "UTF-8" : null;
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-cache");
        return new WebResourceResponse(mime, enc, 200, "OK", headers, in);
    }

    private WebResourceResponse proxySteam(Uri uri) throws IOException {
        String raw = uri.getQueryParameter("url");
        if (raw == null) return textResponse("Missing url", 400);
        Uri target = Uri.parse(raw);
        if (!"https".equals(target.getScheme()) || !isApiHost(target.getHost())) {
            return textResponse("URL not allowed", 400);
        }
        String lang = uri.getQueryParameter("lang");
        boolean playerRequest = target.toString().contains("GetNumberOfCurrentPlayers");
        byte[] body = null;
        String ctype = "application/json; charset=utf-8";
        int status = 200;
        int attempts = playerRequest ? 1 : 2;
        for (int attempt = 0; attempt < attempts; attempt++) {
            HttpURLConnection conn = null;
            try {
                conn = openConnection(target.toString(), "application/json, text/plain, */*", lang);
                if (playerRequest) conn.setReadTimeout(5000);
                status = conn.getResponseCode();
                InputStream stream = status >= 400 ? conn.getErrorStream() : conn.getInputStream();
                body = readLimited(stream, 8 * 1024 * 1024);
                String ct = conn.getContentType();
                if (ct != null && !ct.isEmpty()) ctype = ct;
                if (status == 429 || status >= 500) {
                    try { Thread.sleep(1000L * (attempt + 1)); } catch (InterruptedException ignored) {}
                    continue;
                }
                break;
            } catch (Exception e) {
                if (attempt == 1) throw new IOException(e);
                try { Thread.sleep(700L); } catch (InterruptedException ignored) {}
            } finally {
                if (conn != null) conn.disconnect();
            }
        }
        if (body == null) body = new byte[0];
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-store");
        headers.put("Access-Control-Allow-Origin", "*");
        return new WebResourceResponse(stripCharset(ctype), "UTF-8", status, "OK", headers, new ByteArrayInputStream(body));
    }

    private WebResourceResponse proxyImage(Uri uri) throws IOException {
        String raw = uri.getQueryParameter("url");
        if (raw == null) return textResponse("Missing url", 400);
        Uri target = Uri.parse(raw);
        if (!"https".equals(target.getScheme()) || !isImageHost(target.getHost())) {
            return textResponse("Image URL not allowed", 400);
        }
        String name = sha1(raw);
        File dir = new File(dataRoot, "cache/images");
        if (!dir.exists()) dir.mkdirs();
        File f = new File(dir, name + ".img");
        byte[] body;
        String ctype;
        if (f.exists() && f.length() > 0) {
            body = readFile(f);
            ctype = detectMime(body);
        } else {
            HttpURLConnection conn = null;
            try {
                conn = openConnection(raw, "image/avif,image/webp,image/apng,image/*,*/*;q=0.8", null);
                int code = conn.getResponseCode();
                if (code != 200) return textResponse("Image fetch failed", 502);
                body = readLimited(conn.getInputStream(), 16 * 1024 * 1024);
                String ct = conn.getContentType();
                ctype = ct == null || ct.isEmpty() ? detectMime(body) : stripCharset(ct);
                try (FileOutputStream out = new FileOutputStream(f)) {
                    out.write(body);
                }
            } finally {
                if (conn != null) conn.disconnect();
            }
        }
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "public, max-age=86400");
        return new WebResourceResponse(ctype, null, 200, "OK", headers, new ByteArrayInputStream(body));
    }

    private HttpURLConnection openConnection(String target, String accept, String lang) throws IOException {
        URL url = new URL(target);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(20000);
        conn.setInstanceFollowRedirects(true);
        conn.setRequestMethod("GET");
        conn.setRequestProperty("User-Agent", UA);
        conn.setRequestProperty("Accept", accept);
        conn.setRequestProperty("Accept-Language", acceptLanguage(lang));
        conn.setRequestProperty("Referer", "https://store.steampowered.com/");
        conn.setRequestProperty("Cookie", "birthtime=283993201; lastagecheckage=1-0-1990; mature_content=1; Steam_Language=english");
        conn.setRequestProperty("Accept-Encoding", "identity");
        conn.setRequestProperty("Sec-Ch-Ua", "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"");
        conn.setRequestProperty("Sec-Ch-Ua-Mobile", "?1");
        conn.setRequestProperty("Sec-Ch-Ua-Platform", "\"Android\"");
        throttle();
        return conn;
    }

    private static synchronized void throttle() {
        long now = SystemClock.elapsedRealtime();
        long wait = 120 - (now - lastNetwork);
        if (wait > 0) {
            try { Thread.sleep(wait); } catch (InterruptedException ignored) {}
        }
        lastNetwork = SystemClock.elapsedRealtime();
    }

    private String acceptLanguage(String lang) {
        if (lang == null) lang = "zh";
        switch (lang) {
            case "en": return "en-US,en;q=0.9";
            case "ja": return "ja-JP,ja;q=0.9,en;q=0.6";
            case "de": return "de-DE,de;q=0.9,en;q=0.6";
            case "ko": return "ko-KR,ko;q=0.9,en;q=0.6";
            case "ar": return "ar,en;q=0.6";
            default: return "zh-CN,zh;q=0.9,en;q=0.7";
        }
    }

    private boolean isApiHost(String host) {
        if (host == null) return false;
        for (String h : API_HOSTS) if (host.equalsIgnoreCase(h)) return true;
        return false;
    }

    private boolean isImageHost(String host) {
        if (host == null) return false;
        host = host.toLowerCase(Locale.ROOT);
        for (String suffix : IMAGE_SUFFIXES) {
            if (host.equals(suffix) || host.endsWith("." + suffix)) return true;
        }
        return false;
    }

    private boolean isSteamWebUrl(String raw) {
        try {
            Uri u = Uri.parse(raw);
            if (!"https".equals(u.getScheme()) || u.getHost() == null) return false;
            String h = u.getHost().toLowerCase(Locale.ROOT);
            return h.equals("steampowered.com") || h.endsWith(".steampowered.com")
                    || h.equals("steamcommunity.com") || h.endsWith(".steamcommunity.com")
                    || h.equals("valvesoftware.com") || h.endsWith(".valvesoftware.com")
                    || h.equals("steamstatic.com") || h.endsWith(".steamstatic.com")
                    || h.equals("eccdnx.com") || h.endsWith(".eccdnx.com");
        } catch (Exception e) {
            return false;
        }
    }

    private static byte[] readLimited(InputStream in, int max) throws IOException {
        if (in == null) return new byte[0];
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        int total = 0;
        while ((n = in.read(buf)) != -1) {
            total += n;
            if (total > max) throw new IOException("response too large");
            out.write(buf, 0, n);
        }
        in.close();
        return out.toByteArray();
    }

    private static byte[] readFile(File f) throws IOException {
        byte[] b = new byte[(int) f.length()];
        try (FileInputStream in = new FileInputStream(f)) {
            int off = 0;
            while (off < b.length) {
                int n = in.read(b, off, b.length - off);
                if (n < 0) break;
                off += n;
            }
        }
        return b;
    }

    private static String detectMime(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8) return "image/jpeg";
        if (b.length >= 8 && b[0] == (byte) 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "image/png";
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F') return "image/webp";
        if (b.length >= 6 && b[0] == 'G' && b[1] == 'I' && b[2] == 'F') return "image/gif";
        return "image/jpeg";
    }

    private static String stripCharset(String ctype) {
        if (ctype == null || ctype.isEmpty()) return "application/json";
        int i = ctype.indexOf(';');
        return i >= 0 ? ctype.substring(0, i).trim() : ctype;
    }

    private static String mimeFor(String name) {
        String n = name.toLowerCase(Locale.ROOT);
        if (n.endsWith(".html") || n.endsWith(".htm")) return "text/html";
        if (n.endsWith(".css")) return "text/css";
        if (n.endsWith(".js")) return "application/javascript";
        if (n.endsWith(".json")) return "application/json";
        if (n.endsWith(".svg")) return "image/svg+xml";
        if (n.endsWith(".png")) return "image/png";
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
        if (n.endsWith(".webp")) return "image/webp";
        if (n.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    private static String sha1(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] d = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte x : d) sb.append(String.format("%02x", x));
            return sb.toString();
        } catch (Exception e) {
            return Integer.toHexString(input.hashCode());
        }
    }

    private static String escapeJSON(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }

    private static WebResourceResponse jsonResponse(String body, int status) {
        Map<String, String> h = new HashMap<>();
        h.put("Access-Control-Allow-Origin", "*");
        return new WebResourceResponse("application/json", "UTF-8", status, "OK", h,
                new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)));
    }

    private static WebResourceResponse textResponse(String body, int status) {
        return new WebResourceResponse("text/plain", "UTF-8", status, "Error", new HashMap<>(),
                new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)));
    }
}
