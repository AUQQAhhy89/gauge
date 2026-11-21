/* Gauge — shared UI for the Windows host and the Android WebView. */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const PLACEHOLDER = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="460" height="215" viewBox="0 0 460 215">' +
    '<rect width="460" height="215" fill="#d9d9d6"/>' +
    '<rect x="0.5" y="0.5" width="459" height="214" fill="none" stroke="#c2c2bf"/>' +
    '<text x="22" y="112" font-family="monospace" font-size="10" fill="#777" letter-spacing="2">STEAM NOTES</text>' +
    '</svg>'
  );
  window.SV_PLACEHOLDER = PLACEHOLDER;

  const DEFAULT_STATE = {
    settings: { language: "zh", country: "CN", disclaimerAccepted: false, disclaimerVersion: 1, mirror: "official", theme: "system", publicService: false, platform: "steam" },
    history: [],
    favorites: [],
    prices: {}
  };

  const STEAM_WEB_SUFFIXES = ["steampowered.com", "steamcommunity.com", "valvesoftware.com", "steamstatic.com", "eccdnx.com"];
  const QUICK_LINKS = [
    ["store", "https://store.steampowered.com/"],
    ["community", "https://steamcommunity.com/"],
    ["support", "https://help.steampowered.com/"],
    ["workshop", "https://steamcommunity.com/workshop/"],
    ["news", "https://store.steampowered.com/news/"],
    ["about", "https://store.steampowered.com/about/"]
  ];

  const PLATFORMS = [
    { key: "steam", name: "Steam" },
    { key: "ps", name: "PlayStation" },
    { key: "xbox", name: "Xbox" },
    { key: "epic", name: "Epic Games" },
    { key: "wegame", name: "WeGame" }
  ];

  const PLATFORM_LOCALES = {
    ps: { zh: "zh-hans-cn", en: "en-us", ja: "ja-jp", de: "de-de", ko: "ko-kr", ar: "ar-ae" },
    xbox: { zh: "zh-CN", en: "en-US", ja: "ja-JP", de: "de-DE", ko: "ko-KR", ar: "ar-SA" },
    epic: { zh: "zh-CN", en: "en-US", ja: "ja-JP", de: "de-DE", ko: "ko-KR", ar: "ar-SA" },
    wegame: { zh: "zh-CN" }
  };

  function platformMeta(key) {
    return PLATFORMS.find((p) => p.key === key) || PLATFORMS[0];
  }

  function platformLocale(key) {
    const map = PLATFORM_LOCALES[key] || {};
    return map[SV.lang] || map.en || "en-US";
  }

  function platformHome(key) {
    const loc = platformLocale(key);
    if (key === "ps") return `https://store.playstation.com/${loc}/`;
    if (key === "xbox") return `https://www.xbox.com/${loc}/`;
    if (key === "epic") return `https://store.epicgames.com/${loc}/`;
    if (key === "wegame") return "https://www.wegame.com.cn/store/";
    return "https://store.steampowered.com/";
  }

  function platformSearchURL(key, query) {
    const q = encodeURIComponent(query);
    const loc = platformLocale(key);
    if (key === "ps") return `https://store.playstation.com/${loc}/search/${q}`;
    if (key === "xbox") return `https://www.xbox.com/${loc}/search/results?q=${q}`;
    if (key === "epic") return `https://store.epicgames.com/${loc}/browse?q=${q}`;
    if (key === "wegame") return "https://www.wegame.com.cn/store/";
    return "";
  }

  function platformLinks(key) {
    const loc = platformLocale(key);
    if (key === "ps") return [
      ["store", platformHome("ps")],
      ["support", `https://www.playstation.com/${loc}/support/`]
    ];
    if (key === "xbox") return [
      ["store", platformHome("xbox")],
      ["gamePass", `https://www.xbox.com/${loc}/xbox-game-pass`],
      ["support", "https://support.xbox.com/"]
    ];
    if (key === "epic") return [
      ["store", platformHome("epic")],
      ["freeGames", `https://store.epicgames.com/${loc}/free-games`],
      ["support", "https://www.epicgames.com/help/"]
    ];
    if (key === "wegame") return [
      ["store", platformHome("wegame")],
      ["support", "https://www.wegame.com.cn/"]
    ];
    return QUICK_LINKS;
  }

  const STORE_WEB_SUFFIXES = [
    "steampowered.com", "steamcommunity.com", "valvesoftware.com", "steamstatic.com", "eccdnx.com",
    "playstation.com", "xbox.com", "epicgames.com", "wegame.com.cn"
  ];

  function isStoreWebURL(raw) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "https:") return false;
      return STORE_WEB_SUFFIXES.some((s) => u.hostname === s || u.hostname.endsWith("." + s));
    } catch {
      return false;
    }
  }

  const SV = {
    lang: "zh",
    country: "CN",
    route: "search",
    state: null,
    usage: null,
    info: { version: "1.5.0-beta", dataDir: "" },
    mirror: "official",
    effectiveTheme: "light",
    publicAds: null,
    publicAdIndex: 0,
    platform: "steam",
    lastQuery: "",
    results: null,
    featured: null,
    featuredLoading: false,
    detailData: null,
    detailPlayers: null,
    detailAppID: null,
    detailToken: 0,
    playerTimer: null,
    searchAbort: null,
    setupActive: false,
    isAndroid: false,
    toastTimer: null,
    saveTimer: null,
    lastFocus: null
  };
  window.SV = SV;

  ["gesturestart", "gesturechange", "gestureend"].forEach((evt) => {
    document.addEventListener(evt, (event) => event.preventDefault(), { passive: false });
  });

  // ------------------------------------------------------------- helpers

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stripTags(html) {
    if (!html) return "";
    const box = document.createElement("div");
    box.innerHTML = String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n");
    return (box.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  }

  function stripHTMLList(html) {
    if (!html) return "";
    const text = String(html)
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n");
    return stripTags(text).replace(/\n{3,}/g, "\n\n").trim();
  }

  function formatMoney(cents, currency, lang) {
    if (cents === null || cents === undefined || Number.isNaN(Number(cents))) return "—";
    try {
      return new Intl.NumberFormat(lang, {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: 2
      }).format(Number(cents) / 100);
    } catch {
      return (Number(cents) / 100).toFixed(2) + " " + (currency || "");
    }
  }

  function localISODate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function currentCurrency() {
    return (COUNTRIES.find((c) => c.cc === SV.country) || COUNTRIES[0]).currency;
  }

  function steamLang() {
    return languageMeta(SV.lang).steam;
  }

  function isSteamWebURL(raw) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "https:") return false;
      return STEAM_WEB_SUFFIXES.some((s) => u.hostname === s || u.hostname.endsWith("." + s));
    } catch {
      return false;
    }
  }

  function imageURL(raw) {
    if (!raw) return PLACEHOLDER;
    if (SV.mirror === "china") {
      try {
        const u = new URL(raw);
        // Steam's China CDN serves the current /store_item_assets/ artwork.
        if (/(^|\.)steamstatic\.com$/i.test(u.hostname) && u.pathname.startsWith("/store_item_assets/")) {
          u.hostname = "shared.st.dl.eccdnx.com";
          raw = u.toString();
        }
      } catch {}
    }
    return "/api/img?url=" + encodeURIComponent(raw);
  }

  function storeURLFor(appid) {
    if (SV.mirror === "china") {
      return `https://store.st.dl.eccdnx.com/app/${appid}/?l=${encodeURIComponent(steamLang())}`;
    }
    return `https://store.steampowered.com/app/${appid}/`;
  }

  function headerForAppID(appid) {
    return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;
  }

  function capsuleForAppID(appid) {
    return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/capsule_231x87.jpg`;
  }

  function platformLabel(platforms) {
    if (!platforms) return "";
    const out = [];
    if (platforms.windows) out.push("WIN");
    if (platforms.mac) out.push("MAC");
    if (platforms.linux) out.push("LINUX");
    return out.join(" · ");
  }

  function toast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(SV.toastTimer);
    SV.toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch {}
      ta.remove();
      return ok;
    }
  }

  function openImageModal(url, title) {
    openModal({
      title: title || t("detail.about"),
      body: `<img class="lightbox-img" src="${url}" alt="">`,
      footer: `<button class="btn" type="button" data-close>${escapeHTML(t("settings.close"))}</button>`,
      wide: true
    });
  }

  function closeModal() {
    const root = $("#modalRoot");
    if (!root) return;
    root.innerHTML = "";
    document.body.classList.remove("modal-open");
    if (SV.lastFocus && SV.lastFocus.focus) {
      try { SV.lastFocus.focus(); } catch {}
    }
    SV.lastFocus = null;
  }

  function openModal({ title, body, footer = "", wide = false, onMount = null }) {
    const root = $("#modalRoot");
    SV.lastFocus = document.activeElement;
    root.innerHTML = `
      <div class="modal-backdrop" data-backdrop>
        <div class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}">
          <div class="modal-head">
            <h2>${escapeHTML(title)}</h2>
            <button class="modal-close" type="button" data-close aria-label="Close">×</button>
          </div>
          <div class="modal-body">${body}</div>
          ${footer ? `<div class="modal-foot">${footer}</div>` : ""}
        </div>
      </div>`;
    document.body.classList.add("modal-open");
    root.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
    root.querySelector("[data-backdrop]").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
    const close = root.querySelector(".modal-close");
    if (close) close.focus({ preventScroll: true });
    if (onMount) onMount(root);
  }

  // ------------------------------------------------------------- persistence

  function normaliseState(raw) {
    const s = raw && typeof raw === "object" ? raw : {};
    const settings = Object.assign(
      { language: "zh", country: "CN", disclaimerAccepted: false, disclaimerVersion: 1, mirror: "official", theme: "system", publicService: false, platform: "steam" },
      s.settings || {}
    );
    if (!I18N[settings.language]) settings.language = "zh";
    if (!/^[A-Z]{2}$/.test(String(settings.country))) settings.country = "CN";
    if (settings.mirror !== "china") settings.mirror = "official";
    if (!["system", "light", "dark"].includes(settings.theme)) settings.theme = "system";
    settings.publicService = !!settings.publicService;
    if (!PLATFORMS.some((p) => p.key === settings.platform)) settings.platform = "steam";
    return {
      settings,
      history: Array.isArray(s.history) ? s.history.filter((x) => x && (x.kind === "search" || x.kind === "game")) : [],
      favorites: Array.isArray(s.favorites)
        ? s.favorites.filter((x) => x && Number(x.appid)).map((x) => ({
            appid: Number(x.appid),
            name: String(x.name || x.appid),
            image: String(x.image || ""),
            at: Number(x.at) || Date.now(),
            price: x.price !== null && x.price !== undefined && Number.isFinite(Number(x.price)) ? Number(x.price) : null,
            currency: String(x.currency || ""),
            free: !!x.free,
            discount: Number(x.discount) || 0
          })).slice(0, 200)
        : [],
      prices: s.prices && typeof s.prices === "object" ? s.prices : {}
    };
  }

  async function loadState() {
    SV.isAndroid = !!(window.Android && typeof window.Android.getState === "function");
    if (SV.isAndroid) {
      try {
        const raw = window.Android.getState();
        SV.state = raw ? normaliseState(JSON.parse(raw)) : normaliseState(DEFAULT_STATE);
      } catch {
        SV.state = normaliseState(DEFAULT_STATE);
      }
      try {
        SV.info = JSON.parse(window.Android.getInfo() || "{}");
      } catch {
        SV.info = { version: "1.5.0-beta", dataDir: "" };
      }
      try {
        SV.usage = JSON.parse(window.Android.getUsage() || "{}");
      } catch {
        SV.usage = {};
      }
      return;
    }

    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error("state " + res.status);
      const data = await res.json();
      SV.state = normaliseState(data.state);
      SV.info = { version: data.version || "1.5.0-beta", dataDir: data.dataDir || "", platform: data.platform || "" };
      SV.usage = data.usage || {};
    } catch (err) {
      console.error(err);
      SV.state = normaliseState(DEFAULT_STATE);
      SV.info = { version: "1.5.0-beta", dataDir: "" };
    }
  }

  function flushState() {
    if (!SV.state) return;
    const payload = JSON.stringify(SV.state);
    if (SV.isAndroid) {
      try { window.Android.saveState(payload); } catch {}
      return;
    }
    fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true
    }).catch(() => {});
  }

  function saveSoon() {
    clearTimeout(SV.saveTimer);
    SV.saveTimer = setTimeout(flushState, 260);
  }

  // ------------------------------------------------------------- language / setup

  function updateOnlineState() {
    const banner = $("#offlineBanner");
    if (!banner) return;
    const offline = !navigator.onLine;
    banner.hidden = !offline;
    banner.textContent = offline ? t("offline.text") : "";
    if (!offline && SV.state && SV.route === "search" && !SV.results && SV.platform === "steam") loadFeatured();
  }

  function applyLanguage() {
    const meta = languageMeta(SV.lang);
    document.documentElement.lang = SV.lang;
    document.documentElement.dir = SV.lang === "ar" ? "rtl" : "ltr";
    document.body.dir = SV.lang === "ar" ? "rtl" : "ltr";

    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = t(key);
      if (value !== undefined) el.textContent = value;
    });
    const input = $("#searchInput");
    if (input) input.placeholder = t("search.placeholder");
    updateRegionLabel();
    const footerBuild = $("#footerBuild");
    if (footerBuild) footerBuild.textContent = "v" + (SV.info.version || "1.5.0-beta");
    updateOnlineState();
    document.title = "Gauge";
  }

  function updateRegionLabel() {
    const el = $("#regionLabel");
    if (!el) return;
    const currency = currentCurrency();
    el.textContent = `${countryName(SV.country, SV.lang)} · ${currency}`;
  }

  function applyTheme() {
    const pref = (SV.state && SV.state.settings.theme) || "system";
    const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    SV.effectiveTheme = dark ? "dark" : "light";
    document.documentElement.dataset.theme = SV.effectiveTheme;
    document.documentElement.style.colorScheme = SV.effectiveTheme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? "#1b1b1a" : "#e9e9e7";
    try { localStorage.setItem("gauge-theme", pref); } catch {}
    if (SV.isAndroid && window.Android && window.Android.setThemeChrome) {
      try { window.Android.setThemeChrome(dark); } catch {}
    }
  }

  function setTheme(value) {
    if (!["system", "light", "dark"].includes(value)) return;
    SV.state.settings.theme = value;
    saveSoon();
    applyTheme();
    $$("[data-theme-choice]").forEach((b) => {
      const active = b.getAttribute("data-theme-choice") === value;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function setLanguage(code) {
    if (!I18N[code]) return;
    SV.lang = code;
    SV.state.settings.language = code;
    SV.featured = null;
    saveSoon();
    applyLanguage();
  }

  function applyRegion(cc, { reload = true } = {}) {
    SV.country = cc;
    SV.state.settings.country = cc;
    SV.featured = null;
    saveSoon();
    updateRegionLabel();
    if (reload && SV.route === "game" && SV.detailAppID) loadGame(SV.detailAppID);
    if (reload && SV.route === "search" && SV.lastQuery) doSearch(SV.lastQuery);
    if (reload && SV.route === "search" && !SV.lastQuery) renderSearchView();
  }

  function setMirror(value) {
    if (value !== "official" && value !== "china") return;
    SV.mirror = value;
    SV.state.settings.mirror = value;
    saveSoon();
    if (SV.route === "game" && SV.detailAppID) {
      loadGame(SV.detailAppID);
    } else if (SV.route === "web") {
      renderWebView();
    } else if (SV.route === "saved") {
      renderSavedView();
    } else if (SV.route === "search") {
      if (SV.results) renderResults(SV.results, SV.lastQuery);
      renderMirrorHint($("#mirrorHint"));
      renderFeatured();
    }
  }

  function setPlatform(key) {
    if (!PLATFORMS.some((p) => p.key === key)) return;
    SV.platform = key;
    SV.state.settings.platform = key;
    SV.results = null;
    SV.lastQuery = "";
    saveSoon();
    if (SV.route === "game") {
      location.hash = "#/";
    } else {
      route();
    }
  }

  function renderPlatformTabs() {
    const el = $("#platformTabs");
    if (!el) return;
    el.innerHTML = PLATFORMS.map((p) =>
      `<button type="button" class="platform-tab ${p.key === SV.platform ? "active" : ""}" data-platform="${p.key}" aria-pressed="${p.key === SV.platform ? "true" : "false"}">${escapeHTML(p.name)}</button>`
    ).join("");
    el.querySelectorAll("[data-platform]").forEach((b) => b.addEventListener("click", () => {
      if (b.getAttribute("data-platform") !== SV.platform) setPlatform(b.getAttribute("data-platform"));
    }));
  }

  function renderPlatformPanel() {
    const panel = $("#platformPanel");
    if (!panel) return;
    const meta = platformMeta(SV.platform);
    const links = platformLinks(SV.platform).map(([key, url]) => {
      const labelKey = ["store", "support", "community"].includes(key) ? "web." + key : "platform." + key;
      return `<button class="btn" type="button" data-platform-url="${escapeHTML(url)}">${escapeHTML(t(labelKey))} ↗</button>`;
    }).join("");
    panel.hidden = false;
    panel.innerHTML = `
      <div class="platform-note">
        <span class="platform-beta">${escapeHTML(t("platform.beta"))}</span>
        <p>${escapeHTML(t("platform.betaNote"))}</p>
      </div>
      <div class="platform-links">${links}</div>`;
    panel.querySelectorAll("[data-platform-url]").forEach((b) => b.addEventListener("click", () => {
      openURL(b.getAttribute("data-platform-url"));
    }));
  }

  function renderMirrorHint(container) {
    if (!container) return;
    const show = SV.platform === "steam" && SV.lang === "zh" && SV.mirror !== "china";
    container.hidden = !show;
    if (!show) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = `
      <p>${escapeHTML(t("mirror.notice"))}</p>
      <button class="btn small" id="mirrorSwitch" type="button">${escapeHTML(t("mirror.switch"))}</button>`;
    const btn = container.querySelector("#mirrorSwitch");
    if (btn) btn.addEventListener("click", () => {
      setMirror("china");
      toast(t("mirror.switched"));
    });
  }

  async function loadPublicAds() {
    if (SV.publicAds) return SV.publicAds;
    try {
      const res = await fetch("/api/public-ads?lang=" + encodeURIComponent(SV.lang), { cache: "no-store" });
      if (!res.ok) throw new Error("public ads " + res.status);
      SV.publicAds = await res.json();
    } catch {
      SV.publicAds = {};
    }
    return SV.publicAds;
  }

  function publicAdsForLang() {
    const data = SV.publicAds || {};
    return data[SV.lang] || data.en || [];
  }

  function publicAdCard(ad) {
    return `<div class="public-card">
      <span class="public-badge">${escapeHTML(t("public.badge"))}</span>
      <div class="public-copy">
        <h3>${escapeHTML(ad.title || "")}</h3>
        <p>${escapeHTML(ad.body || "")}</p>
        <a href="${escapeHTML(ad.url || "#")}" target="_blank" rel="noopener">${escapeHTML(ad.source || "Public service")} ↗</a>
      </div>
    </div>`;
  }

  function renderPublicAd() {
    const box = $("#publicAd");
    if (!box) return;
    if (!SV.state || !SV.state.settings.publicService || SV.route !== "search") {
      box.hidden = true;
      return;
    }
    const ads = publicAdsForLang();
    if (!ads.length) {
      box.hidden = true;
      if (!SV.publicAds) loadPublicAds().then(() => renderPublicAd());
      return;
    }
    const ad = ads[SV.publicAdIndex % ads.length];
    box.hidden = false;
    box.innerHTML = `${publicAdCard(ad)}<button class="btn small public-next" id="publicNext" type="button">${escapeHTML(t("public.next"))}</button>`;
    const next = $("#publicNext");
    if (next) next.addEventListener("click", () => {
      SV.publicAdIndex = (SV.publicAdIndex + 1) % ads.length;
      renderPublicAd();
    });
  }

  function showSetup() {
    SV.setupActive = true;
    const root = $("#setupRoot");
    root.innerHTML = "";
    renderSetupStep("language");
  }

  function setupShell(step, inner) {
    return `
      <div class="setup">
        <div class="setup-inner">
          <div class="setup-top">
            <span class="setup-brand">Gauge</span>
            <span class="setup-step">${Number(step)} / 4</span>
          </div>
          <div class="setup-main">${inner}</div>
        </div>
      </div>`;
  }

  function renderSetupStep(step) {
    const root = $("#setupRoot");
    if (!root) return;

    if (step === "language") {
      root.innerHTML = setupShell("01", `
        <h1>${escapeHTML(t("setup.languageTitle"))}</h1>
        <p class="setup-sub">${escapeHTML(t("setup.languageSub"))}</p>
        <div class="setup-options">
          ${LANGUAGES.map((l) => `
            <button class="setup-choice" data-lang="${l.code}" type="button">
              <span><span class="native">${escapeHTML(l.native)}</span><br><span class="code">${escapeHTML(l.english)}</span></span>
              <span class="arrow">↗</span>
            </button>`).join("")}
        </div>
      `);
      root.querySelectorAll("[data-lang]").forEach((btn) => {
        btn.addEventListener("click", () => {
          setLanguage(btn.getAttribute("data-lang"));
          SV.state.settings.language = btn.getAttribute("data-lang");
          saveSoon();
          renderSetupStep("public");
        });
      });
      return;
    }

    if (step === "public") {
      root.innerHTML = setupShell("02", `
        <h1>${escapeHTML(t("public.askTitle"))}</h1>
        <p class="setup-sub">${escapeHTML(t("public.askSub"))}</p>
        <p class="setup-note">${escapeHTML(t("public.note"))}</p>
        <div class="setup-public" id="publicPreview" hidden></div>
        <div class="setup-actions" id="publicChoice">
          <button class="setup-btn solid" id="publicYes" type="button">${escapeHTML(t("public.yes"))}</button>
          <button class="setup-btn" id="publicNo" type="button">${escapeHTML(t("public.no"))}</button>
        </div>
        <div class="setup-actions" id="publicContinueWrap" hidden>
          <button class="setup-btn solid" id="publicContinue" type="button">${escapeHTML(t("public.continue"))}</button>
        </div>
      `);
      $("#publicYes", root).addEventListener("click", async () => {
        SV.state.settings.publicService = true;
        saveSoon();
        $("#publicChoice", root).hidden = true;
        const preview = $("#publicPreview", root);
        preview.hidden = false;
        preview.innerHTML = `<p class="hint-text">${escapeHTML(t("common.loading"))}</p>`;
        await loadPublicAds();
        const ads = publicAdsForLang();
        preview.innerHTML = ads.length ? publicAdCard(ads[0]) : `<p class="hint-text">${escapeHTML(t("public.empty"))}</p>`;
        $("#publicContinueWrap", root).hidden = false;
        $("#publicContinue", root).addEventListener("click", () => renderSetupStep("disclaimer"));
      });
      $("#publicNo", root).addEventListener("click", () => {
        SV.state.settings.publicService = false;
        saveSoon();
        renderSetupStep("disclaimer");
      });
      return;
    }

    if (step === "disclaimer") {
      root.innerHTML = setupShell("03", `
        <h1>${escapeHTML(t("setup.disclaimerTitle"))}</h1>
        <div class="disclaimer-box">
          <p class="disclaimer-text">${escapeHTML((DISCLAIMER[SV.lang] || DISCLAIMER.zh).join(" "))}</p>
        </div>
        <label class="setup-agree">
          <input type="checkbox" id="agreeBox">
          <span>${escapeHTML(t("setup.agree"))}</span>
        </label>
        <div class="setup-actions">
          <button class="setup-btn solid" id="acceptSetup" type="button" disabled>${escapeHTML(t("setup.accept"))}</button>
          <button class="setup-btn" id="declineSetup" type="button">${escapeHTML(t("setup.decline"))}</button>
        </div>
        <p class="setup-note" id="setupNote"></p>
      `);
      const box = $("#agreeBox", root);
      const accept = $("#acceptSetup", root);
      box.addEventListener("change", () => { accept.disabled = !box.checked; });
      accept.addEventListener("click", () => {
        if (!box.checked) return;
        SV.state.settings.disclaimerAccepted = true;
        SV.state.settings.disclaimerVersion = 1;
        saveSoon();
        renderSetupStep("country");
      });
      $("#declineSetup", root).addEventListener("click", () => {
        $("#setupNote", root).textContent = t("setup.declineNote");
        try { window.close(); } catch {}
      });
      return;
    }

    if (step === "country") {
      const countries = COUNTRIES.map((c) => {
        const name = countryName(c.cc, SV.lang);
        return `<button class="country-choice" data-cc="${c.cc}" type="button">
          <span class="cc">${c.cc} / ${c.currency}</span>
          <span class="cn">${escapeHTML(name)}</span>
        </button>`;
      }).join("");
      root.innerHTML = setupShell("04", `
        <h1>${escapeHTML(t("setup.countryTitle"))}</h1>
        <p class="setup-sub">${escapeHTML(t("setup.countrySub"))}</p>
        <div class="setup-scroll"><div class="setup-country-grid">${countries}</div></div>
      `);
      root.querySelectorAll("[data-cc]").forEach((btn) => {
        btn.addEventListener("click", () => {
          SV.state.settings.country = btn.getAttribute("data-cc");
          SV.state.settings.disclaimerAccepted = true;
          saveSoon();
          applyRegion(btn.getAttribute("data-cc"), { reload: false });
          finishSetup();
        });
      });
    }
  }

  function finishSetup() {
    SV.setupActive = false;
    const root = $("#setupRoot");
    if (root) root.innerHTML = "";
    if (location.hash && location.hash !== "#/") {
      location.hash = "#/";
    } else {
      route();
    }
    setTimeout(() => {
      const input = $("#searchInput");
      if (input) input.focus({ preventScroll: true });
    }, 80);
  }

  // ------------------------------------------------------------- remote data

  async function steamResponse(url, signal) {
    if (!navigator.onLine) throw new Error("offline");
    const proxy = "/api/steam?url=" + encodeURIComponent(url) + "&lang=" + encodeURIComponent(SV.lang);
    const ctrl = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, 12000);
    const onAbort = () => ctrl.abort();
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
    try {
      const res = await fetch(proxy, { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error("steam " + res.status);
      return res;
    } catch (err) {
      if (timedOut) throw new Error("timeout");
      throw err;
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onAbort);
    }
  }

  async function steamJSON(url, signal) {
    return (await steamResponse(url, signal)).json();
  }

  async function steamText(url, signal) {
    return (await steamResponse(url, signal)).text();
  }

  async function fetchPlayers(appid, signal) {
    try {
      const url = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appid}`;
      const data = await steamJSON(url, signal);
      if (data && data.response && data.response.player_count !== undefined) {
        return { count: Number(data.response.player_count), source: "steam" };
      }
    } catch (err) {
      if (err && err.name === "AbortError") throw err;
    }
    // The public player endpoint is occasionally unreachable from some
    // networks. SteamCharts exposes the same concurrent figure; use it as an
    // explicitly labelled fallback rather than showing a blank value.
    try {
      const html = await steamText(`https://steamcharts.com/app/${appid}`, signal);
      const m = html.match(/<div class="app-stat">\s*<span class="num">([\d,]+)<\/span>\s*<br>\s*playing/i);
      if (m) return { count: Number(m[1].replace(/,/g, "")), source: "steamcharts" };
    } catch (err) {
      if (err && err.name === "AbortError") throw err;
    }
    return { count: null, source: "" };
  }

  // ------------------------------------------------------------- search

  function renderRecent() {
    const recentSection = $("#recentSection");
    if (!recentSection) return;
    const hist = SV.state.history || [];
    const searches = [];
    const seenQ = new Set();
    for (const item of hist) {
      if (item.kind !== "search") continue;
      const q = String(item.query || "").trim();
      if (!q || seenQ.has(q.toLowerCase())) continue;
      seenQ.add(q.toLowerCase());
      searches.push(item);
      if (searches.length >= 8) break;
    }
    const games = [];
    const seenID = new Set();
    for (const item of hist) {
      if (item.kind !== "game" || seenID.has(item.appid)) continue;
      seenID.add(item.appid);
      games.push(item);
      if (games.length >= 6) break;
    }

    $("#recentSearchBlock").hidden = searches.length === 0;
    $("#recentViewedBlock").hidden = games.length === 0;
    recentSection.hidden = searches.length === 0 && games.length === 0;

    $("#recentSearches").innerHTML = searches.map((s) =>
      `<button type="button" data-query="${escapeHTML(s.query)}">${escapeHTML(s.query)}</button>`
    ).join("");
    $$("#recentSearches [data-query]").forEach((b) => {
      b.addEventListener("click", () => {
        $("#searchInput").value = b.getAttribute("data-query");
        doSearch(b.getAttribute("data-query"));
      });
    });

    $("#recentGames").innerHTML = games.map((g) => `
      <a class="recent-game" href="#/game/${g.appid}" aria-label="${escapeHTML(g.name || g.appid)}">
        <img src="${imageURL(g.image)}" alt="" loading="lazy" onerror="this.onerror=null;this.src=window.SV_PLACEHOLDER">
        <span>${escapeHTML(g.name || g.appid)}</span>
      </a>`).join("");
  }

  function featuredItem(x) {
    const hasPrice = Number.isFinite(Number(x.final_price)) && Number(x.final_price) > 0;
    return {
      id: Number(x.id),
      name: x.name,
      image: x.header_image || x.large_capsule_image || x.small_capsule_image || headerForAppID(x.id),
      price: hasPrice ? {
        currency: x.currency || currentCurrency(),
        initial: Number(x.original_price) || Number(x.final_price),
        final: Number(x.final_price),
        discount: Number(x.discount_percent) || 0
      } : null,
      free: Number(x.final_price) === 0
    };
  }

  function renderFeatured() {
    const box = $("#featuredSections");
    if (!box) return;
    if (SV.platform !== "steam" || !SV.featured || SV.route !== "search" || SV.results) {
      box.hidden = true;
      return;
    }
    const sections = [
      ["top", SV.featured.top || []],
      ["specials", SV.featured.specials || []]
    ].filter(([, items]) => items.length);
    if (!sections.length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = sections.map(([key, items]) => `
      <section class="featured-block">
        <div class="section-head"><h2>${escapeHTML(t("featured." + key))}</h2><span>Steam</span></div>
        <div class="featured-grid">
          ${items.map((item) => {
            const price = item.free ? t("detail.free") : item.price ? formatMoney(item.price.final, item.price.currency, SV.lang) : "—";
            return `<a class="featured-card" href="#/game/${item.id}">
              <div class="featured-media"><img src="${imageURL(item.image)}" alt="" loading="lazy" onerror="this.onerror=null;this.src=window.SV_PLACEHOLDER"></div>
              <div class="featured-body"><span class="featured-name">${escapeHTML(item.name)}</span><span class="featured-price">${escapeHTML(price)}</span></div>
            </a>`;
          }).join("")}
        </div>
      </section>`).join("");
  }

  async function loadFeatured() {
    if (SV.featured || SV.featuredLoading || SV.platform !== "steam") { renderFeatured(); return; }
    if (!navigator.onLine) { renderFeatured(); return; }
    SV.featuredLoading = true;
    try {
      const data = await steamJSON(`https://store.steampowered.com/api/featuredcategories?cc=${encodeURIComponent(SV.country)}&l=${encodeURIComponent(steamLang())}`);
      const parse = (obj) => ((obj && obj.items) || []).filter((x) => x && x.id).slice(0, 6).map(featuredItem);
      const top = parse(data.top_sellers);
      const topIDs = new Set(top.map((x) => x.id));
      SV.featured = { top, specials: parse(data.specials).filter((x) => !topIDs.has(x.id)) };
    } catch {
      SV.featured = { top: [], specials: [] };
    } finally {
      SV.featuredLoading = false;
      renderFeatured();
    }
  }

  function renderSearchView() {
    showView("search");
    renderPlatformTabs();
    const meta = platformMeta(SV.platform);
    const isSteam = SV.platform === "steam";
    const input = $("#searchInput");
    if (input && SV.lastQuery !== undefined) input.value = SV.lastQuery || "";
    if (input) input.placeholder = isSteam ? t("search.placeholder") : t("platform.searchPlaceholder").replace("{name}", meta.name);
    const title = $(".intro h1");
    const lede = $(".intro .lede");
    if (title) title.textContent = isSteam ? t("search.title") : t("platform.searchTitle").replace("{name}", meta.name);
    if (lede) {
      lede.hidden = !isSteam;
      lede.textContent = isSteam ? t("search.hint") : "";
    }

    if (!isSteam) {
      const mirror = $("#mirrorHint");
      if (mirror) mirror.hidden = true;
      const recent = $("#recentSection");
      if (recent) recent.hidden = true;
      const featured = $("#featuredSections");
      if (featured) featured.hidden = true;
      const head = $("#resultsHead");
      if (head) head.hidden = true;
      const grid = $("#resultsGrid");
      if (grid) grid.innerHTML = "";
      const empty = $("#emptyState");
      if (empty) empty.hidden = true;
      const status = $("#searchStatus");
      if (status) status.hidden = true;
      renderPlatformPanel();
      renderPublicAd();
      return;
    }
    const panel = $("#platformPanel");
    if (panel) panel.hidden = true;
    renderMirrorHint($("#mirrorHint"));
    renderPublicAd();
    renderRecent();
    if (SV.results) {
      renderResults(SV.results, SV.lastQuery);
    } else {
      $("#resultsHead").hidden = true;
      $("#resultsGrid").innerHTML = "";
      $("#emptyState").hidden = true;
      renderFeatured();
      loadFeatured();
    }
  }

  function renderResults(items, query) {
    const grid = $("#resultsGrid");
    const head = $("#resultsHead");
    const empty = $("#emptyState");
    const count = $("#resultsCount");
    const recent = $("#recentSection");
    const featured = $("#featuredSections");
    if (recent) recent.hidden = true;
    if (featured) featured.hidden = true;
    head.hidden = false;
    count.textContent = String(items.length);
    empty.hidden = true;
    const retry = $("#retrySearch");
    if (retry) retry.remove();
    grid.innerHTML = items.map((item, i) => {
      const price = item.price;
      const priceHTML = item.free
        ? `<span class="result-price">${escapeHTML(t("detail.free"))}</span>`
        : price
          ? `<span class="result-price">${price.discount ? `<del>${escapeHTML(formatMoney(price.initial, price.currency, SV.lang))}</del>` : ""}${escapeHTML(formatMoney(price.final, price.currency, SV.lang))}</span>`
          : `<span class="result-price">—</span>`;
      const saved = isFavorite(item.id);
      return `
        <article class="result-card" data-appid="${item.id}">
          <button class="fav-toggle ${saved ? "active" : ""}" type="button" data-fav="${item.id}" aria-label="${escapeHTML(saved ? t("detail.saved") : t("detail.save"))}" aria-pressed="${saved ? "true" : "false"}">${saved ? "★" : "☆"}</button>
          <a class="result-link" href="#/game/${item.id}" aria-label="${escapeHTML(item.name)}">
            <div class="result-media">
              <img src="${imageURL(item.image)}" alt="" loading="lazy" onerror="this.onerror=null;this.src=window.SV_PLACEHOLDER">
              <span class="result-rank">${String(i + 1).padStart(2, "0")}</span>
            </div>
            <div class="result-body">
              <div class="result-title-row">
                <h3 class="result-title">${escapeHTML(item.name)}</h3>
                <span class="result-appid">${item.id}</span>
              </div>
              <div class="result-bottom">
                <div>${priceHTML}</div>
                <span class="result-platform">${escapeHTML(platformLabel(item.platforms))}</span>
              </div>
            </div>
          </a>
        </article>`;
    }).join("");

    $$("#resultsGrid [data-fav]").forEach((btn) => btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const item = items.find((x) => Number(x.id) === Number(btn.getAttribute("data-fav")));
      if (item) toggleFavorite(item);
    }));

    if (!items.length) {
      head.hidden = true;
      empty.hidden = false;
      $("#emptyTitle").textContent = t("search.noResults");
      $("#emptyCopy").textContent = query ? `"${query}"` : "";
      grid.innerHTML = "";
    }
  }

  async function enrichSearchItems(items, signal) {
    const targets = items.filter((x) => !x.price).slice(0, 8);
    await Promise.all(targets.map(async (item) => {
      try {
        const url = `https://store.steampowered.com/api/appdetails?appids=${item.id}&cc=${encodeURIComponent(SV.country)}&l=${encodeURIComponent(steamLang())}`;
        const data = await steamJSON(url, signal);
        const wrapper = data && data[String(item.id)];
        if (!wrapper || !wrapper.success || !wrapper.data) return;
        const d = wrapper.data;
        if (d.is_free) {
          item.free = true;
          return;
        }
        if (d.price_overview) {
          item.price = {
            currency: d.price_overview.currency,
            initial: d.price_overview.initial,
            final: d.price_overview.final,
            discount: d.price_overview.discount_percent
          };
          item.free = false;
        } else {
          item.unavailable = true;
        }
      } catch {}
    }));
  }

  async function doSearch(rawQuery) {
    const q = String(rawQuery || "").trim();
    if (!q) {
      $("#searchInput").focus();
      return;
    }
    if (!navigator.onLine) {
      toast(t("offline.search"));
      return;
    }
    if (SV.platform !== "steam") {
      SV.lastQuery = q;
      $("#searchInput").value = q;
      const url = platformSearchURL(SV.platform, q);
      if (SV.platform === "wegame") toast(t("platform.wegameSearch"));
      openURL(url);
      return;
    }
    if (/^\d{3,}$/.test(q)) {
      location.hash = "#/game/" + q;
      return;
    }
    if (SV.searchAbort) {
      try { SV.searchAbort.abort(); } catch {}
    }
    SV.searchAbort = new AbortController();
    SV.lastQuery = q;
    $("#searchInput").value = q;
    $("#searchStatus").hidden = false;
    $("#searchStatusText").textContent = t("search.loading");
    $("#searchSubmit").disabled = true;
    $("#emptyState").hidden = true;
    $("#resultsHead").hidden = true;
    $("#resultsGrid").innerHTML = "";
    $("#recentSection").hidden = true;
    const featuredBox = $("#featuredSections");
    if (featuredBox) featuredBox.hidden = true;

    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=${encodeURIComponent(steamLang())}&cc=${encodeURIComponent(SV.country)}`;
    try {
      const data = await steamJSON(url, SV.searchAbort.signal);
      const items = (data.items || [])
        .filter((x) => x.type === "app")
        .map((x) => ({
          id: x.id,
          name: x.name,
          image: x.tiny_image || headerForAppID(x.id),
          price: x.price || null,
          platforms: x.platforms || null,
          metascore: x.metascore || ""
        }));
      if (items.some((x) => !x.price)) {
        $("#searchStatusText").textContent = t("search.prices");
        await enrichSearchItems(items, SV.searchAbort.signal);
      }
      SV.results = items;
      recordSearch(q);
      renderResults(items, q);
    } catch (err) {
      if (err && err.name === "AbortError") return;
      console.error(err);
      SV.results = null;
      $("#resultsHead").hidden = true;
      $("#emptyState").hidden = false;
      $("#emptyTitle").textContent = t("search.error");
      $("#emptyCopy").textContent = t("search.retry");
      let retry = $("#retrySearch");
      if (!retry) {
        const box = document.createElement("div");
        box.style.marginTop = "18px";
        box.id = "retryWrap";
        box.innerHTML = `<button class="btn small" id="retrySearch" type="button">${escapeHTML(t("search.retry"))}</button>`;
        $("#emptyState").appendChild(box);
        retry = $("#retrySearch");
      }
      if (retry) retry.addEventListener("click", () => doSearch(q));
    } finally {
      $("#searchStatus").hidden = true;
      $("#searchSubmit").disabled = false;
    }
  }

  function recordSearch(q) {
    const lower = q.toLowerCase();
    SV.state.history = (SV.state.history || []).filter((x) => !(x.kind === "search" && String(x.query || "").toLowerCase() === lower));
    SV.state.history.unshift({ kind: "search", query: q, at: Date.now() });
    SV.state.history = SV.state.history.slice(0, 160);
    saveSoon();
  }

  function recordGame(data) {
    const id = Number(data.steam_appid);
    const image = data.header_image || data.capsule_image || headerForAppID(id);
    SV.state.history = (SV.state.history || []).filter((x) => !(x.kind === "game" && Number(x.appid) === id));
    SV.state.history.unshift({
      kind: "game",
      appid: id,
      name: data.name || String(id),
      image,
      at: Date.now()
    });
    SV.state.history = SV.state.history.slice(0, 160);
    saveSoon();
  }

  // ------------------------------------------------------------- favorites

  function isFavorite(appid) {
    const id = Number(appid);
    return (SV.state.favorites || []).some((f) => Number(f.appid) === id);
  }

  function favoriteFromItem(item) {
    const price = item.price;
    return {
      appid: Number(item.id),
      name: item.name || String(item.id),
      image: item.image || headerForAppID(item.id),
      at: Date.now(),
      price: price && Number.isFinite(Number(price.final)) ? Number(price.final) : null,
      currency: price ? price.currency || currentCurrency() : currentCurrency(),
      free: !!item.free,
      discount: price ? Number(price.discount) || 0 : 0
    };
  }

  function favoriteFromGame(data) {
    const p = data.price_overview;
    return {
      appid: Number(data.steam_appid),
      name: data.name || String(data.steam_appid),
      image: data.header_image || data.capsule_image || headerForAppID(data.steam_appid),
      at: Date.now(),
      price: p && Number.isFinite(Number(p.final)) ? Number(p.final) : null,
      currency: p ? p.currency || currentCurrency() : currentCurrency(),
      free: !!data.is_free,
      discount: p ? Number(p.discount_percent) || 0 : 0
    };
  }

  function syncFavoriteFromGame(data) {
    const id = Number(data.steam_appid);
    const favorites = SV.state.favorites || [];
    const idx = favorites.findIndex((f) => Number(f.appid) === id);
    if (idx < 0) return;
    const fresh = favoriteFromGame(data);
    fresh.at = favorites[idx].at;
    favorites[idx] = fresh;
    saveSoon();
  }

  function toggleFavorite(source) {
    const appid = Number(source.appid || source.steam_appid || source.id);
    if (!appid) return;
    const favorites = SV.state.favorites || [];
    const idx = favorites.findIndex((f) => Number(f.appid) === appid);
    if (idx >= 0) {
      favorites.splice(idx, 1);
      toast(t("toast.unfavorited"));
    } else {
      favorites.unshift(source.steam_appid ? favoriteFromGame(source) : favoriteFromItem(source));
      toast(t("toast.favorited"));
    }
    SV.state.favorites = favorites.slice(0, 200);
    saveSoon();
    if (SV.route === "saved") {
      renderSavedView();
    } else if (SV.route === "game" && Number(SV.detailAppID) === appid) {
      updateFavoriteButton();
    } else if (SV.route === "search" && SV.results) {
      renderResults(SV.results, SV.lastQuery);
    }
  }

  function updateFavoriteButton() {
    const btn = $("#toggleFavorite");
    if (!btn) return;
    const saved = isFavorite(SV.detailAppID);
    btn.classList.toggle("active", saved);
    btn.setAttribute("aria-pressed", saved ? "true" : "false");
    btn.innerHTML = saved ? `★ ${escapeHTML(t("detail.saved"))}` : `☆ ${escapeHTML(t("detail.save"))}`;
  }

  function renderSavedView() {
    showView("saved");
    document.title = t("saved.title") + " · Gauge";
    const favorites = SV.state.favorites || [];
    const view = $("#savedView");
    if (!favorites.length) {
      view.innerHTML = `
        <div class="view-head">
          <h1>${escapeHTML(t("saved.title"))}</h1>
          <p class="lede">${escapeHTML(t("saved.emptyHint"))}</p>
        </div>
        <div class="empty-state saved-empty">
          <p class="empty-title">${escapeHTML(t("saved.empty"))}</p>
          <button class="btn small" type="button" id="savedGoSearch">${escapeHTML(t("nav.search"))}</button>
        </div>`;
      const go = $("#savedGoSearch");
      if (go) go.addEventListener("click", () => { location.hash = "#/"; });
      return;
    }
    view.innerHTML = `
      <div class="view-head">
        <h1>${escapeHTML(t("saved.title"))}</h1>
        <p class="lede">${escapeHTML(t("saved.note"))}</p>
      </div>
      <div class="saved-grid">
        ${favorites.map((fav) => {
          const price = fav.free ? t("detail.free") : fav.price !== null && fav.price !== undefined ? formatMoney(fav.price, fav.currency, SV.lang) : "—";
          return `<article class="saved-card">
            <button class="fav-toggle active" type="button" data-remove-fav="${fav.appid}" aria-label="${escapeHTML(t("saved.remove"))}">★</button>
            <a class="saved-link" href="#/game/${fav.appid}">
              <div class="saved-media"><img src="${imageURL(fav.image)}" alt="" loading="lazy" onerror="this.onerror=null;window.SV_PLACEHOLDER"></div>
              <div class="saved-body">
                <div class="result-title-row"><h2>${escapeHTML(fav.name)}</h2><span class="result-appid">${fav.appid}</span></div>
                <div class="saved-price">${escapeHTML(price)}</div>
                <div class="saved-meta">${escapeHTML(t("saved.priceSaved"))} · ${escapeHTML(formatDate(fav.at, SV.lang))}</div>
              </div>
            </a>
          </article>`;
        }).join("")}
      </div>`;
    $$("#savedView [data-remove-fav]").forEach((b) => b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = Number(b.getAttribute("data-remove-fav"));
      SV.state.favorites = (SV.state.favorites || []).filter((f) => Number(f.appid) !== id);
      saveSoon();
      toast(t("toast.unfavorited"));
      renderSavedView();
    }));
  }

  // ------------------------------------------------------------- detail

  function showView(name) {
    SV.route = name;
    $("#searchView").hidden = name !== "search";
    $("#detailView").hidden = name !== "game";
    $("#savedView").hidden = name !== "saved";
    $("#webView").hidden = name !== "web";
    $$(".nav-link").forEach((a) => a.classList.toggle("active", a.getAttribute("data-nav") === (name === "game" ? "search" : name)));
    if (name !== "game") {
      clearInterval(SV.playerTimer);
      SV.playerTimer = null;
    }
  }

  function detailSkeleton() {
    showView("game");
    $("#detailView").innerHTML = `
      <div class="detail-top"><button class="back-link" type="button" id="backToSearch"><span class="arrow-back">←</span><span>${escapeHTML(t("detail.back"))}</span></button></div>
      <div class="detail-skeleton">
        <div class="sk sk-hero"></div>
        <div class="sk sk-line"></div>
        <div class="sk sk-line short"></div>
        <div class="sk sk-line"></div>
      </div>`;
    $("#backToSearch").addEventListener("click", () => { location.hash = "#/"; });
  }

  async function loadGame(appid) {
    appid = Number(appid);
    if (!appid) { location.hash = "#/"; return; }
    SV.detailAppID = appid;
    SV.detailData = null;
    SV.detailPlayers = null;
    const token = ++SV.detailToken;
    clearInterval(SV.playerTimer);
    SV.playerTimer = null;
    detailSkeleton();

    const detailURL = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${encodeURIComponent(SV.country)}&l=${encodeURIComponent(steamLang())}`;
    const newsURL = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appid}&count=4&maxlength=220&format=json&feeds=steam_community_announcements`;
    const [detailRes, playersRes, newsRes] = await Promise.allSettled([
      steamJSON(detailURL),
      fetchPlayers(appid),
      steamJSON(newsURL)
    ]);

    if (token !== SV.detailToken) return;

    let data = null;
    if (detailRes.status === "fulfilled") {
      const obj = detailRes.value && detailRes.value[String(appid)];
      if (obj && obj.success) data = obj.data;
    }
    if (!data) {
      renderDetailError();
      return;
    }

    let players = null;
    let playerSource = "";
    if (playersRes.status === "fulfilled" && playersRes.value) {
      players = playersRes.value.count;
      playerSource = playersRes.value.source;
    }

    let news = [];
    if (newsRes.status === "fulfilled" && newsRes.value && newsRes.value.appnews && Array.isArray(newsRes.value.appnews.newsitems)) {
      news = newsRes.value.appnews.newsitems.slice(0, 4);
    }

    SV.detailData = data;
    SV.detailPlayers = players;
    recordGame(data);
    syncFavoriteFromGame(data);
    recordPricePoint(data, appid);
    renderDetail(data, players, playerSource, news);
    startPlayerRefresh(appid);
  }

  function recordPricePoint(data, appid) {
    const p = data.price_overview;
    if (!p) return;
    const key = `${appid}:${SV.country}`;
    const list = Array.isArray(SV.state.prices[key]) ? SV.state.prices[key].slice() : [];
    const point = {
      date: localISODate(),
      final: Number(p.final) || 0,
      initial: Number(p.initial) || 0,
      discount: Number(p.discount_percent) || 0,
      currency: p.currency || currentCurrency()
    };
    const last = list[list.length - 1];
    if (last && last.date === point.date) {
      list[list.length - 1] = point;
    } else {
      list.push(point);
    }
    SV.state.prices[key] = list.slice(-120);
    saveSoon();
  }

  function priceStats(data, appid) {
    const p = data.price_overview;
    const points = (SV.state.prices[`${appid}:${SV.country}`] || []).slice();
    if (!p) return null;
    const finals = points.map((x) => Number(x.final)).filter((x) => Number.isFinite(x) && x > 0);
    const current = Number(p.final) || 0;
    const initial = Number(p.initial) || current;
    const high = Math.max(initial, current, ...finals);
    const low = Math.min(current, ...finals);
    return {
      points,
      current,
      initial,
      high,
      low,
      currency: p.currency || currentCurrency(),
      discount: Number(p.discount_percent) || 0,
      fresh: points.length < 2
    };
  }

  function statsHTML(data, players, appid, playerSource = "steam") {
    const ps = priceStats(data, appid);
    const reviews = data.recommendations && data.recommendations.total ? Number(data.recommendations.total) : null;
    const sales = reviews ? reviews * 30 : null;
    const online = players === null || players === undefined ? "—" : formatNumber(players, SV.lang);
    let priceValue = "—";
    let priceNote = "";
    if (data.is_free) {
      priceValue = t("detail.free");
    } else if (ps) {
      priceValue = ps.current ? formatMoney(ps.current, ps.currency, SV.lang) : "—";
      if (ps.discount > 0) priceNote = `−${ps.discount}%`;
    }
    const isFree = !!data.is_free;
    const lowValue = isFree ? t("detail.free") : (ps && ps.low ? formatMoney(ps.low, ps.currency, SV.lang) : "—");
    const highValue = isFree ? t("detail.free") : (ps && ps.high ? formatMoney(ps.high, ps.currency, SV.lang) : "—");
    return `
      <div class="stats">
        <div class="stat">
          <p class="stat-label"><span class="live-dot"></span>${escapeHTML(t("detail.online"))}<button class="stat-refresh" id="refreshPlayers" type="button" aria-label="${escapeHTML(t("detail.refresh"))}" title="${escapeHTML(t("detail.refresh"))}">↻</button></p>
          <span class="stat-value" id="onlineValue">${escapeHTML(online)}</span>
          <span class="stat-note" id="onlineNote">${escapeHTML(playerSource === "steamcharts" ? t("detail.playersFallback") : "Steam / GetNumberOfCurrentPlayers")}</span>
        </div>
        <div class="stat">
          <p class="stat-label">${escapeHTML(t("detail.price"))}</p>
          <span class="stat-value">${escapeHTML(priceValue)}</span>
          ${priceNote ? `<span class="stat-note">${escapeHTML(priceNote)}</span>` : `<span class="stat-note">${escapeHTML(data.is_free ? t("detail.freeGame") : (data.price_overview ? data.price_overview.currency : ""))}</span>`}
        </div>
        <div class="stat">
          <p class="stat-label">${escapeHTML(t("detail.low"))}</p>
          <span class="stat-value">${escapeHTML(lowValue)}</span>
          <span class="stat-note">${escapeHTML(isFree ? t("detail.freeGame") : (ps && ps.fresh ? t("detail.historyNote") : t("detail.lowNote")))}</span>
        </div>
        <div class="stat">
          <p class="stat-label">${escapeHTML(t("detail.high"))}</p>
          <span class="stat-value">${escapeHTML(highValue)}</span>
          <span class="stat-note">${escapeHTML(isFree ? t("detail.freeGame") : t("detail.highNote"))}</span>
        </div>
        <div class="stat">
          <p class="stat-label">${escapeHTML(t("detail.sales"))}</p>
          <span class="stat-value">${escapeHTML(sales ? formatNumber(sales, SV.lang, true) : "—")}</span>
          <span class="stat-note">${escapeHTML(t("detail.salesNote"))}</span>
        </div>
        <div class="stat">
          <p class="stat-label">${escapeHTML(t("detail.appid"))}</p>
          <span class="stat-value small">${appid}</span>
          <span class="stat-note">store.steampowered.com/app/${appid}</span>
        </div>
        <div class="stat">
          <p class="stat-label">${escapeHTML(t("detail.reviews"))}</p>
          <span class="stat-value">${escapeHTML(reviews ? formatNumber(reviews, SV.lang, true) : "—")}</span>
          <span class="stat-note">${escapeHTML(t("detail.reviewsCount"))}</span>
        </div>
        <div class="stat">
          <p class="stat-label">${escapeHTML(t("detail.release"))}</p>
          <span class="stat-value small">${escapeHTML(data.release_date ? data.release_date.date : "—")}</span>
          <span class="stat-note">${escapeHTML(platformLabel(data.platforms))}</span>
        </div>
      </div>`;
  }

  function chartHTML(points, currency) {
    if (!points || points.length < 2) {
      return `<p class="no-chart">${escapeHTML(t("detail.noHistory"))}</p>`;
    }
    const pts = points.slice(-30);
    const values = pts.map((p) => Number(p.final) / 100);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const width = 600;
    const height = 96;
    const pad = 6;
    const coords = values.map((v, i) => {
      const x = pad + (i * (width - pad * 2)) / Math.max(1, values.length - 1);
      const y = height - pad - ((v - min) / span) * (height - pad * 2);
      return [x, y];
    });
    const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const area = `${coords[0][0].toFixed(1)},${height - pad} ${line} ${coords[coords.length - 1][0].toFixed(1)},${height - pad}`;
    return `
      <div class="chart-wrap">
        <div class="chart-head">
          <span>${escapeHTML(t("detail.priceHistory"))}</span>
          <span>${escapeHTML(formatMoney(max * 100, currency, SV.lang))} / ${escapeHTML(formatMoney(min * 100, currency, SV.lang))}</span>
        </div>
        <svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHTML(t("detail.priceHistory"))}">
          <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="var(--chart-line)" stroke-width="1"/>
          <polygon points="${area}" fill="var(--chart-fill)" stroke="none"/>
          <polyline points="${line}" fill="none" stroke="var(--ink)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
          ${coords.map(([x, y], i) => i === coords.length - 1 ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="var(--ink)"/>` : "").join("")}
        </svg>
        <p class="chart-note">${escapeHTML(t("detail.historyNote"))}</p>
      </div>`;
  }

  function renderDetail(data, players, playerSource = "steam", news = []) {
    showView("game");
    const appid = Number(data.steam_appid);
    document.title = `${data.name} · Gauge`;
    const ps = priceStats(data, appid);
    const genreText = (data.genres || []).map((g) => g.description).join(" / ");
    const short = stripTags(data.short_description || "").slice(0, 420);
    const about = stripTags(data.about_the_game || data.detailed_description || "").slice(0, 1800);
    const screens = (data.screenshots || []).slice(0, 3);
    const developers = (data.developers || []).join(", ");
    const publishers = (data.publishers || []).join(", ");
    const storeURL = storeURLFor(appid);
    const communityURL = `https://steamcommunity.com/app/${appid}/`;
    const supportURL = `https://help.steampowered.com/en/wizard/HelpWithGame/?appid=${appid}`;
    const icon = data.capsule_image || capsuleForAppID(appid);
    const art = data.header_image || headerForAppID(appid);
    const metacritic = data.metacritic && data.metacritic.score ? data.metacritic.score : "—";
    const req = data.pc_requirements && typeof data.pc_requirements === "object" ? data.pc_requirements : {};
    const reqMin = stripHTMLList(req.minimum);
    const reqRec = stripHTMLList(req.recommended);
    const saved = isFavorite(appid);
    const newsHTML = news.length ? `
      <section class="news-section">
        <h2 class="block-title">${escapeHTML(t("detail.news"))}</h2>
        <div class="news-list">
          ${news.map((n) => `<a class="news-item" href="${escapeHTML(n.url || "#")}" target="_blank" rel="noopener">
            <span class="news-date">${escapeHTML(formatDate((Number(n.date) || 0) * 1000, SV.lang))}</span>
            <h3>${escapeHTML(n.title || "")}</h3>
            <p>${escapeHTML(stripTags(n.contents || "").slice(0, 190))}</p>
            <span class="news-source">${escapeHTML(n.feedlabel || "Steam")}</span>
          </a>`).join("")}
        </div>
      </section>` : "";

    $("#detailView").innerHTML = `
      <div class="detail-top">
        <button class="back-link" type="button" id="backToSearch"><span class="arrow-back">←</span><span>${escapeHTML(t("detail.back"))}</span></button>
        <span class="kicker" style="margin:0">${escapeHTML(t("detail.appid"))} / ${appid}</span>
      </div>
      <article class="detail-hero">
        <div class="detail-art">
          <img src="${imageURL(art)}" alt="${escapeHTML(data.name)}" onerror="this.onerror=null;this.src=window.SV_PLACEHOLDER">
        </div>
        <div class="detail-copy">
          <div>
            <p class="kicker">${escapeHTML(genreText || t("detail.genres"))}</p>
            <div style="display:flex;gap:12px;align-items:flex-start">
              <h1>${escapeHTML(data.name)}</h1>
            </div>
            <div style="display:flex;align-items:center;gap:9px;margin-top:14px">
              <img src="${imageURL(icon)}" alt="" style="width:64px;border:1px solid var(--line)" onerror="this.style.display='none'">
              <span style="font-family:var(--mono);font-size:9px;color:var(--muted)">APPID ${appid}</span>
            </div>
            <p class="detail-sub">${escapeHTML(short)}</p>
          </div>
          <div class="detail-actions">
            <button class="btn primary" type="button" data-open="${escapeHTML(storeURL)}">${escapeHTML(t("detail.store"))} ↗</button>
            <button class="btn" type="button" data-open="${escapeHTML(communityURL)}">${escapeHTML(t("detail.community"))}</button>
            <button class="btn" type="button" data-open="${escapeHTML(supportURL)}">${escapeHTML(t("detail.support"))}</button>
            <button class="btn" type="button" id="copyAppID">${escapeHTML(t("detail.copy"))}</button>
            <button class="btn fav-btn ${saved ? "active" : ""}" type="button" id="toggleFavorite" aria-pressed="${saved ? "true" : "false"}">${saved ? "★" : "☆"} ${escapeHTML(saved ? t("detail.saved") : t("detail.save"))}</button>
          </div>
        </div>
      </article>

      ${statsHTML(data, players, appid, playerSource)}

      <div class="detail-grid">
        <div>
          <h2 class="block-title">${escapeHTML(t("detail.about"))}</h2>
          <div class="about-copy">${about ? about.split(/\n{2,}/).map((p) => `<p>${escapeHTML(p)}</p>`).join("") : `<p>${escapeHTML(short)}</p>`}</div>
          ${screens.length ? `<div class="screens">${screens.map((s) => `<button class="shot-btn" type="button" data-shot="${escapeHTML(imageURL(s.path_full || s.path_thumbnail))}"><img src="${imageURL(s.path_full || s.path_thumbnail)}" alt="" loading="lazy" onerror="this.onerror=null;this.src=window.SV_PLACEHOLDER"></button>`).join("")}</div>` : ""}
        </div>
        <aside>
          <h2 class="block-title">${escapeHTML(t("detail.info"))}</h2>
          <dl class="facts">
            <div class="fact"><dt>${escapeHTML(t("detail.release"))}</dt><dd>${escapeHTML(data.release_date ? data.release_date.date : "—")}</dd></div>
            <div class="fact"><dt>${escapeHTML(t("detail.developer"))}</dt><dd>${escapeHTML(developers || "—")}</dd></div>
            <div class="fact"><dt>${escapeHTML(t("detail.publisher"))}</dt><dd>${escapeHTML(publishers || "—")}</dd></div>
            <div class="fact"><dt>${escapeHTML(t("detail.genres"))}</dt><dd>${escapeHTML(genreText || "—")}</dd></div>
            <div class="fact"><dt>${escapeHTML(t("detail.platforms"))}</dt><dd>${escapeHTML(platformLabel(data.platforms) || "—")}</dd></div>
            <div class="fact"><dt>Metacritic</dt><dd>${escapeHTML(String(metacritic))}</dd></div>
          </dl>
          ${(reqMin || reqRec) ? `<details class="req-box">
            <summary>${escapeHTML(t("detail.requirements"))}</summary>
            ${reqMin ? `<div class="req-group"><h3>${escapeHTML(t("detail.minimum"))}</h3><p>${escapeHTML(reqMin)}</p></div>` : ""}
            ${reqRec ? `<div class="req-group"><h3>${escapeHTML(t("detail.recommended"))}</h3><p>${escapeHTML(reqRec)}</p></div>` : ""}
          </details>` : ""}
          ${ps ? chartHTML(ps.points, ps.currency) : ""}
        </aside>
      </div>
      ${newsHTML}`;

    $("#backToSearch").addEventListener("click", () => { location.hash = "#/"; });
    $$("#detailView [data-open]").forEach((btn) => {
      btn.addEventListener("click", () => openSteamPage(btn.getAttribute("data-open")));
    });
    const copyBtn = $("#copyAppID");
    if (copyBtn) copyBtn.addEventListener("click", async () => {
      if (await copyText(String(appid))) toast(t("toast.copied"));
      else toast(t("toast.error"));
    });
    const favBtn = $("#toggleFavorite");
    if (favBtn) favBtn.addEventListener("click", () => toggleFavorite(data));
    $$("#detailView [data-shot]").forEach((btn) => btn.addEventListener("click", () => openImageModal(btn.getAttribute("data-shot"), data.name)));
    const refresh = $("#refreshPlayers");
    if (refresh) refresh.addEventListener("click", () => refreshPlayers(appid, true));
  }

  async function refreshPlayers(appid, notify = false) {
    try {
      const result = await fetchPlayers(appid);
      if (!result || result.count === null || result.count === undefined) throw new Error("no player count");
      const el = $("#onlineValue");
      if (el) el.textContent = formatNumber(result.count, SV.lang);
      const note = $("#onlineNote");
      if (note) note.textContent = result.source === "steamcharts" ? t("detail.playersFallback") : "Steam / GetNumberOfCurrentPlayers";
      if (notify) toast(t("toast.saved"));
      return result.count;
    } catch {
      if (notify) toast(t("toast.error"));
      return null;
    }
  }

  function renderDetailError() {
    showView("game");
    $("#detailView").innerHTML = `
      <div class="detail-top">
        <button class="back-link" type="button" id="backToSearch"><span class="arrow-back">←</span><span>${escapeHTML(t("detail.back"))}</span></button>
      </div>
      <div class="empty-state">
        <p class="empty-title">${escapeHTML(t("detail.error"))}</p>
        <p class="empty-copy">${escapeHTML(t("search.retry"))}</p>
        <div style="margin-top:18px"><button class="btn small" id="retryDetail" type="button">${escapeHTML(t("detail.retry"))}</button></div>
      </div>`;
    $("#backToSearch").addEventListener("click", () => { location.hash = "#/"; });
    const retry = $("#retryDetail");
    if (retry) retry.addEventListener("click", () => loadGame(SV.detailAppID));
  }

  function startPlayerRefresh(appid) {
    clearInterval(SV.playerTimer);
    SV.playerTimer = setInterval(async () => {
      if (SV.route !== "game" || Number(SV.detailAppID) !== Number(appid)) return;
      refreshPlayers(appid, false);
    }, 60000);
  }

  // ------------------------------------------------------------- browser

  function openURL(url) {
    if (!isStoreWebURL(url)) {
      toast(t("web.invalid"));
      return;
    }
    if (SV.isAndroid && window.Android.openInAppBrowser) {
      window.Android.openInAppBrowser(url, SV.effectiveTheme === "dark");
      return;
    }
    if (SV.isAndroid && window.Android.openExternal) {
      window.Android.openExternal(url);
      return;
    }
    const tab = window.open(url, "_blank", "noopener,noreferrer");
    if (!tab) {
      fetch("/api/open-url?url=" + encodeURIComponent(url)).then((r) => {
        if (!r.ok) toast(t("toast.error"));
      }).catch(() => toast(t("toast.error")));
    }
  }

  function openSteamPage(url) {
    if (!isSteamWebURL(url)) {
      toast(t("web.invalid"));
      return;
    }
    openURL(url);
  }

  function openStorePage(url) {
    if (!isStoreWebURL(url)) {
      toast(t("web.invalid"));
      return;
    }
    openURL(url);
  }

  function renderWebView() {
    showView("web");
    const meta = platformMeta(SV.platform);
    const isSteam = SV.platform === "steam";
    const title = isSteam ? t("web.title") : t("platform.browse").replace("{name}", meta.name);
    const sub = isSteam ? t("web.sub") : t("platform.webSub").replace("{name}", meta.name);
    document.title = title + " · Gauge";
    const webKeys = new Set(["store", "community", "support", "workshop", "news", "about"]);
    const links = platformLinks(SV.platform).map(([key, url]) => {
      const labelKey = key.startsWith("web.") ? key : (webKeys.has(key) ? "web." + key : "platform." + key);
      return `<button class="quick-link" type="button" data-open-web="${escapeHTML(url)}"><span>${escapeHTML(t(labelKey))}</span><span class="q-arrow">↗</span></button>`;
    }).join("");
    $("#webView").innerHTML = `
      <div class="web-header">
        <h1>${escapeHTML(title)}</h1>
        <p class="lede">${escapeHTML(sub)}</p>
        <form class="url-bar" id="webForm">
          <label class="sr-only" for="webURL">URL</label>
          <input id="webURL" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="${escapeHTML(isSteam ? t("web.placeholder") : t("platform.searchPlaceholder").replace("{name}", meta.name))}">
          <button type="submit">${escapeHTML(t("web.open"))} ↗</button>
        </form>
        <div class="mirror-hint" id="webMirrorHint" hidden></div>
        <div class="quick-links">${links}</div>
        <p class="web-note">${escapeHTML(isSteam ? t("mirror.label") + ": " + t(SV.mirror === "china" ? "mirror.china" : "mirror.official") + " · " + t("web.note") : t("platform.betaNote"))}</p>
      </div>`;
    if (isSteam) renderMirrorHint($("#webMirrorHint"));
    $("#webForm").addEventListener("submit", (e) => {
      e.preventDefault();
      let raw = $("#webURL").value.trim();
      if (!raw) return;
      if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
      if (!isStoreWebURL(raw)) {
        toast(t("web.invalid"));
        return;
      }
      openStorePage(raw);
    });
    $$("#webView [data-open-web]").forEach((b) => b.addEventListener("click", () => openStorePage(b.getAttribute("data-open-web"))));
  }

  // ------------------------------------------------------------- modals

  function disclaimerHTML() {
    return `<p class="disclaimer-text">${escapeHTML((DISCLAIMER[SV.lang] || DISCLAIMER.zh).join(" "))}</p>`;
  }

  function openDisclaimerModal() {
    openModal({
      title: t("disclaimer.title"),
      body: disclaimerHTML(),
      footer: `<button class="btn" type="button" data-close>${escapeHTML(t("disclaimer.close"))}</button>`
    });
  }

  function openSettings() {
    const langButtons = LANGUAGES.map((l) =>
      `<button class="lang-choice ${l.code === SV.lang ? "active" : ""}" type="button" data-lang="${l.code}">${escapeHTML(l.native)}</button>`
    ).join("");
    const countryOptions = COUNTRIES.map((c) => {
      const name = countryName(c.cc, SV.lang);
      return `<option value="${c.cc}" ${c.cc === SV.country ? "selected" : ""}>${escapeHTML(name)} · ${c.currency}</option>`;
    }).join("");
    const dataPath = SV.info.dataDir || (SV.isAndroid ? t("mobile.folder") : "—");
    const body = `
      <div class="settings-block">
        <p class="settings-label">${escapeHTML(t("settings.language"))}</p>
        <div class="lang-grid">${langButtons}</div>
      </div>
      <div class="settings-block">
        <p class="settings-label">${escapeHTML(t("settings.country"))}</p>
        <select class="country-select" id="settingsCountry">${countryOptions}</select>
      </div>
      <div class="settings-block">
        <p class="settings-label">${escapeHTML(t("theme.label"))}</p>
        <div class="lang-grid theme-grid">
          <button class="lang-choice ${(SV.state.settings.theme || "system") === "system" ? "active" : ""}" type="button" data-theme-choice="system" aria-pressed="${(SV.state.settings.theme || "system") === "system" ? "true" : "false"}">${escapeHTML(t("theme.system"))}</button>
          <button class="lang-choice ${SV.state.settings.theme === "light" ? "active" : ""}" type="button" data-theme-choice="light" aria-pressed="${SV.state.settings.theme === "light" ? "true" : "false"}">${escapeHTML(t("theme.light"))}</button>
          <button class="lang-choice ${SV.state.settings.theme === "dark" ? "active" : ""}" type="button" data-theme-choice="dark" aria-pressed="${SV.state.settings.theme === "dark" ? "true" : "false"}">${escapeHTML(t("theme.dark"))}</button>
        </div>
      </div>
      <div class="settings-block">
        <p class="settings-label">${escapeHTML(t("mirror.label"))}</p>
        <div class="lang-grid mirror-grid">
          <button class="lang-choice ${SV.mirror === "official" ? "active" : ""}" type="button" data-mirror="official">${escapeHTML(t("mirror.official"))}</button>
          <button class="lang-choice ${SV.mirror === "china" ? "active" : ""}" type="button" data-mirror="china">${escapeHTML(t("mirror.china"))}</button>
        </div>
        <p class="hint-text">${escapeHTML(t("mirror.hint"))}</p>
      </div>
      <div class="settings-block">
        <p class="settings-label">${escapeHTML(t("platform.label"))}</p>
        <select class="country-select" id="settingsPlatform">
          ${PLATFORMS.map((p) => `<option value="${p.key}" ${SV.platform === p.key ? "selected" : ""}>${escapeHTML(p.name)}</option>`).join("")}
        </select>
      </div>
      <div class="settings-block">
        <p class="settings-label">${escapeHTML(t("public.label"))}</p>
        <div class="settings-actions">
          <button class="btn" type="button" data-act="publicToggle">${escapeHTML(SV.state.settings.publicService ? t("public.off") : t("public.on"))}</button>
          <button class="btn" type="button" data-act="publicView">${escapeHTML(t("public.view"))} <span>↗</span></button>
        </div>
        <p class="hint-text">${escapeHTML(t("public.settingsHint"))}</p>
      </div>
      <div class="settings-block">
        <p class="settings-label">${escapeHTML(t("settings.data"))}</p>
        <div class="settings-actions">
          <button class="btn" type="button" data-act="disclaimer">${escapeHTML(t("settings.disclaimer"))} <span>↗</span></button>
          <button class="btn" type="button" data-act="history">${escapeHTML(t("settings.history"))} <span>↗</span></button>
          <button class="btn" type="button" data-act="usage">${escapeHTML(t("settings.usage"))} <span>↗</span></button>
          <button class="btn" type="button" data-act="folder">${escapeHTML(t("settings.folder"))} <span>↗</span></button>
          <button class="btn" type="button" data-act="cache">${escapeHTML(t("settings.cache"))} <span>↻</span></button>
          <button class="btn" type="button" data-act="oss">${escapeHTML(t("settings.oss"))} <span>↗</span></button>
          <button class="btn" type="button" data-act="quit">${escapeHTML(t("settings.quit"))} <span>×</span></button>
        </div>
        <p class="hint-text">${escapeHTML(t("settings.cacheHint"))}</p>
        <p class="hint-text">${escapeHTML(t("settings.folderHint"))}<br><span style="word-break:break-all">${escapeHTML(dataPath)}</span></p>
      </div>
      <div class="settings-block">
        <p class="settings-label">${escapeHTML(t("settings.about"))}</p>
        <div class="meta-list">
          <div class="meta-row"><span>${escapeHTML(t("settings.version"))}</span><span>v${escapeHTML(SV.info.version || "1.5.0-beta")}</span></div>
          <div class="meta-row"><span>${escapeHTML(t("settings.source"))}</span><span>MIT / open source</span></div>
        </div>
        <p class="hint-text">${escapeHTML(t("settings.sourceNote"))}</p>
        <p class="hint-text">${escapeHTML(t("footer.notAffiliated"))}</p>
      </div>`;
    openModal({
      title: t("settings.title"),
      body,
      footer: `<button class="btn" type="button" data-close>${escapeHTML(t("settings.close"))}</button>`,
      onMount(root) {
        root.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
          setLanguage(b.getAttribute("data-lang"));
          closeModal();
          SV.detailData = null;
          SV.results = null;
          route();
          if (SV.route === "search" && SV.lastQuery) doSearch(SV.lastQuery);
          toast(t("toast.langChanged"));
        }));
        const sel = $("#settingsCountry", root);
        sel.addEventListener("change", () => {
          applyRegion(sel.value);
          toast(t("toast.saved"));
        });
        const platformSelect = $("#settingsPlatform", root);
        platformSelect.addEventListener("change", () => {
          setPlatform(platformSelect.value);
          closeModal();
          toast(t("toast.saved"));
        });
        root.querySelectorAll("[data-theme-choice]").forEach((b) => b.addEventListener("click", () => {
          setTheme(b.getAttribute("data-theme-choice"));
          toast(t("toast.saved"));
        }));
        root.querySelectorAll("[data-mirror]").forEach((b) => b.addEventListener("click", () => {
          setMirror(b.getAttribute("data-mirror"));
          closeModal();
          toast(t(b.getAttribute("data-mirror") === "china" ? "mirror.switched" : "mirror.officialSwitched"));
        }));
        root.querySelector('[data-act="disclaimer"]').addEventListener("click", openDisclaimerModal);
        root.querySelector('[data-act="history"]').addEventListener("click", openHistoryModal);
        root.querySelector('[data-act="usage"]').addEventListener("click", openUsageModal);
        root.querySelector('[data-act="folder"]').addEventListener("click", openConfigFolder);
        root.querySelector('[data-act="cache"]').addEventListener("click", clearImageCache);
        root.querySelector('[data-act="oss"]').addEventListener("click", openOssModal);
        const publicToggle = root.querySelector('[data-act="publicToggle"]');
        publicToggle.addEventListener("click", () => {
          SV.state.settings.publicService = !SV.state.settings.publicService;
          saveSoon();
          if (SV.state.settings.publicService) {
            loadPublicAds().then(() => {
              renderPublicAd();
              toast(t("public.enabled"));
            });
          } else {
            renderPublicAd();
            toast(t("public.disabled"));
          }
          publicToggle.textContent = SV.state.settings.publicService ? t("public.off") : t("public.on");
        });
        root.querySelector('[data-act="publicView"]').addEventListener("click", openPublicModal);
        root.querySelector('[data-act="quit"]').addEventListener("click", quitApp);
      }
    });
  }

  async function openConfigFolder() {
    if (SV.isAndroid) {
      if (window.Android.openConfigFolder) window.Android.openConfigFolder();
      toast(t("mobile.folder"));
      return;
    }
    try {
      const res = await fetch("/api/open-folder", { method: "POST" });
      if (!res.ok) throw new Error("open folder");
      toast(t("toast.folderOpened"));
    } catch {
      toast(t("toast.error"));
    }
  }

  async function quitApp() {
    if (SV.isAndroid) {
      try {
        if (window.Android.quit) window.Android.quit();
        else window.close();
      } catch {}
      return;
    }
    try {
      await fetch("/api/quit", { method: "POST" });
      document.body.innerHTML = '<div style="padding:48px;font:14px sans-serif">Gauge 已退出 / closed</div>';
    } catch {
      toast(t("toast.error"));
    }
  }

  async function clearImageCache() {
    try {
      if (SV.isAndroid && window.Android.clearImageCache) {
        window.Android.clearImageCache();
      } else {
        const res = await fetch("/api/clear-cache", { method: "POST" });
        if (!res.ok) throw new Error("cache");
      }
      toast(t("toast.cacheCleared"));
    } catch {
      toast(t("toast.error"));
    }
  }

  async function openPublicModal() {
    if (!SV.state.settings.publicService) {
      toast(t("public.disabled"));
      return;
    }
    await loadPublicAds();
    const ads = publicAdsForLang();
    const body = ads.length
      ? `<div class="public-list">${ads.map(publicAdCard).join("")}</div><p class="hint-text">${escapeHTML(t("public.note"))}</p>`
      : `<p class="history-empty">${escapeHTML(t("public.empty"))}</p>`;
    openModal({
      title: t("public.view"),
      body,
      footer: `<button class="btn" type="button" data-close>${escapeHTML(t("settings.close"))}</button>`,
      wide: true
    });
  }

  function openOssModal() {
    const body = `
      <div class="oss-list">
        <div class="oss-row"><strong>Android System WebView / Chromium</strong><span>BSD 3-Clause · ${escapeHTML(t("oss.browser"))}</span></div>
        <div class="oss-row"><strong>Go</strong><span>BSD 3-Clause · ${escapeHTML(t("oss.desktop"))}</span></div>
        <div class="oss-row"><strong>Gauge</strong><span>MIT · ${escapeHTML(t("oss.app"))}</span></div>
        <div class="oss-row"><strong>Steam Web API</strong><span>${escapeHTML(t("oss.data"))}</span></div>
      </div>
      <p class="disclaimer-text" style="padding-bottom:0">${escapeHTML(t("oss.note"))}</p>`;
    openModal({
      title: t("oss.title"),
      body,
      footer: `<button class="btn" type="button" data-close>${escapeHTML(t("settings.close"))}</button>`
    });
  }

  function openHistoryModal() {
    const items = (SV.state.history || []).slice(0, 80);
    const body = items.length ? `<div class="history-list">${items.map((item) => {
      if (item.kind === "search") {
        return `<div class="history-item">
          <div class="history-mark">#</div>
          <button type="button" data-history-query="${escapeHTML(item.query)}">
            <span class="history-name">${escapeHTML(item.query)}</span>
            <span class="history-meta"><span class="history-kind">${escapeHTML(t("history.searchType"))}</span></span>
          </button>
          <span class="history-time">${escapeHTML(formatDate(item.at, SV.lang))}</span>
        </div>`;
      }
      return `<div class="history-item">
        <img src="${imageURL(item.image)}" alt="" loading="lazy" onerror="this.onerror=null;this.src=window.SV_PLACEHOLDER">
        <button type="button" data-history-appid="${item.appid}">
          <span class="history-name">${escapeHTML(item.name || item.appid)}</span>
          <span class="history-meta"><span class="history-kind">${escapeHTML(t("history.gameType"))}</span><span>APPID ${item.appid}</span></span>
        </button>
        <span class="history-time">${escapeHTML(formatDate(item.at, SV.lang))}</span>
      </div>`;
    }).join("")}</div>` : `<p class="history-empty">${escapeHTML(t("history.empty"))}</p>`;

    const footer = `${items.length ? `<button class="btn" type="button" id="clearHistory">${escapeHTML(t("history.clear"))}</button>` : ""}
      <button class="btn" type="button" data-close>${escapeHTML(t("history.close"))}</button>`;
    openModal({
      title: t("history.title"),
      body,
      footer,
      wide: true,
      onMount(root) {
        root.querySelectorAll("[data-history-appid]").forEach((b) => b.addEventListener("click", () => {
          closeModal();
          location.hash = "#/game/" + b.getAttribute("data-history-appid");
        }));
        root.querySelectorAll("[data-history-query]").forEach((b) => b.addEventListener("click", () => {
          closeModal();
          location.hash = "#/";
          SV.lastQuery = b.getAttribute("data-history-query");
          $("#searchInput").value = SV.lastQuery;
          doSearch(SV.lastQuery);
        }));
        const clear = $("#clearHistory", root);
        if (clear) clear.addEventListener("click", () => {
          SV.state.history = [];
          saveSoon();
          closeModal();
          renderRecent();
          toast(t("toast.historyCleared"));
        });
      }
    });
  }

  async function getFreshUsage() {
    if (SV.isAndroid) {
      try { return JSON.parse(window.Android.getUsage() || "{}"); } catch { return SV.usage || {}; }
    }
    try {
      const res = await fetch("/api/usage", { cache: "no-store" });
      if (!res.ok) throw new Error("usage");
      return await res.json();
    } catch {
      return SV.usage || {};
    }
  }

  async function openUsageModal() {
    const usage = await getFreshUsage();
    SV.usage = usage;
    const launches = Array.isArray(usage.launches) ? usage.launches.slice(-20).reverse() : [];
    const body = `
      <div class="meta-list">
        <div class="meta-row"><span>${escapeHTML(t("usage.first"))}</span><span>${escapeHTML(formatDate(usage.firstLaunch, SV.lang, true))}</span></div>
        <div class="meta-row"><span>${escapeHTML(t("usage.last"))}</span><span>${escapeHTML(formatDate(usage.lastLaunch, SV.lang, true))}</span></div>
        <div class="meta-row"><span>${escapeHTML(t("usage.total"))}</span><span>${escapeHTML(formatDuration(usage.totalSeconds, SV.lang))}</span></div>
      </div>
      <h3 class="settings-label" style="margin-top:22px">${escapeHTML(t("usage.launches"))}</h3>
      ${launches.length ? `<div class="meta-list">${launches.map((l) => `
        <div class="meta-row"><span>${escapeHTML(formatDate(l.at, SV.lang, true))}</span><span>${escapeHTML(formatDuration(l.seconds, SV.lang))}</span></div>`).join("")}</div>` : `<p class="history-empty">${escapeHTML(t("usage.empty"))}</p>`}`;
    openModal({
      title: t("usage.title"),
      body,
      footer: `<button class="btn" type="button" data-close>${escapeHTML(t("usage.close"))}</button>`
    });
  }

  function openCountryModal() {
    const countries = COUNTRIES.map((c) => {
      const name = countryName(c.cc, SV.lang);
      return `<button class="country-choice" type="button" data-cc="${c.cc}">
        <span class="cc">${c.cc} / ${c.currency}</span><span class="cn">${escapeHTML(name)}</span>
      </button>`;
    }).join("");
    openModal({
      title: t("setup.countryTitle"),
      body: `<p class="hint-text" style="margin-top:0;margin-bottom:14px">${escapeHTML(t("setup.countrySub"))}</p><div class="setup-country-grid" style="border-top:1px solid var(--line)">${countries}</div>`,
      footer: `<button class="btn" type="button" data-close>${escapeHTML(t("settings.close"))}</button>`,
      wide: true,
      onMount(root) {
        root.querySelectorAll("[data-cc]").forEach((b) => b.addEventListener("click", () => {
          applyRegion(b.getAttribute("data-cc"));
          closeModal();
          toast(t("toast.saved"));
        }));
      }
    });
  }

  // ------------------------------------------------------------- usage heartbeat

  async function beatUsage() {
    if (document.hidden) return;
    try {
      if (SV.isAndroid && window.Android.beat) {
        window.Android.beat(20);
        SV.usage = JSON.parse(window.Android.getUsage() || "{}");
      } else {
        const res = await fetch("/api/usage/beat", { method: "POST" });
        if (res.ok) SV.usage = await res.json();
      }
    } catch {}
  }

  // ------------------------------------------------------------- routing / events

  function route() {
    if (!SV.state || SV.setupActive) return;
    if (!SV.state.settings.disclaimerAccepted) {
      showSetup();
      return;
    }
    const hash = location.hash || "#/";
    if (hash.startsWith("#/game/")) {
      const appid = Number(hash.replace("#/game/", "").split("?")[0]);
      if (!appid) { location.hash = "#/"; return; }
      if (SV.detailData && Number(SV.detailData.steam_appid) === appid) {
        showView("game");
      } else {
        loadGame(appid);
      }
      return;
    }
    if (hash.startsWith("#/web")) {
      renderWebView();
      return;
    }
    if (hash.startsWith("#/saved")) {
      renderSavedView();
      return;
    }
    renderSearchView();
  }

  function bindEvents() {
    $("#searchForm").addEventListener("submit", (e) => {
      e.preventDefault();
      doSearch($("#searchInput").value);
    });
    $("#brandLink").addEventListener("click", () => {
      if (SV.setupActive) return;
      // Let the hash change handle it; same-hash clicks still need a render.
      if (location.hash === "#/" || !location.hash) renderSearchView();
    });
    $("#regionButton").addEventListener("click", openCountryModal);
    $("#settingsButton").addEventListener("click", openSettings);
    window.addEventListener("hashchange", route);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("#modalRoot").innerHTML) closeModal();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (SV.setupActive) return;
        if (SV.route !== "search") location.hash = "#/";
        setTimeout(() => $("#searchInput").focus(), 80);
        return;
      }
      if (e.key === "/" && !e.target.matches("input, textarea, select") && !SV.setupActive && $("#modalRoot").innerHTML === "") {
        e.preventDefault();
        $("#searchInput").focus();
      }
    });
    const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onThemeChange = () => {
      if (((SV.state && SV.state.settings.theme) || "system") === "system") applyTheme();
    };
    if (themeQuery.addEventListener) themeQuery.addEventListener("change", onThemeChange);
    else if (themeQuery.addListener) themeQuery.addListener(onThemeChange);
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    window.addEventListener("pagehide", () => { clearTimeout(SV.saveTimer); flushState(); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) beatUsage(); });
    setInterval(beatUsage, 20000);
  }

  async function boot() {
    await loadState();
    SV.lang = SV.state.settings.language;
    SV.country = SV.state.settings.country;
    SV.mirror = SV.state.settings.mirror === "china" ? "china" : "official";
    SV.platform = SV.state.settings.platform || "steam";
    applyTheme();
    applyLanguage();
    updateOnlineState();
    bindEvents();
    if (!SV.state.settings.disclaimerAccepted) {
      showSetup();
    } else {
      route();
    }
  }

  boot();
})();
