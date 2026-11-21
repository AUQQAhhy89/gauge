package io.github.steamviewer;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsetsController;
import android.view.inputmethod.EditorInfo;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/**
 * A deliberately small in-app browser. It does not bundle a browser engine:
 * it reuses the system WebView (Chromium), the same approach used by small
 * browsers such as Via/X Browser.
 */
public class BrowserActivity extends Activity {
    private WebView webView;
    private EditText address;
    private boolean dark;
    private int bg;
    private int ink;
    private int muted;
    private int field;
    private int fieldStroke;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        dark = getIntent().getBooleanExtra("dark", false);
        bg = dark ? Color.rgb(27, 27, 26) : Color.rgb(233, 233, 231);
        ink = dark ? Color.rgb(240, 240, 237) : Color.rgb(21, 21, 21);
        muted = dark ? Color.rgb(163, 163, 158) : Color.rgb(108, 108, 105);
        field = dark ? Color.rgb(36, 36, 35) : Color.rgb(244, 244, 242);
        fieldStroke = dark ? Color.rgb(61, 61, 58) : Color.rgb(216, 216, 213);
        setTitle("Gauge");
        buildUi();
        configureBars();
        String url = getIntent().getStringExtra("url");
        if (url != null && !url.isEmpty()) webView.loadUrl(url);
    }

    private void buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(bg);

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(dp(8), dp(6), dp(8), dp(6));
        toolbar.setBackgroundColor(bg);

        TextView back = makeButton("‹", "Back");
        back.setOnClickListener(v -> {
            if (webView != null && webView.canGoBack()) webView.goBack();
            else finish();
        });
        toolbar.addView(back);

        address = new EditText(this);
        address.setSingleLine(true);
        address.setTextSize(12);
        address.setTextColor(ink);
        address.setHintTextColor(muted);
        address.setHint("https://store.steampowered.com");
        address.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        address.setImeOptions(EditorInfo.IME_ACTION_GO);
        address.setPadding(dp(12), 0, dp(12), 0);
        address.setBackground(rounded(field, fieldStroke, 16));
        LinearLayout.LayoutParams addressParams = new LinearLayout.LayoutParams(0,
                dp(38), 1f);
        addressParams.setMargins(dp(4), 0, dp(4), 0);
        toolbar.addView(address, addressParams);
        address.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_GO || actionId == EditorInfo.IME_ACTION_DONE) {
                loadAddress();
                return true;
            }
            return false;
        });

        TextView reload = makeButton("↻", "Reload");
        reload.setOnClickListener(v -> { if (webView != null) webView.reload(); });
        toolbar.addView(reload);

        TextView external = makeButton("↗", "Open in external browser");
        external.setOnClickListener(v -> {
            String current = webView != null && webView.getUrl() != null ? webView.getUrl() : address.getText().toString();
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(current)));
            } catch (Exception ignored) {}
        });
        toolbar.addView(external);

        TextView close = makeButton("×", "Close");
        close.setOnClickListener(v -> finish());
        toolbar.addView(close);

        root.addView(toolbar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));

        webView = new WebView(this);
        webView.setBackgroundColor(bg);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setSupportZoom(false);
        s.setUseWideViewPort(false);
        s.setLoadWithOverviewMode(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setTextZoom(100);
        s.setUserAgentString("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 Gauge/1.3.0");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                String scheme = u.getScheme() == null ? "" : u.getScheme().toLowerCase();
                if ("http".equals(scheme) || "https".equals(scheme)) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                address.setText(url);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (url != null && !url.isEmpty()) address.setText(url);
            }
        });
        webView.setWebChromeClient(new WebChromeClient());
        root.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        setContentView(root);
    }

    private TextView makeButton(String text, String description) {
        TextView b = new TextView(this);
        b.setText(text);
        b.setTextSize(20);
        b.setTextColor(ink);
        b.setGravity(Gravity.CENTER);
        b.setContentDescription(description);
        b.setLayoutParams(new LinearLayout.LayoutParams(dp(38), dp(38)));
        return b;
    }

    private GradientDrawable rounded(int fill, int stroke, int radiusDp) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(fill);
        d.setCornerRadius(dp(radiusDp));
        d.setStroke(dp(1), stroke);
        return d;
    }

    private void loadAddress() {
        String raw = address.getText().toString().trim();
        if (raw.isEmpty()) return;
        if (!raw.startsWith("http://") && !raw.startsWith("https://")) raw = "https://" + raw;
        Uri u;
        try {
            u = Uri.parse(raw);
        } catch (Exception e) {
            Toast.makeText(this, "Invalid URL", Toast.LENGTH_SHORT).show();
            return;
        }
        if (!"https".equalsIgnoreCase(u.getScheme()) && !"http".equalsIgnoreCase(u.getScheme())) {
            Toast.makeText(this, "Only http/https pages are supported", Toast.LENGTH_SHORT).show();
            return;
        }
        webView.loadUrl(raw);
    }

    private void configureBars() {
        Window w = getWindow();
        w.setStatusBarColor(bg);
        w.setNavigationBarColor(bg);
        int lightFlags = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS |
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = w.getInsetsController();
            if (c != null) c.setSystemBarsAppearance(dark ? 0 : lightFlags, lightFlags);
        } else {
            int flags = dark ? 0 : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 26 && !dark) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            w.getDecorView().setSystemUiVisibility(flags);
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
