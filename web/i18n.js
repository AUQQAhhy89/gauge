/* UI copy. Keep this file plain so it is easy to edit and audit. */
const LANGUAGES = [
  { code: "zh", native: "中文", english: "Chinese", steam: "schinese" },
  { code: "en", native: "English", english: "English", steam: "english" },
  { code: "ja", native: "日本語", english: "Japanese", steam: "japanese" },
  { code: "de", native: "Deutsch", english: "German", steam: "german" },
  { code: "ko", native: "한국어", english: "Korean", steam: "koreana" },
  { code: "ar", native: "العربية", english: "Arabic", steam: "arabic" }
];

const COUNTRIES = [
  { cc: "CN", currency: "CNY" }, { cc: "HK", currency: "HKD" },
  { cc: "TW", currency: "TWD" }, { cc: "JP", currency: "JPY" },
  { cc: "KR", currency: "KRW" }, { cc: "SG", currency: "SGD" },
  { cc: "MY", currency: "MYR" }, { cc: "TH", currency: "THB" },
  { cc: "ID", currency: "IDR" }, { cc: "PH", currency: "PHP" },
  { cc: "VN", currency: "VND" }, { cc: "IN", currency: "INR" },
  { cc: "US", currency: "USD" }, { cc: "CA", currency: "CAD" },
  { cc: "GB", currency: "GBP" }, { cc: "DE", currency: "EUR" },
  { cc: "FR", currency: "EUR" }, { cc: "NL", currency: "EUR" },
  { cc: "ES", currency: "EUR" }, { cc: "IT", currency: "EUR" },
  { cc: "PL", currency: "PLN" }, { cc: "TR", currency: "TRY" },
  { cc: "RU", currency: "RUB" }, { cc: "UA", currency: "UAH" },
  { cc: "BR", currency: "BRL" }, { cc: "MX", currency: "MXN" },
  { cc: "AR", currency: "USD" }, { cc: "CL", currency: "CLP" },
  { cc: "AU", currency: "AUD" }, { cc: "ZA", currency: "ZAR" },
  { cc: "AE", currency: "AED" }, { cc: "SA", currency: "SAR" }
];

const DISCLAIMER = {
  zh: [
    "本软件是第三方工具，与 Steam、Valve 及其关联公司没有关系，也未获得其授权。",
    "当前版本处于测试阶段。请勿将本软件的缺陷提交给 Steam 或 Valve。",
    "本软件免费提供。如果你为它付过费，请立即向收款方申请退款。",
    "本软件不以商业营销为目的，属于公益项目。",
    "使用中遇到的问题请反馈给制作者，并附上复现步骤和日志（如有）。",
    "全部代码开源，允许修改、二次分发与二次贩卖；再次发布时必须注明原代码出处。"
  ],
  en: [
    "This is third-party software. It is not affiliated with, endorsed by, or authorized by Steam, Valve, or their affiliates.",
    "This version is in beta. Please do not report bugs in this software to Steam or Valve.",
    "This software is free. If you paid for it, request a refund from the seller immediately.",
    "It has no commercial or marketing purpose; it is a community project.",
    "Report problems to the author, with reproduction steps and logs where possible.",
    "All code is open source. Modification, redistribution, and resale are allowed; derivative releases must credit the original source."
  ],
  ja: [
    "本ソフトは第三者製ツールであり、Steam、Valve およびその関連会社とは無関係で、承認も受けていません。",
    "本バージョンはテスト段階です。本ソフトの不具合を Steam や Valve に報告しないでください。",
    "本ソフトは無料です。支払った場合は、販売元に速やかに返金を求めてください。",
    "商業・宣伝目的はなく、コミュニティ向けのプロジェクトです。",
    "問題は作者まで、再現手順と可能であればログを添えて報告してください。",
    "全コードはオープンソースです。改変・再配布・再販売は可能ですが、再配布時は原典を明記してください。"
  ],
  de: [
    "Diese Software ist ein Drittanbieter-Tool. Sie steht in keiner Verbindung zu Steam, Valve oder verbundenen Unternehmen und ist nicht autorisiert.",
    "Diese Version ist eine Beta. Bitte melde Fehler dieser Software nicht an Steam oder Valve.",
    "Die Software ist kostenlos. Wenn du dafür bezahlt hast, fordere sofort eine Rückerstattung beim Verkäufer an.",
    "Sie verfolgt keine kommerziellen oder werblichen Zwecke und ist ein Community-Projekt.",
    "Melde Probleme an den Autor, möglichst mit Reproduktionsschritten und Logs.",
    "Der gesamte Code ist Open Source. Änderung, Weitergabe und Weiterverkauf sind erlaubt; abgeleitete Veröffentlichungen müssen die Originalquelle nennen."
  ],
  ko: [
    "이 소프트웨어는 제3자 도구이며 Steam, Valve 및 관련 회사와 무관하고 승인받지 않았습니다.",
    "이 버전은 테스트 단계입니다. 이 소프트웨어의 버그를 Steam이나 Valve에 신고하지 마세요.",
    "이 소프트웨어는 무료입니다. 비용을 지불했다면 판매자에게 즉시 환불을 요청하세요.",
    "상업적·홍보 목적이 없는 공익 프로젝트입니다.",
    "문제는 재현 절차와 가능한 로그를 첨부해 제작자에게 알려 주세요.",
    "모든 코드는 오픈 소스입니다. 수정, 재배포, 재판매가 허용되며 재배포 시 원출처를 표기해야 합니다."
  ],
  ar: [
    "هذا البرنامج أداة طرف ثالث، لا علاقة له بـ Steam أو Valve أو الشركات التابعة لهما، ولم يحصل على تفويض منهما.",
    "هذه النسخة في مرحلة الاختبار. لا تبلغ Steam أو Valve عن أخطاء هذا البرنامج.",
    "البرنامج مجاني. إذا دفعت مقابله، فاطلب استرداد المبلغ من البائع فورًا.",
    "لا يهدف إلى التسويق التجاري، وهو مشروع مجتمعي.",
    "أبلغ المؤلف بالمشكلات مع خطوات إعادة الإنتاج والسجلات إن أمكن.",
    "الشيفرة المصدرية مفتوحة بالكامل. يُسمح بالتعديل وإعادة التوزيع وإعادة البيع، ويجب ذكر المصدر الأصلي عند النشر المعدل."
  ]
};

const I18N = {
  zh: {
    tagline: "第三方 Steam 数据查看器",
    nav: { search: "搜索", saved: "收藏", web: "网页", settings: "设置" },
    mirror: {
      label: "浏览源", official: "官方源", china: "国内 CDN",
      hint: "国内 CDN 主要加速商店详情页和图片；社区、账户等页面仍走官方源。",
      notice: "在中国大陆访问 Steam 可能比较慢。切换到国内 CDN 后，商店详情页和图片会从国内节点加载。",
      switch: "切换到国内 CDN", switched: "已切换到国内 CDN", officialSwitched: "已切换到官方源"
    },
    theme: { label: "外观", system: "跟随系统", light: "浅色", dark: "深色" },
    public: { label: "公益项目", askTitle: "愿意助力公益项目吗？", askSub: "选择愿意后，Gauge 会按当前界面语言展示本地公益广告。内容来自公益机构公开信息，不收集个人数据，也可以在设置里随时关闭。", yes: "愿意", no: "暂不", note: "公益广告只用于公共信息传播，不涉及商业投放。", continue: "继续", badge: "公益", next: "换一条", view: "查看公益广告", on: "参与公益项目", off: "关闭公益广告", settingsHint: "开启后会按界面语言展示本地公益广告。", empty: "公益内容暂时不可用。", enabled: "已开启公益项目", disabled: "已关闭公益广告" },
    platform: { label: "游戏平台", beta: "内测", betaNote: "PlayStation / Xbox / Epic / WeGame 目前使用官方商店搜索，结果在应用内浏览器打开；价格与可用性以商店页面为准。", searchTitle: "在 {name} 搜索", searchPlaceholder: "在 {name} 搜索游戏", wegameSearch: "WeGame 暂不支持直接搜索，已打开官方商店。", browse: "浏览 {name}", webSub: "在系统默认浏览器中打开 {name} 官方商店。", gamePass: "Game Pass", freeGames: "免费游戏", settings: "游戏平台", openStore: "打开官方商店" },
    featured: { top: "正在热销", specials: "本周特惠" },
    search: {
      kicker: "STEAM / 公开数据", title: "搜索一款游戏",
      placeholder: "输入游戏名称或 AppID，支持模糊搜索", button: "搜索",
      hint: "数据来自 Steam 公开接口。价格与在线人数随地区、语言实时变化。",
      recent: "最近搜索", recentViews: "最近查看", noResults: "没有找到匹配的游戏。",
      error: "搜索失败，请检查网络后重试。", loading: "正在搜索", retry: "重试",
      results: "结果", prices: "正在读取价格"
    },
    setup: {
      languageKicker: "STEAM VIEWER", languageTitle: "选择语言",
      languageSub: "界面语言可以随时在设置中更改。",
      disclaimerKicker: "使用前须知", disclaimerTitle: "免责声明",
      agree: "我已阅读并同意以上内容", accept: "同意并继续",
      decline: "不同意并退出", declineNote: "需要同意免责声明才能使用本软件。",
      countryKicker: "STEP 03 / 地区", countryTitle: "选择国家或地区",
      countrySub: "这会决定商店价格、货币和可用内容。之后可在顶部栏更改。",
      enter: "进入"
    },
    detail: {
      back: "返回搜索", online: "当前在线", price: "当前价格",
      low: "历史最低", high: "历史最高", sales: "销量估算",
      appid: "Steam APPID", reviews: "评测总数", release: "发行日期",
      developer: "开发商", publisher: "发行商", genres: "类型", info: "游戏信息",
      about: "关于这款游戏", priceHistory: "本机价格记录", store: "Steam 商店",
      community: "社区中心", support: "客服页面", copy: "复制 APPID",
      copied: "已复制", refresh: "刷新在线人数", free: "免费", freeGame: "免费游戏", save: "收藏", saved: "已收藏", requirements: "系统需求", minimum: "最低配置", recommended: "推荐配置", news: "游戏新闻", newsEmpty: "暂无新闻",
      unknown: "未知", salesNote: "按公开评测数 × 30 估算，非官方销量",
      lowNote: "本机记录以来的最低价", highNote: "官方定价或本机记录的高点",
      historyNote: "价格记录只保存在本机，持续使用会自动积累。",
      noHistory: "暂无足够的价格记录。", loading: "正在读取游戏数据",
      error: "无法读取该游戏，请稍后重试。", retry: "重试",
      discount: "折扣", original: "原价", platforms: "平台",
      reviewsCount: "条评测", playersFallback: "SteamCharts 备用数据"
    },
    web: {
      kicker: "STEAM / 官方网页", title: "浏览 Steam",
      sub: "在系统默认浏览器中打开 Steam 官方页面。",
      placeholder: "粘贴 Steam 官方网页地址", open: "打开",
      invalid: "只支持 Steam 官方域名（steampowered.com、steamcommunity.com）。",
      quick: "快速入口", store: "商店首页", community: "社区首页",
      support: "客服中心", workshop: "创意工坊", news: "新闻中心", about: "关于 Steam",
      note: "本软件不代理、不修改官方网页内容。"
    },
    settings: {
      title: "设置", language: "界面语言", country: "国家或地区",
      data: "数据与隐私", disclaimer: "重新查看免责声明",
      history: "查看浏览记录", usage: "查看使用时间记录",
      folder: "打开配置文件夹", cache: "清除图片缓存",
      about: "关于", close: "关闭", cacheHint: "每次启动也会自动清除图片缓存。", quit: "退出软件", oss: "开源项目",
      folderHint: "设置、记录和缓存都保存在该文件夹。",
      version: "版本", source: "源代码", sourceNote: "MIT 许可，允许修改与再分发，请注明出处。"
    },
    saved: { title: "收藏夹", empty: "收藏夹是空的", emptyHint: "在搜索结果或游戏详情点星标即可收藏。", note: "价格为你收藏时的记录，重新打开游戏会更新。", priceSaved: "收藏时价格", remove: "移除", addedAt: "收藏于" },
    history: {
      title: "浏览记录", searchType: "搜索", gameType: "查看",
      empty: "还没有记录。", clear: "清空记录", close: "关闭",
      cleared: "浏览记录已清空。", removed: "记录已移除。"
    },
    usage: {
      title: "使用时间记录", first: "首次启动", last: "最近启动",
      total: "累计使用", launches: "启动记录", empty: "暂无记录。",
      close: "关闭", hours: "小时", minutes: "分钟", seconds: "秒"
    },
    disclaimer: { title: "免责声明", close: "关闭" },
    toast: {
      copied: "APPID 已复制", saved: "已保存", cacheCleared: "图片缓存已清除",
      folderOpened: "已打开配置文件夹", error: "操作失败",
      historyCleared: "浏览记录已清空", langChanged: "语言已切换", favorited: "已加入收藏", unfavorited: "已取消收藏"
    },
    footer: {
      notAffiliated: "与 Valve / Steam 无关", source: "开源项目",
      disclaimer: "仅供学习与查询公开数据"
    },
    offline: { text: "当前离线。收藏、历史和设置仍可使用，游戏数据需要联网。", search: "当前离线，搜索需要联网。" },
    oss: { title: "开源组件", note: "内置浏览器复用 Android System WebView（Chromium），不额外打包内核；Via / X 浏览器体积小也是同一原因。未使用任何前端框架或分析 SDK。", browser: "内置浏览器内核", desktop: "桌面端本地服务", app: "应用代码", data: "数据来源" },
    common: { loading: "加载中", na: "暂无", yes: "是", no: "否" },
    mobile: { folder: "手机版数据保存在应用内部存储，无法直接用文件管理器打开。" }
  },
  en: {
    tagline: "A third-party Steam data viewer",
    nav: { search: "Search", saved: "Saved", web: "Web", settings: "Settings" },
    mirror: {
      label: "Content source", official: "Official", china: "China CDN",
      hint: "The China CDN speeds up store pages and artwork. Community and account pages still use the official source.",
      notice: "Steam can be slow to reach from mainland China. Switch to the China CDN to load store pages and artwork from a domestic node.",
      switch: "Use China CDN", switched: "Switched to China CDN", officialSwitched: "Switched to the official source"
    },
    theme: { label: "Appearance", system: "System", light: "Light", dark: "Dark" },
    public: { label: "Public-interest project", askTitle: "Support a public-interest project?", askSub: "If you agree, Gauge will show local public-service messages based on your interface language. Content comes from public information published by civic organizations; no personal data is collected, and you can turn it off anytime in Settings.", yes: "I'm in", no: "Not now", note: "These messages are for public information only, not commercial advertising.", continue: "Continue", badge: "Public service", next: "Next", view: "View public-service messages", on: "Join the project", off: "Turn off public messages", settingsHint: "When enabled, local public-service messages are shown in your interface language.", empty: "Public-service content is temporarily unavailable.", enabled: "Public-interest project enabled", disabled: "Public messages turned off" },
    platform: { label: "Game platform", beta: "Beta", betaNote: "PlayStation / Xbox / Epic / WeGame currently use their official store search, opened in the in-app browser. Prices and availability are determined by the store page.", searchTitle: "Search {name}", searchPlaceholder: "Search games on {name}", wegameSearch: "WeGame does not support direct search yet; the official store was opened.", browse: "Browse {name}", webSub: "Open the official {name} store in your default browser.", gamePass: "Game Pass", freeGames: "Free games", settings: "Game platform", openStore: "Open official store" },
    featured: { top: "Top sellers", specials: "On sale" },
    search: {
      kicker: "STEAM / PUBLIC DATA", title: "Search a game",
      placeholder: "Game name or App ID, fuzzy search supported", button: "Search",
      hint: "Data comes from public Steam endpoints. Prices and player counts vary by region and language.",
      recent: "Recent searches", recentViews: "Recently viewed", noResults: "No matching games found.",
      error: "Search failed. Check your connection and try again.", loading: "Searching", retry: "Retry",
      results: "Results", prices: "Reading prices"
    },
    setup: {
      languageKicker: "STEAM VIEWER", languageTitle: "Choose language",
      languageSub: "You can change the interface language later in Settings.",
      disclaimerKicker: "BEFORE YOU START", disclaimerTitle: "Disclaimer",
      agree: "I have read and agree to the terms above", accept: "Agree and continue",
      decline: "Decline and exit", declineNote: "You must accept the disclaimer to use this software.",
      countryKicker: "STEP 03 / REGION", countryTitle: "Choose country or region",
      countrySub: "This sets store prices, currency, and availability. You can change it in the top bar.",
      enter: "Enter"
    },
    detail: {
      back: "Back to search", online: "Players online", price: "Current price",
      low: "Historical low", high: "Historical high", sales: "Sales estimate",
      appid: "Steam APPID", reviews: "Total reviews", release: "Release date",
      developer: "Developer", publisher: "Publisher", genres: "Genres", info: "Game information",
      about: "About this game", priceHistory: "Local price history", store: "Steam store",
      community: "Community hub", support: "Steam support", copy: "Copy APPID",
      copied: "Copied", refresh: "Refresh player count", free: "Free", freeGame: "Free to play", save: "Save", saved: "Saved", requirements: "System requirements", minimum: "Minimum", recommended: "Recommended", news: "Game news", newsEmpty: "No news yet",
      unknown: "Unknown", salesNote: "Estimated as public reviews × 30; not official sales",
      lowNote: "Lowest price recorded on this device", highNote: "Official list price or local record high",
      historyNote: "Price history is stored only on this device and grows as you use the app.",
      noHistory: "Not enough price history yet.", loading: "Loading game data",
      error: "Could not load this game. Try again later.", retry: "Retry",
      discount: "Discount", original: "List price", platforms: "Platforms",
      reviewsCount: "reviews", playersFallback: "SteamCharts fallback"
    },
    web: {
      kicker: "STEAM / OFFICIAL WEB", title: "Browse Steam",
      sub: "Open official Steam pages in your default browser.",
      placeholder: "Paste an official Steam page URL", open: "Open",
      invalid: "Only official Steam domains are supported (steampowered.com, steamcommunity.com).",
      quick: "Quick links", store: "Store home", community: "Community home",
      support: "Support", workshop: "Workshop", news: "News", about: "About Steam",
      note: "This app does not proxy or modify official web pages."
    },
    settings: {
      title: "Settings", language: "Interface language", country: "Country or region",
      data: "Data and privacy", disclaimer: "View disclaimer again",
      history: "View browsing history", usage: "View usage records",
      folder: "Open config folder", cache: "Clear image cache",
      about: "About", close: "Close", cacheHint: "Image cache is also cleared on every launch.", quit: "Quit app", oss: "Open source",
      folderHint: "Settings, records, and cache live in this folder.",
      version: "Version", source: "Source code", sourceNote: "MIT licensed. Modification and redistribution allowed with attribution."
    },
    saved: { title: "Saved games", empty: "Nothing saved yet", emptyHint: "Tap the star on a search result or game page.", note: "Prices are the values recorded when you saved the game; opening it again updates them.", priceSaved: "Saved price", remove: "Remove", addedAt: "Saved" },
    history: {
      title: "Browsing history", searchType: "Search", gameType: "View",
      empty: "No records yet.", clear: "Clear history", close: "Close",
      cleared: "Browsing history cleared.", removed: "Record removed."
    },
    usage: {
      title: "Usage records", first: "First launch", last: "Last launch",
      total: "Total time", launches: "Launch log", empty: "No records yet.",
      close: "Close", hours: "hours", minutes: "minutes", seconds: "seconds"
    },
    disclaimer: { title: "Disclaimer", close: "Close" },
    toast: {
      copied: "APPID copied", saved: "Saved", cacheCleared: "Image cache cleared",
      folderOpened: "Config folder opened", error: "Action failed",
      historyCleared: "Browsing history cleared", langChanged: "Language changed", favorited: "Saved", unfavorited: "Removed from saved"
    },
    footer: {
      notAffiliated: "Not affiliated with Valve / Steam", source: "Open source",
      disclaimer: "For public data reference only"
    },
    offline: { text: "You are offline. Saved games, history and settings still work; game data needs a connection.", search: "You are offline. Search needs a connection." },
    oss: { title: "Open source components", note: "The built-in browser reuses Android System WebView (Chromium) instead of bundling an engine; that is also why Via / X Browser stay small. No frontend framework or analytics SDK is used.", browser: "Built-in browser engine", desktop: "Desktop local host", app: "Application code", data: "Data source" },
    common: { loading: "Loading", na: "N/A", yes: "Yes", no: "No" },
    mobile: { folder: "Mobile data lives in the app's internal storage and cannot be opened in a file manager." }
  },
  ja: {
    tagline: "第三者製 Steam データビューア",
    nav: { search: "検索", saved: "保存済み", web: "ウェブ", settings: "設定" },
    mirror: {
      label: "表示ソース", official: "公式", china: "中国 CDN",
      hint: "中国 CDN はストア詳細と画像を高速化します。コミュニティとアカウントは公式のままです。",
      notice: "中国本土から Steam への接続は遅くなることがあります。中国 CDN に切り替えると、ストア詳細と画像を国内ノードから読み込みます。",
      switch: "中国 CDN に切り替え", switched: "中国 CDN に切り替えました", officialSwitched: "公式ソースに切り替えました"
    },
    theme: { label: "外観", system: "システム", light: "ライト", dark: "ダーク" },
    public: { label: "公益プロジェクト", askTitle: "公益プロジェクトに協力しますか？", askSub: "同意すると、表示言語に合わせて地域の公共広告を表示します。内容は公益団体の公開情報で、個人データは収集しません。設定からいつでもオフにできます。", yes: "協力する", no: "今はしない", note: "公共情報のための表示で、商業広告は含みません。", continue: "続ける", badge: "公益", next: "次へ", view: "公共広告を見る", on: "公益プロジェクトに参加", off: "公共広告をオフ", settingsHint: "オンにすると、表示言語に合わせて地域の公共広告を表示します。", empty: "公共広告は現在利用できません。", enabled: "公益プロジェクトをオンにしました", disabled: "公共広告をオフにしました" },
    platform: { label: "ゲームプラットフォーム", beta: "ベータ", betaNote: "PlayStation / Xbox / Epic / WeGame は現在、公式ストア検索をアプリ内ブラウザで開きます。価格と在庫はストアページが優先です。", searchTitle: "{name} で検索", searchPlaceholder: "{name} でゲームを検索", wegameSearch: "WeGame は直接検索に未対応のため、公式ストアを開きました。", browse: "{name} を閲覧", webSub: "{name} の公式ストアを既定のブラウザで開きます。", gamePass: "Game Pass", freeGames: "無料ゲーム", settings: "ゲームプラットフォーム", openStore: "公式ストアを開く" },
    featured: { top: "人気ランキング", specials: "セール中" },
    search: {
      kicker: "STEAM / 公開データ", title: "ゲームを検索",
      placeholder: "ゲーム名または APPID を入力（あいまい検索）", button: "検索",
      hint: "データは Steam の公開 API から取得します。価格とプレイヤー数は地域・言語で変わります。",
      recent: "最近の検索", recentViews: "最近見たゲーム", noResults: "一致するゲームがありません。",
      error: "検索に失敗しました。接続を確認して再試行してください。", loading: "検索中", retry: "再試行",
      results: "結果", prices: "価格を確認中"
    },
    setup: {
      languageKicker: "STEAM VIEWER", languageTitle: "言語を選択",
      languageSub: "表示言語は設定からいつでも変更できます。",
      disclaimerKicker: "使用前の確認", disclaimerTitle: "免責事項",
      agree: "上記を読み、同意します", accept: "同意して続行",
      decline: "同意せず終了", declineNote: "本ソフトを使用するには免責事項への同意が必要です。",
      countryKicker: "STEP 03 / 地域", countryTitle: "国または地域を選択",
      countrySub: "ストアの価格、通貨、提供状況が変わります。後で上部バーから変更できます。",
      enter: "開始"
    },
    detail: {
      back: "検索に戻る", online: "現在のプレイヤー数", price: "現在価格",
      low: "過去最安値", high: "過去最高値", sales: "販売数推定",
      appid: "Steam APPID", reviews: "レビュー総数", release: "発売日",
      developer: "開発元", publisher: "販売元", genres: "ジャンル", info: "ゲーム情報",
      about: "このゲームについて", priceHistory: "本機の価格記録", store: "Steam ストア",
      community: "コミュニティ", support: "サポート", copy: "APPID をコピー",
      copied: "コピーしました", refresh: "プレイヤー数を更新", free: "無料", freeGame: "無料プレイ", save: "保存", saved: "保存済み", requirements: "動作環境", minimum: "最低", recommended: "推奨", news: "ゲームニュース", newsEmpty: "ニュースはありません",
      unknown: "不明", salesNote: "公開レビュー数 × 30 の推定で、公式販売数ではありません",
      lowNote: "本機で記録した最安値", highNote: "公式定価または本機の記録最高値",
      historyNote: "価格履歴は本機にのみ保存され、使用するほど蓄積されます。",
      noHistory: "価格履歴がまだ足りません。", loading: "ゲームデータを読み込み中",
      error: "ゲームを読み込めませんでした。後でもう一度お試しください。", retry: "再試行",
      discount: "割引", original: "定価", platforms: "プラットフォーム",
      reviewsCount: "件のレビュー", playersFallback: "SteamCharts 代替データ"
    },
    web: {
      kicker: "STEAM / 公式ウェブ", title: "Steam を閲覧",
      sub: "Steam の公式ページを既定のブラウザで開きます。",
      placeholder: "Steam 公式ページの URL を貼り付け", open: "開く",
      invalid: "Steam 公式ドメインのみ対応しています（steampowered.com、steamcommunity.com）。",
      quick: "クイックリンク", store: "ストア", community: "コミュニティ",
      support: "サポート", workshop: "ワークショップ", news: "ニュース", about: "Steam について",
      note: "公式ページの内容を代理・改変することはありません。"
    },
    settings: {
      title: "設定", language: "表示言語", country: "国または地域",
      data: "データとプライバシー", disclaimer: "免責事項を再表示",
      history: "閲覧履歴を見る", usage: "使用時間記録を見る",
      folder: "設定フォルダを開く", cache: "画像キャッシュを削除",
      about: "このソフトについて", close: "閉じる", cacheHint: "起動時にも画像キャッシュは自動削除されます。", quit: "終了", oss: "オープンソース",
      folderHint: "設定・記録・キャッシュはこのフォルダに保存されます。",
      version: "バージョン", source: "ソースコード", sourceNote: "MIT ライセンス。出典を明記すれば改変・再配布できます。"
    },
    saved: { title: "保存済み", empty: "保存したゲームはありません", emptyHint: "検索結果またはゲームページの星を押してください。", note: "価格は保存時の記録です。再び開くと更新されます。", priceSaved: "保存時の価格", remove: "削除", addedAt: "保存日" },
    history: {
      title: "閲覧履歴", searchType: "検索", gameType: "閲覧",
      empty: "記録はまだありません。", clear: "履歴を消去", close: "閉じる",
      cleared: "閲覧履歴を消去しました。", removed: "記録を削除しました。"
    },
    usage: {
      title: "使用時間記録", first: "初回起動", last: "最終起動",
      total: "累計使用時間", launches: "起動履歴", empty: "記録はありません。",
      close: "閉じる", hours: "時間", minutes: "分", seconds: "秒"
    },
    disclaimer: { title: "免責事項", close: "閉じる" },
    toast: {
      copied: "APPID をコピーしました", saved: "保存しました", cacheCleared: "画像キャッシュを削除しました",
      folderOpened: "設定フォルダを開きました", error: "操作に失敗しました",
      historyCleared: "閲覧履歴を消去しました", langChanged: "言語を変更しました", favorited: "保存しました", unfavorited: "保存を解除しました"
    },
    footer: {
      notAffiliated: "Valve / Steam とは無関係です", source: "オープンソース",
      disclaimer: "公開データの参照用"
    },
    offline: { text: "オフラインです。保存済み、履歴、設定は利用できますが、ゲームデータには接続が必要です。", search: "オフラインです。検索には接続が必要です。" },
    oss: { title: "オープンソース", note: "内蔵ブラウザは Android System WebView（Chromium）を再利用し、エンジンを同梱していません。Via / X ブラウザが小さい理由も同じです。フロントエンドフレームワークや解析 SDK は使用していません。", browser: "内蔵ブラウザエンジン", desktop: "デスクトップローカルサービス", app: "アプリコード", data: "データソース" },
    common: { loading: "読み込み中", na: "なし", yes: "はい", no: "いいえ" },
    mobile: { folder: "モバイル版のデータはアプリ内部に保存され、ファイルマネージャーからは開けません。" }
  },
  de: {
    tagline: "Ein Drittanbieter-Viewer für Steam-Daten",
    nav: { search: "Suche", saved: "Gespeichert", web: "Web", settings: "Einstellungen" },
    mirror: {
      label: "Inhaltsquelle", official: "Offiziell", china: "China-CDN",
      hint: "Das China-CDN beschleunigt Shop-Seiten und Bilder. Community- und Kontoseiten nutzen weiterhin die offizielle Quelle.",
      notice: "Steam kann aus dem chinesischen Festland langsam erreichbar sein. Mit dem China-CDN werden Shop-Seiten und Bilder über einen inländischen Knoten geladen.",
      switch: "China-CDN verwenden", switched: "China-CDN aktiviert", officialSwitched: "Offizielle Quelle aktiviert"
    },
    theme: { label: "Darstellung", system: "System", light: "Hell", dark: "Dunkel" },
    public: { label: "Gemeinnütziges Projekt", askTitle: "Möchtest du ein gemeinnütziges Projekt unterstützen?", askSub: "Wenn du zustimmst, zeigt Gauge lokale öffentliche Hinweise in deiner Oberflächensprache. Die Inhalte stammen aus öffentlichen Informationen von Hilfsorganisationen; es werden keine persönlichen Daten erhoben. Du kannst die Anzeige jederzeit in den Einstellungen ausschalten.", yes: "Ja, gerne", no: "Nicht jetzt", note: "Die Hinweise dienen der öffentlichen Information und sind keine Werbung.", continue: "Weiter", badge: "Gemeinnützig", next: "Nächster", view: "Öffentliche Hinweise ansehen", on: "Am Projekt teilnehmen", off: "Öffentliche Hinweise aus", settingsHint: "Wenn aktiviert, werden lokale öffentliche Hinweise in deiner Sprache angezeigt.", empty: "Öffentliche Hinweise sind derzeit nicht verfügbar.", enabled: "Gemeinnütziges Projekt aktiviert", disabled: "Öffentliche Hinweise ausgeschaltet" },
    platform: { label: "Spielplattform", beta: "Beta", betaNote: "PlayStation / Xbox / Epic / WeGame nutzen derzeit die offizielle Store-Suche im integrierten Browser. Preise und Verfügbarkeit richten sich nach der Store-Seite.", searchTitle: "Auf {name} suchen", searchPlaceholder: "Spiele auf {name} suchen", wegameSearch: "WeGame unterstützt noch keine direkte Suche; der offizielle Store wurde geöffnet.", browse: "{name} durchsuchen", webSub: "Den offiziellen {name}-Store im Standardbrowser öffnen.", gamePass: "Game Pass", freeGames: "Kostenlose Spiele", settings: "Spielplattform", openStore: "Offiziellen Store öffnen" },
    featured: { top: "Meistverkauft", specials: "Im Angebot" },
    search: {
      kicker: "STEAM / OFFENE DATEN", title: "Spiel suchen",
      placeholder: "Spielname oder App-ID, unscharfe Suche möglich", button: "Suchen",
      hint: "Die Daten stammen aus öffentlichen Steam-Schnittstellen. Preise und Spielerzahlen hängen von Region und Sprache ab.",
      recent: "Letzte Suchen", recentViews: "Zuletzt angesehen", noResults: "Keine passenden Spiele gefunden.",
      error: "Suche fehlgeschlagen. Verbindung prüfen und erneut versuchen.", loading: "Suche läuft", retry: "Erneut",
      results: "Ergebnisse", prices: "Preise werden geladen"
    },
    setup: {
      languageKicker: "STEAM VIEWER", languageTitle: "Sprache wählen",
      languageSub: "Die Sprache lässt sich später in den Einstellungen ändern.",
      disclaimerKicker: "VOR DEM START", disclaimerTitle: "Haftungsausschluss",
      agree: "Ich habe das oben Gelesene gelesen und stimme zu", accept: "Zustimmen und fortfahren",
      decline: "Ablehnen und beenden", declineNote: "Ohne Zustimmung kann die Software nicht verwendet werden.",
      countryKicker: "SCHRITT 03 / REGION", countryTitle: "Land oder Region wählen",
      countrySub: "Dies bestimmt Preise, Währung und Verfügbarkeit. Später oben änderbar.",
      enter: "Starten"
    },
    detail: {
      back: "Zurück zur Suche", online: "Spieler online", price: "Aktueller Preis",
      low: "Historischer Tiefstpreis", high: "Historischer Höchstpreis", sales: "Verkaufsschätzung",
      appid: "Steam APPID", reviews: "Rezensionen insgesamt", release: "Erscheinungsdatum",
      developer: "Entwickler", publisher: "Publisher", genres: "Genres", info: "Spieldaten",
      about: "Über dieses Spiel", priceHistory: "Lokaler Preisverlauf", store: "Steam-Shop",
      community: "Community", support: "Support", copy: "APPID kopieren",
      copied: "Kopiert", refresh: "Spielerzahl aktualisieren", free: "Kostenlos", freeGame: "Kostenlos spielbar", save: "Speichern", saved: "Gespeichert", requirements: "Systemanforderungen", minimum: "Minimum", recommended: "Empfohlen", news: "Spiel-News", newsEmpty: "Noch keine News",
      unknown: "Unbekannt", salesNote: "Geschätzt aus öffentlichen Rezensionen × 30; keine offizielle Verkaufszahl",
      lowNote: "Tiefster auf diesem Gerät erfasster Preis", highNote: "Offizieller Listenpreis oder lokaler Höchstwert",
      historyNote: "Der Preisverlauf wird nur lokal gespeichert und wächst mit der Nutzung.",
      noHistory: "Noch nicht genug Preisverlauf.", loading: "Spieldaten werden geladen",
      error: "Spiel konnte nicht geladen werden. Später erneut versuchen.", retry: "Erneut",
      discount: "Rabatt", original: "Listenpreis", platforms: "Plattformen",
      reviewsCount: "Rezensionen", playersFallback: "SteamCharts-Ersatzdaten"
    },
    web: {
      kicker: "STEAM / OFFIZIELLES WEB", title: "Steam durchsuchen",
      sub: "Offizielle Steam-Seiten im Standardbrowser öffnen.",
      placeholder: "Offizielle Steam-URL einfügen", open: "Öffnen",
      invalid: "Nur offizielle Steam-Domains werden unterstützt (steampowered.com, steamcommunity.com).",
      quick: "Schnellzugriff", store: "Shop-Startseite", community: "Community",
      support: "Support", workshop: "Workshop", news: "News", about: "Über Steam",
      note: "Diese App verändert oder proxies offizielle Webseiten nicht."
    },
    settings: {
      title: "Einstellungen", language: "Sprache", country: "Land oder Region",
      data: "Daten und Datenschutz", disclaimer: "Haftungsausschluss erneut anzeigen",
      history: "Verlauf anzeigen", usage: "Nutzungszeiten anzeigen",
      folder: "Konfigurationsordner öffnen", cache: "Bildcache leeren",
      about: "Über", close: "Schließen", cacheHint: "Der Bildcache wird bei jedem Start automatisch geleert.", quit: "Beenden", oss: "Open Source",
      folderHint: "Einstellungen, Aufzeichnungen und Cache liegen in diesem Ordner.",
      version: "Version", source: "Quellcode", sourceNote: "MIT-Lizenz. Änderung und Weitergabe mit Quellenangabe erlaubt."
    },
    saved: { title: "Gespeichert", empty: "Noch nichts gespeichert", emptyHint: "Tippe auf den Stern in den Suchergebnissen oder auf der Spielseite.", note: "Preise sind der Stand beim Speichern; beim erneuten Öffnen werden sie aktualisiert.", priceSaved: "Preis beim Speichern", remove: "Entfernen", addedAt: "Gespeichert" },
    history: {
      title: "Verlauf", searchType: "Suche", gameType: "Angesehen",
      empty: "Noch keine Einträge.", clear: "Verlauf löschen", close: "Schließen",
      cleared: "Verlauf gelöscht.", removed: "Eintrag entfernt."
    },
    usage: {
      title: "Nutzungszeiten", first: "Erster Start", last: "Letzter Start",
      total: "Gesamtzeit", launches: "Startprotokoll", empty: "Keine Einträge.",
      close: "Schließen", hours: "Stunden", minutes: "Minuten", seconds: "Sekunden"
    },
    disclaimer: { title: "Haftungsausschluss", close: "Schließen" },
    toast: {
      copied: "APPID kopiert", saved: "Gespeichert", cacheCleared: "Bildcache geleert",
      folderOpened: "Konfigurationsordner geöffnet", error: "Aktion fehlgeschlagen",
      historyCleared: "Verlauf gelöscht", langChanged: "Sprache geändert", favorited: "Gespeichert", unfavorited: "Aus Gespeichert entfernt"
    },
    footer: {
      notAffiliated: "Nicht mit Valve / Steam verbunden", source: "Open Source",
      disclaimer: "Nur zur Einsicht in öffentliche Daten"
    },
    offline: { text: "Du bist offline. Gespeicherte Spiele, Verlauf und Einstellungen bleiben nutzbar; Spieldaten brauchen eine Verbindung.", search: "Du bist offline. Die Suche braucht eine Verbindung." },
    oss: { title: "Open-Source-Komponenten", note: "Der integrierte Browser nutzt Android System WebView (Chromium) und bündelt keine eigene Engine – deshalb bleiben auch Via / X Browser klein. Es werden kein Frontend-Framework und kein Analyse-SDK verwendet.", browser: "Integrierte Browser-Engine", desktop: "Desktop-Host", app: "Anwendungscode", data: "Datenquelle" },
    common: { loading: "Lädt", na: "Keine", yes: "Ja", no: "Nein" },
    mobile: { folder: "Mobile Daten liegen im internen App-Speicher und sind im Dateimanager nicht sichtbar." }
  },
  ko: {
    tagline: "제3자 Steam 데이터 뷰어",
    nav: { search: "검색", saved: "저장됨", web: "웹", settings: "설정" },
    mirror: {
      label: "콘텐츠 소스", official: "공식", china: "중국 CDN",
      hint: "중국 CDN은 상점 상세 페이지와 이미지를 빠르게 합니다. 커뮤니티와 계정 페이지는 계속 공식 소스를 사용합니다.",
      notice: "중국 본토에서 Steam 접속이 느릴 수 있습니다. 중국 CDN으로 전환하면 상점 상세 페이지와 이미지를 국내 노드에서 불러옵니다.",
      switch: "중국 CDN 사용", switched: "중국 CDN으로 전환했습니다", officialSwitched: "공식 소스로 전환했습니다"
    },
    theme: { label: "화면", system: "시스템", light: "라이트", dark: "다크" },
    public: { label: "공익 프로젝트", askTitle: "공익 프로젝트를 함께할까요?", askSub: "동의하면 인터페이스 언어에 맞춰 지역 공익 광고를 표시합니다. 내용은 공익 기관의 공개 정보이며 개인 데이터를 수집하지 않습니다. 설정에서 언제든 끌 수 있습니다.", yes: "참여할게요", no: "나중에", note: "공공 정보 전달을 위한 표시이며 상업 광고가 아닙니다.", continue: "계속", badge: "공익", next: "다음", view: "공익 광고 보기", on: "공익 프로젝트 참여", off: "공익 광고 끄기", settingsHint: "켜면 인터페이스 언어에 맞춰 지역 공익 광고를 표시합니다.", empty: "공익 콘텐츠를 현재 사용할 수 없습니다.", enabled: "공익 프로젝트를 켰습니다", disabled: "공익 광고를 껐습니다" },
    platform: { label: "게임 플랫폼", beta: "베타", betaNote: "PlayStation / Xbox / Epic / WeGame은 현재 공식 스토어 검색을 앱 내 브라우저에서 엽니다. 가격과 구매 가능 여부는 스토어 페이지를 기준으로 합니다.", searchTitle: "{name}에서 검색", searchPlaceholder: "{name}에서 게임 검색", wegameSearch: "WeGame은 아직 직접 검색을 지원하지 않아 공식 스토어를 열었습니다.", browse: "{name} 둘러보기", webSub: "기본 브라우저에서 {name} 공식 스토어를 엽니다.", gamePass: "Game Pass", freeGames: "무료 게임", settings: "게임 플랫폼", openStore: "공식 스토어 열기" },
    featured: { top: "인기 판매", specials: "할인 중" },
    search: {
      kicker: "STEAM / 공개 데이터", title: "게임 검색",
      placeholder: "게임 이름 또는 APP ID 입력, 부분 검색 지원", button: "검색",
      hint: "데이터는 Steam 공개 API에서 가져옵니다. 가격과 동시 접속자는 지역과 언어에 따라 달라집니다.",
      recent: "최근 검색", recentViews: "최근 본 게임", noResults: "일치하는 게임이 없습니다.",
      error: "검색에 실패했습니다. 연결을 확인하고 다시 시도하세요.", loading: "검색 중", retry: "다시 시도",
      results: "결과", prices: "가격 확인 중"
    },
    setup: {
      languageKicker: "STEAM VIEWER", languageTitle: "언어 선택",
      languageSub: "인터페이스 언어는 설정에서 언제든 바꿀 수 있습니다.",
      disclaimerKicker: "시작 전 확인", disclaimerTitle: "면책 조항",
      agree: "위 내용을 읽었으며 동의합니다", accept: "동의하고 계속",
      decline: "동의하지 않고 종료", declineNote: "면책 조항에 동의해야 사용할 수 있습니다.",
      countryKicker: "STEP 03 / 지역", countryTitle: "국가 또는 지역 선택",
      countrySub: "상점 가격, 통화, 이용 가능 여부가 결정됩니다. 나중에 상단 바에서 변경할 수 있습니다.",
      enter: "시작"
    },
    detail: {
      back: "검색으로 돌아가기", online: "현재 접속자", price: "현재 가격",
      low: "역대 최저가", high: "역대 최고가", sales: "판매량 추정",
      appid: "Steam APPID", reviews: "평가 수", release: "출시일",
      developer: "개발사", publisher: "배급사", genres: "장르", info: "게임 정보",
      about: "게임 정보", priceHistory: "기기 가격 기록", store: "Steam 상점",
      community: "커뮤니티", support: "고객 지원", copy: "APPID 복사",
      copied: "복사됨", refresh: "접속자 수 새로고침", free: "무료", freeGame: "무료 플레이", save: "저장", saved: "저장됨", requirements: "시스템 요구 사항", minimum: "최소", recommended: "권장", news: "게임 뉴스", newsEmpty: "뉴스가 없습니다",
      unknown: "알 수 없음", salesNote: "공개 평가 수 × 30 추정치이며 공식 판매량이 아닙니다",
      lowNote: "이 기기에서 기록된 최저가", highNote: "공식 정가 또는 기기 기록 최고가",
      historyNote: "가격 기록은 이 기기에만 저장되며 사용할수록 쌓입니다.",
      noHistory: "가격 기록이 아직 충분하지 않습니다.", loading: "게임 데이터 불러오는 중",
      error: "게임을 불러오지 못했습니다. 나중에 다시 시도하세요.", retry: "다시 시도",
      discount: "할인", original: "정가", platforms: "플랫폼",
      reviewsCount: "개 평가", playersFallback: "SteamCharts 대체 데이터"
    },
    web: {
      kicker: "STEAM / 공식 웹", title: "Steam 둘러보기",
      sub: "공식 Steam 페이지를 기본 브라우저에서 엽니다.",
      placeholder: "공식 Steam 페이지 URL 붙여넣기", open: "열기",
      invalid: "Steam 공식 도메인만 지원합니다(steampowered.com, steamcommunity.com).",
      quick: "바로가기", store: "상점 홈", community: "커뮤니티 홈",
      support: "고객 지원", workshop: "창작마당", news: "뉴스", about: "Steam 정보",
      note: "공식 웹 페이지를 프록시하거나 수정하지 않습니다."
    },
    settings: {
      title: "설정", language: "인터페이스 언어", country: "국가 또는 지역",
      data: "데이터 및 개인정보", disclaimer: "면책 조항 다시 보기",
      history: "방문 기록 보기", usage: "사용 시간 기록 보기",
      folder: "설정 폴더 열기", cache: "이미지 캐시 지우기",
      about: "정보", close: "닫기", cacheHint: "시작할 때마다 이미지 캐시도 자동으로 지워집니다.", quit: "종료", oss: "오픈 소스",
      folderHint: "설정, 기록, 캐시는 이 폴더에 저장됩니다.",
      version: "버전", source: "소스 코드", sourceNote: "MIT 라이선스. 출처를 표시하면 수정과 재배포가 허용됩니다."
    },
    saved: { title: "저장된 게임", empty: "저장된 게임이 없습니다", emptyHint: "검색 결과나 게임 페이지에서 별표를 누르세요.", note: "가격은 저장 당시의 기록이며, 게임을 다시 열면 갱신됩니다.", priceSaved: "저장 당시 가격", remove: "삭제", addedAt: "저장일" },
    history: {
      title: "방문 기록", searchType: "검색", gameType: "조회",
      empty: "기록이 없습니다.", clear: "기록 지우기", close: "닫기",
      cleared: "방문 기록을 지웠습니다.", removed: "기록을 삭제했습니다."
    },
    usage: {
      title: "사용 시간 기록", first: "첫 실행", last: "최근 실행",
      total: "누적 사용", launches: "실행 기록", empty: "기록이 없습니다.",
      close: "닫기", hours: "시간", minutes: "분", seconds: "초"
    },
    disclaimer: { title: "면책 조항", close: "닫기" },
    toast: {
      copied: "APPID 복사됨", saved: "저장됨", cacheCleared: "이미지 캐시를 지웠습니다",
      folderOpened: "설정 폴더를 열었습니다", error: "작업 실패",
      historyCleared: "방문 기록을 지웠습니다", langChanged: "언어가 변경되었습니다", favorited: "저장했습니다", unfavorited: "저장을 해제했습니다"
    },
    footer: {
      notAffiliated: "Valve / Steam과 무관", source: "오픈 소스",
      disclaimer: "공개 데이터 참고용"
    },
    offline: { text: "오프라인입니다. 저장된 게임, 기록, 설정은 사용할 수 있지만 게임 데이터는 연결이 필요합니다.", search: "오프라인입니다. 검색에는 연결이 필요합니다." },
    oss: { title: "오픈 소스 구성 요소", note: "내장 브라우저는 Android System WebView(Chromium)를 재사용하며 엔진을 포함하지 않습니다. Via / X 브라우저가 작은 이유도 같습니다. 프런트엔드 프레임워크나 분석 SDK는 사용하지 않습니다.", browser: "내장 브라우저 엔진", desktop: "데스크톱 로컬 호스트", app: "애플리케이션 코드", data: "데이터 소스" },
    common: { loading: "불러오는 중", na: "없음", yes: "예", no: "아니요" },
    mobile: { folder: "모바일 데이터는 앱 내부 저장소에 있어 파일 관리자에서 열 수 없습니다." }
  },
  ar: {
    tagline: "عارض بيانات Steam من طرف ثالث",
    nav: { search: "بحث", saved: "المحفوظات", web: "الويب", settings: "الإعدادات" },
    mirror: {
      label: "مصدر المحتوى", official: "المصدر الرسمي", china: "CDN الصين",
      hint: "يعمل CDN الصيني على تسريع صفحات المتجر والصور. لا تزال صفحات المجتمع والحساب تستخدم المصدر الرسمي.",
      notice: "قد يكون الوصول إلى Steam من البر الرئيسي الصيني بطيئًا. عند التبديل إلى CDN الصيني، تُحمّل صفحات المتجر والصور من عقدة محلية.",
      switch: "استخدام CDN الصيني", switched: "تم التبديل إلى CDN الصيني", officialSwitched: "تم التبديل إلى المصدر الرسمي"
    },
    theme: { label: "المظهر", system: "النظام", light: "فاتح", dark: "داكن" },
    public: { label: "مشروع خيري", askTitle: "هل ترغب في دعم مشروع خيري؟", askSub: "إذا وافقت، سيعرض Gauge رسائل خدمة عامة محلية حسب لغة الواجهة. المحتوى من معلومات عامة تنشرها مؤسسات مدنية، ولا تُجمع أي بيانات شخصية، ويمكنك إيقافه في أي وقت من الإعدادات.", yes: "أوافق", no: "ليس الآن", note: "هذه الرسائل للمعلومات العامة فقط وليست إعلانات تجارية.", continue: "متابعة", badge: "خدمة عامة", next: "التالي", view: "عرض رسائل الخدمة العامة", on: "المشاركة في المشروع", off: "إيقاف الرسائل العامة", settingsHint: "عند التفعيل، تُعرض رسائل خدمة عامة محلية بلغة الواجهة.", empty: "محتوى الخدمة العامة غير متاح مؤقتًا.", enabled: "تم تفعيل المشروع الخيري", disabled: "تم إيقاف الرسائل العامة" },
    platform: { label: "منصة الألعاب", beta: "تجريبي", betaNote: "تستخدم PlayStation / Xbox / Epic / WeGame حاليًا بحث المتجر الرسمي داخل المتصفح المدمج. الأسعار والتوفر حسب صفحة المتجر.", searchTitle: "البحث في {name}", searchPlaceholder: "ابحث عن ألعاب على {name}", wegameSearch: "لا يدعم WeGame البحث المباشر بعد؛ تم فتح المتجر الرسمي.", browse: "تصفح {name}", webSub: "افتح متجر {name} الرسمي في المتصفح الافتراضي.", gamePass: "Game Pass", freeGames: "ألعاب مجانية", settings: "منصة الألعاب", openStore: "فتح المتجر الرسمي" },
    featured: { top: "الأكثر مبيعًا", specials: "عروض" },
    search: {
      kicker: "STEAM / بيانات عامة", title: "ابحث عن لعبة",
      placeholder: "اسم اللعبة أو APPID، البحث التقريبي مدعوم", button: "بحث",
      hint: "البيانات من واجهات Steam العامة. تختلف الأسعار وعدد اللاعبين حسب المنطقة واللغة.",
      recent: "عمليات البحث الأخيرة", recentViews: "شوهدت مؤخرًا", noResults: "لم يتم العثور على ألعاب مطابقة.",
      error: "فشل البحث. تحقق من الاتصال وحاول مجددًا.", loading: "جارٍ البحث", retry: "إعادة المحاولة",
      results: "النتائج", prices: "جارٍ قراءة الأسعار"
    },
    setup: {
      languageKicker: "STEAM VIEWER", languageTitle: "اختر اللغة",
      languageSub: "يمكنك تغيير لغة الواجهة لاحقًا من الإعدادات.",
      disclaimerKicker: "قبل البدء", disclaimerTitle: "إخلاء المسؤولية",
      agree: "قرأت ما ورد أعلاه وأوافق عليه", accept: "أوافق وأتابع",
      decline: "أرفض وأخرج", declineNote: "يجب الموافقة على إخلاء المسؤولية لاستخدام البرنامج.",
      countryKicker: "الخطوة 03 / المنطقة", countryTitle: "اختر الدولة أو المنطقة",
      countrySub: "يحدد هذا أسعار المتجر والعملة والتوفر. يمكنك تغييره من الشريط العلوي.",
      enter: "دخول"
    },
    detail: {
      back: "العودة إلى البحث", online: "اللاعبون الآن", price: "السعر الحالي",
      low: "أدنى سعر تاريخي", high: "أعلى سعر تاريخي", sales: "تقدير المبيعات",
      appid: "Steam APPID", reviews: "إجمالي التقييمات", release: "تاريخ الإصدار",
      developer: "المطور", publisher: "الناشر", genres: "الأنواع", info: "معلومات اللعبة",
      about: "عن هذه اللعبة", priceHistory: "سجل الأسعار المحلي", store: "متجر Steam",
      community: "مركز المجتمع", support: "الدعم", copy: "نسخ APPID",
      copied: "تم النسخ", refresh: "تحديث عدد اللاعبين", free: "مجاني", freeGame: "مجاني للعب", save: "حفظ", saved: "محفوظ", requirements: "متطلبات النظام", minimum: "الحد الأدنى", recommended: "الموصى به", news: "أخبار اللعبة", newsEmpty: "لا توجد أخبار بعد",
      unknown: "غير معروف", salesNote: "تقدير من التقييمات العامة × 30، وليس مبيعات رسمية",
      lowNote: "أدنى سعر مسجل على هذا الجهاز", highNote: "سعر القائمة الرسمي أو أعلى سعر محلي",
      historyNote: "يُحفظ سجل الأسعار على هذا الجهاز فقط وينمو مع الاستخدام.",
      noHistory: "لا يوجد سجل أسعار كافٍ بعد.", loading: "جارٍ تحميل بيانات اللعبة",
      error: "تعذر تحميل اللعبة. حاول لاحقًا.", retry: "إعادة المحاولة",
      discount: "خصم", original: "السعر الأصلي", platforms: "المنصات",
      reviewsCount: "تقييم", playersFallback: "بيانات SteamCharts البديلة"
    },
    web: {
      kicker: "STEAM / الويب الرسمي", title: "تصفح Steam",
      sub: "افتح صفحات Steam الرسمية في المتصفح الافتراضي.",
      placeholder: "ألصق رابط صفحة Steam الرسمية", open: "فتح",
      invalid: "تدعم فقط نطاقات Steam الرسمية (steampowered.com، steamcommunity.com).",
      quick: "روابط سريعة", store: "الصفحة الرئيسية للمتجر", community: "المجتمع",
      support: "الدعم", workshop: "ورشة العمل", news: "الأخبار", about: "حول Steam",
      note: "لا يقوم البرنامج بوساطة صفحات الويب الرسمية أو تعديلها."
    },
    settings: {
      title: "الإعدادات", language: "لغة الواجهة", country: "الدولة أو المنطقة",
      data: "البيانات والخصوصية", disclaimer: "عرض إخلاء المسؤولية مجددًا",
      history: "عرض سجل التصفح", usage: "عرض سجل وقت الاستخدام",
      folder: "فتح مجلد الإعدادات", cache: "مسح ذاكرة الصور",
      about: "حول", close: "إغلاق", cacheHint: "تُمسح ذاكرة الصور تلقائيًا عند كل تشغيل.", quit: "إنهاء التطبيق", oss: "مفتوح المصدر",
      folderHint: "تُحفظ الإعدادات والسجلات والذاكرة في هذا المجلد.",
      version: "الإصدار", source: "الشيفرة المصدرية", sourceNote: "رخصة MIT. يُسمح بالتعديل وإعادة التوزيع مع ذكر المصدر."
    },
    saved: { title: "المحفوظات", empty: "لا توجد ألعاب محفوظة", emptyHint: "اضغط على النجمة في نتائج البحث أو صفحة اللعبة.", note: "الأسعار هي القيم المسجلة عند الحفظ، وتُحدّث عند فتح اللعبة مجددًا.", priceSaved: "سعر الحفظ", remove: "إزالة", addedAt: "حُفظت" },
    history: {
      title: "سجل التصفح", searchType: "بحث", gameType: "مشاهدة",
      empty: "لا توجد سجلات بعد.", clear: "مسح السجل", close: "إغلاق",
      cleared: "تم مسح سجل التصفح.", removed: "تم حذف السجل."
    },
    usage: {
      title: "سجل وقت الاستخدام", first: "أول تشغيل", last: "آخر تشغيل",
      total: "إجمالي الوقت", launches: "سجل التشغيل", empty: "لا توجد سجلات.",
      close: "إغلاق", hours: "ساعات", minutes: "دقائق", seconds: "ثوانٍ"
    },
    disclaimer: { title: "إخلاء المسؤولية", close: "إغلاق" },
    toast: {
      copied: "تم نسخ APPID", saved: "تم الحفظ", cacheCleared: "تم مسح ذاكرة الصور",
      folderOpened: "تم فتح مجلد الإعدادات", error: "فشلت العملية",
      historyCleared: "تم مسح سجل التصفح", langChanged: "تم تغيير اللغة", favorited: "تم الحفظ", unfavorited: "تمت الإزالة من المحفوظات"
    },
    footer: {
      notAffiliated: "غير مرتبط بـ Valve / Steam", source: "مفتوح المصدر",
      disclaimer: "للاطلاع على البيانات العامة فقط"
    },
    offline: { text: "أنت غير متصل. تظل الألعاب المحفوظة والسجل والإعدادات متاحة، لكن بيانات الألعاب تحتاج إلى اتصال.", search: "أنت غير متصل. البحث يحتاج إلى اتصال." },
    oss: { title: "مكونات مفتوحة المصدر", note: "يعيد المتصفح المدمج استخدام Android System WebView (Chromium) بدل تضمين محرك منفصل؛ ولهذا أيضًا يبقى متصفح Via / X صغيرًا. لا تُستخدم أي مكتبة واجهة أو SDK تحليلات.", browser: "محرك المتصفح المدمج", desktop: "خدمة سطح المكتب المحلية", app: "شيفرة التطبيق", data: "مصدر البيانات" },
    common: { loading: "جارٍ التحميل", na: "غير متاح", yes: "نعم", no: "لا" },
    mobile: { folder: "بيانات الهاتف محفوظة داخل تخزين التطبيق ولا يمكن فتحها بمدير الملفات." }
  }
};

function t(key, fallback) {
  const lang = (window.SV && window.SV.lang) || "zh";
  const parts = key.split(".");
  let cur = I18N[lang] || I18N.zh;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return fallback ?? key;
    cur = cur[p];
  }
  if (cur === undefined) {
    let fb = I18N.en;
    for (const p of parts) { fb = fb && fb[p]; }
    return fb ?? fallback ?? key;
  }
  return cur;
}

function languageMeta(code) {
  return LANGUAGES.find((x) => x.code === code) || LANGUAGES[0];
}

function countryName(cc, lang) {
  try {
    return new Intl.DisplayNames([lang], { type: "region" }).of(cc) || cc;
  } catch {
    return cc;
  }
}

function formatNumber(n, lang, compact = false) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  try {
    return new Intl.NumberFormat(lang, compact ? { notation: "compact", maximumFractionDigits: 1 } : { maximumFractionDigits: 0 }).format(Number(n));
  } catch {
    return String(n);
  }
}

function formatDate(ts, lang, withTime = false) {
  if (!ts) return "—";
  const n = Number(ts);
  const date = new Date(n < 1e12 ? n * 1000 : n);
  try {
    return new Intl.DateTimeFormat(lang, withTime
      ? { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }
      : { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function formatDuration(seconds, lang) {
  seconds = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h} ${t("usage.hours")} ${m} ${t("usage.minutes")}`;
  if (m > 0) return `${m} ${t("usage.minutes")} ${s} ${t("usage.seconds")}`;
  return `${s} ${t("usage.seconds")}`;
}
