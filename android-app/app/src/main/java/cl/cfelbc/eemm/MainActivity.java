package cl.cfelbc.eemm;

import android.Manifest;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.Settings;
import android.content.pm.ResolveInfo;
import android.util.Base64;
import android.media.MediaScannerConnection;
import java.net.HttpURLConnection;
import java.net.URL;
import org.json.JSONObject;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.material.button.MaterialButton;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {

    private static final String APP_URL = "https://eemm.cfelbc.cl";

    private WebView webView;
    private ProgressBar progressBar;
    private SwipeRefreshLayout swipeRefreshLayout;
    private LinearLayout errorView;
    private MaterialButton btnRetry;

    private ValueCallback<Uri[]> fileUploadCallback;
    private Uri cameraCaptureUri;
    private long lastBackPressedTime = 0;

    private ActivityResultLauncher<Intent> fileChooserLauncher;
    private ActivityResultLauncher<String[]> permissionsLauncher;
    private ActivityResultLauncher<Intent> manageUnknownSourcesLauncher;
    private File pendingInstallApk = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupStatusBar();
        setContentView(R.layout.activity_main);

        initViews();
        setupLaunchers();
        setupWebView();
        setupSwipeRefresh();
        setupBackNavigation();

        hideErrorScreen();
        webView.loadUrl(APP_URL);
    }

    private void setupStatusBar() {
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        int darkColor = ContextCompat.getColor(this, R.color.app_bg_dark);
        window.setStatusBarColor(darkColor);
        window.setNavigationBarColor(darkColor);
        window.setBackgroundDrawable(new ColorDrawable(darkColor));

        // Forzar iconos claros/blancos en la barra de estado (batería, reloj, wifi) para máxima visibilidad sin reflejos
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
        if (insetsController != null) {
            insetsController.setAppearanceLightStatusBars(false);
            insetsController.setAppearanceLightNavigationBars(false);
        }
    }

    private void initViews() {
        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        errorView = findViewById(R.id.errorView);
        btnRetry = findViewById(R.id.btnRetry);

        btnRetry.setOnClickListener(v -> {
            hideErrorScreen();
            webView.loadUrl(APP_URL);
        });
    }

    private void setupLaunchers() {
        fileChooserLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (fileUploadCallback == null) return;

                    Uri[] results = null;
                    if (result.getResultCode() == RESULT_OK) {
                        if (result.getData() != null && result.getData().getData() != null) {
                            // File selected from storage
                            results = new Uri[]{result.getData().getData()};
                        } else if (cameraCaptureUri != null) {
                            // Photo taken with camera
                            results = new Uri[]{cameraCaptureUri};
                        }
                    }

                    fileUploadCallback.onReceiveValue(results);
                    fileUploadCallback = null;
                }
        );

        permissionsLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestMultiplePermissions(),
                permissions -> {
                    // Once permissions granted, launch file chooser intent
                    launchFileChooserIntent();
                }
        );

        manageUnknownSourcesLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        if (getPackageManager().canRequestPackageInstalls() && pendingInstallApk != null) {
                            launchInstallerIntent(pendingInstallApk);
                            pendingInstallApk = null;
                        }
                    }
                }
        );
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        webView.setBackgroundColor(ContextCompat.getColor(this, R.color.app_bg_dark));
        swipeRefreshLayout.setBackgroundColor(ContextCompat.getColor(this, R.color.app_bg_dark));

        // Append custom indicator to User-Agent
        String defaultUa = settings.getUserAgentString();
        settings.setUserAgentString(defaultUa + " EEMM_Android_App/1.0");

        // Enable cookies
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // Puente Javascript para descargas y visualización nativa de PDF
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        // WebViewClient con interceptor para soporte 100% offline
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String path = uri.getPath();

                // Servir la aplicación web localmente desde los assets del APK
                if (path == null || path.equals("/") || path.equals("/index.html")) {
                    return getAssetResponse("index.html", "text/html");
                } else if (path.startsWith("/static/")) {
                    String assetPath = path.substring(1);
                    int qIdx = assetPath.indexOf('?');
                    if (qIdx != -1) {
                        assetPath = assetPath.substring(0, qIdx);
                    }
                    String mime = getMimeType(assetPath);
                    WebResourceResponse response = getAssetResponse(assetPath, mime);
                    if (response != null) {
                        return response;
                    }
                }

                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                hideErrorScreen();
                progressBar.setVisibility(View.VISIBLE);
                progressBar.setProgress(10);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                swipeRefreshLayout.setRefreshing(false);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame() && !request.getUrl().toString().contains("eemm.cfelbc.cl")) {
                    showErrorScreen();
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String path = uri.getPath();

                // Interceptar descarga e instalación directa de actualización APK
                if (path != null && path.endsWith(".apk")) {
                    downloadAndInstallApk(uri.toString());
                    return true;
                }

                // Interceptar peticiones de PDF para descargarlas de forma nativa con DownloadManager
                if (path != null && (path.endsWith("/pdf") || path.endsWith(".pdf") || path.contains("/pdf/"))) {
                    try {
                        String downloadUrl = uri.toString();
                        if (!downloadUrl.contains("download=")) {
                            downloadUrl += (downloadUrl.contains("?") ? "&" : "?") + "download=true";
                        }
                        DownloadManager.Request dmReq = new DownloadManager.Request(Uri.parse(downloadUrl));
                        String fileName = "Reporte_EEMM_" + System.currentTimeMillis() + ".pdf";
                        if (path.contains("revisiones-servicio")) {
                            fileName = "Reporte_Servicio_" + System.currentTimeMillis() + ".pdf";
                        } else if (path.contains("chequeo")) {
                            fileName = "Chequeo_EEMM_" + System.currentTimeMillis() + ".pdf";
                        } else if (path.contains("entregas")) {
                            fileName = "Reporte_Entregas_" + System.currentTimeMillis() + ".pdf";
                        }

                        dmReq.setDescription("Descargando reporte oficial EEMM...");
                        dmReq.setTitle(fileName);
                        dmReq.setMimeType("application/pdf");
                        dmReq.allowScanningByMediaScanner();
                        dmReq.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                        dmReq.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

                        String cookies = CookieManager.getInstance().getCookie(uri.toString());
                        if (cookies != null) {
                            dmReq.addRequestHeader("Cookie", cookies);
                        }
                        dmReq.addRequestHeader("User-Agent", settings.getUserAgentString());

                        DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                        if (dm != null) {
                            dm.enqueue(dmReq);
                            Toast.makeText(MainActivity.this, "Descargando reporte PDF...", Toast.LENGTH_SHORT).show();
                            return true;
                        }
                    } catch (Exception e) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW);
                            intent.setDataAndType(uri, "application/pdf");
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(intent);
                            return true;
                        } catch (Exception ignored) {
                        }
                    }
                }

                String host = uri.getHost();

                // Open internal domain inside WebView
                if (host != null && (host.contains("eemm.cfelbc.cl") || host.contains("localhost"))) {
                    return false;
                }

                // Handle tel, mailto, whatsapp links externally
                String scheme = uri.getScheme();
                if (scheme != null && (scheme.equals("tel") || scheme.equals("mailto") || scheme.equals("whatsapp"))) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                        startActivity(intent);
                        return true;
                    } catch (Exception ignored) {
                    }
                }

                // External browser for other domains
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }
        });

        // WebChromeClient
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (progressBar.getVisibility() == View.VISIBLE) {
                    progressBar.setProgress(newProgress);
                    if (newProgress >= 100) {
                        progressBar.setVisibility(View.GONE);
                    }
                }
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;

                // Check camera permission if needed
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    permissionsLauncher.launch(new String[]{Manifest.permission.CAMERA});
                } else {
                    launchFileChooserIntent();
                }

                return true;
            }
        });

        // Download Listener for Excel & PDF reports
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                try {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);

                    // Add auth cookies
                    String cookies = CookieManager.getInstance().getCookie(url);
                    if (cookies != null) {
                        request.addRequestHeader("Cookie", cookies);
                    }
                    request.addRequestHeader("User-Agent", userAgent);

                    request.setDescription("Descargando archivo de EEMM...");
                    request.setTitle(fileName);
                    request.allowScanningByMediaScanner();
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

                    DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                        Toast.makeText(MainActivity.this, "Descargando: " + fileName, Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Error al iniciar descarga: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    private void launchFileChooserIntent() {
        Intent takePictureIntent = null;
        cameraCaptureUri = null;

        try {
            File photoFile = createImageFile();
            if (photoFile != null) {
                cameraCaptureUri = FileProvider.getUriForFile(
                        this,
                        getApplicationContext().getPackageName() + ".fileprovider",
                        photoFile
                );
                takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraCaptureUri);
                takePictureIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }
        } catch (Exception e) {
            cameraCaptureUri = null;
        }

        // File/Image picker intent
        Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
        contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
        contentSelectionIntent.setType("image/*");

        Intent[] intentArray = takePictureIntent != null ? new Intent[]{takePictureIntent} : new Intent[0];

        Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
        chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
        chooserIntent.putExtra(Intent.EXTRA_TITLE, "Seleccionar foto o abrir cámara");
        chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray);

        fileChooserLauncher.launch(chooserIntent);
    }

    private File createImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String imageFileName = "JPEG_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        if (storageDir == null) {
            storageDir = getCacheDir();
        }
        return File.createTempFile(imageFileName, ".jpg", storageDir);
    }

    private void setupSwipeRefresh() {
        swipeRefreshLayout.setColorSchemeResources(R.color.primary, R.color.accent);
        swipeRefreshLayout.setOnRefreshListener(() -> {
            if (isNetworkAvailable()) {
                hideErrorScreen();
                webView.reload();
            } else {
                swipeRefreshLayout.setRefreshing(false);
                showErrorScreen();
            }
        });

        // Avoid pull-to-refresh when user is scrolling inside page
        webView.getViewTreeObserver().addOnScrollChangedListener(() -> {
            swipeRefreshLayout.setEnabled(webView.getScrollY() == 0);
        });
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    if (System.currentTimeMillis() - lastBackPressedTime < 2000) {
                        finish();
                    } else {
                        lastBackPressedTime = System.currentTimeMillis();
                        Toast.makeText(MainActivity.this, "Presione atrás nuevamente para salir", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        });
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Network network = cm.getActiveNetwork();
            if (network == null) return false;
            NetworkCapabilities capabilities = cm.getNetworkCapabilities(network);
            return capabilities != null && (
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
            );
        } else {
            android.net.NetworkInfo networkInfo = cm.getActiveNetworkInfo();
            return networkInfo != null && networkInfo.isConnected();
        }
    }

    private void showErrorScreen() {
        swipeRefreshLayout.setVisibility(View.GONE);
        progressBar.setVisibility(View.GONE);
        errorView.setVisibility(View.VISIBLE);
    }

    private void hideErrorScreen() {
        errorView.setVisibility(View.GONE);
        swipeRefreshLayout.setVisibility(View.VISIBLE);
    }

    private WebResourceResponse getAssetResponse(String assetPath, String mimeType) {
        try {
            InputStream is = getAssets().open(assetPath);
            Map<String, String> headers = new HashMap<>();
            headers.put("Access-Control-Allow-Origin", "*");
            headers.put("Cache-Control", "no-cache");
            return new WebResourceResponse(mimeType, "UTF-8", 200, "OK", headers, is);
        } catch (Exception e) {
            return null;
        }
    }

    private String getMimeType(String path) {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".js")) return "application/javascript";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void downloadPdf(String url, String filename) {
            runOnUiThread(() -> {
                try {
                    String downloadUrl = url;
                    if (!downloadUrl.contains("download=")) {
                        downloadUrl += (downloadUrl.contains("?") ? "&" : "?") + "download=true";
                    }
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(downloadUrl));
                    String safeName = (filename != null && filename.endsWith(".pdf")) ? filename : "Reporte_EEMM_" + System.currentTimeMillis() + ".pdf";
                    request.setDescription("Descargando reporte oficial EEMM...");
                    request.setTitle(safeName);
                    request.setMimeType("application/pdf");
                    request.allowScanningByMediaScanner();
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, safeName);

                    String cookies = CookieManager.getInstance().getCookie(downloadUrl);
                    if (cookies != null) {
                        request.addRequestHeader("Cookie", cookies);
                    }
                    request.addRequestHeader("User-Agent", webView.getSettings().getUserAgentString());

                    DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                        Toast.makeText(MainActivity.this, "Descargando: " + safeName, Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Error al iniciar descarga: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void openPdfBase64(String base64Data, String filename) {
            runOnUiThread(() -> {
                try {
                    String cleanBase64 = base64Data;
                    if (cleanBase64.contains(",")) {
                        cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
                    }
                    byte[] pdfBytes = Base64.decode(cleanBase64, Base64.DEFAULT);

                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS);
                    if (dir == null) {
                        dir = getCacheDir();
                    }
                    if (!dir.exists()) {
                        dir.mkdirs();
                    }
                    String safeName = (filename != null && filename.endsWith(".pdf")) ? filename : "Reporte_EEMM_" + System.currentTimeMillis() + ".pdf";
                    File file = new File(dir, safeName);
                    try (FileOutputStream fos = new FileOutputStream(file)) {
                        fos.write(pdfBytes);
                        fos.flush();
                    }

                    Uri fileUri = FileProvider.getUriForFile(
                            MainActivity.this,
                            getApplicationContext().getPackageName() + ".fileprovider",
                            file
                    );

                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setDataAndType(fileUri, "application/pdf");
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                    Intent chooser = Intent.createChooser(intent, "Abrir reporte PDF");
                    chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                    try {
                        java.util.List<android.content.pm.ResolveInfo> resInfoList = getPackageManager().queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
                        for (android.content.pm.ResolveInfo resolveInfo : resInfoList) {
                            String packageName = resolveInfo.activityInfo.packageName;
                            grantUriPermission(packageName, fileUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        }
                    } catch (Exception ignored) {}

                    Toast.makeText(MainActivity.this, "Abriendo reporte PDF...", Toast.LENGTH_SHORT).show();
                    try {
                        startActivity(chooser);
                    } catch (android.content.ActivityNotFoundException anf) {
                        Toast.makeText(MainActivity.this, "No se encontró un visor de PDF (instale Google Drive, Adobe Reader o similar)", Toast.LENGTH_LONG).show();
                    }
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Error al procesar PDF: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface
        public void updateStatusBarTheme(boolean isDark) {
            runOnUiThread(() -> {
                try {
                    Window window = getWindow();
                    int barColor = isDark ? ContextCompat.getColor(MainActivity.this, R.color.app_bg_dark)
                                           : Color.parseColor("#ffffff");
                    window.setStatusBarColor(barColor);
                    window.setNavigationBarColor(barColor);
                    window.setBackgroundDrawable(new ColorDrawable(barColor));

                    View root = findViewById(R.id.rootLayout);
                    if (root != null) {
                        root.setBackgroundColor(barColor);
                    }

                    WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
                    if (insetsController != null) {
                        insetsController.setAppearanceLightStatusBars(!isDark);
                        insetsController.setAppearanceLightNavigationBars(!isDark);
                    }
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }

        @JavascriptInterface
        public String getAppVersionName() {
            try {
                android.content.pm.PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
                return pInfo.versionName != null ? pInfo.versionName : "1.8.0";
            } catch (Exception e) {
                return "1.8.0";
            }
        }

        @JavascriptInterface
        public int getAppVersionCode() {
            try {
                android.content.pm.PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    return (int) pInfo.getLongVersionCode();
                } else {
                    return pInfo.versionCode;
                }
            } catch (Exception e) {
                return 21;
            }
        }

        @JavascriptInterface
        public void startAppUpdate(String downloadUrl) {
            runOnUiThread(() -> {
                Toast.makeText(MainActivity.this, "Iniciando descarga de actualización...", Toast.LENGTH_SHORT).show();
                downloadAndInstallApk(downloadUrl);
            });
        }
    }

    private void installApkFile(File apkFile) {
        if (apkFile == null || !apkFile.exists()) {
            Toast.makeText(this, "El archivo de actualización no se encontró.", Toast.LENGTH_SHORT).show();
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!getPackageManager().canRequestPackageInstalls()) {
                Toast.makeText(this, "Por favor autorice la instalación para actualizar EEMM", Toast.LENGTH_LONG).show();
                pendingInstallApk = apkFile;
                try {
                    Intent settingsIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    settingsIntent.setData(Uri.parse("package:" + getPackageName()));
                    manageUnknownSourcesLauncher.launch(settingsIntent);
                } catch (Exception e) {
                    Intent fallbackIntent = new Intent(Settings.ACTION_SECURITY_SETTINGS);
                    startActivity(fallbackIntent);
                }
                return;
            }
        }

        launchInstallerIntent(apkFile);
    }

    private void launchInstallerIntent(File apkFile) {
        try {
            Uri apkUri = FileProvider.getUriForFile(
                    MainActivity.this,
                    getApplicationContext().getPackageName() + ".fileprovider",
                    apkFile
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

            java.util.List<ResolveInfo> resInfoList = getPackageManager().queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
            for (ResolveInfo resolveInfo : resInfoList) {
                String packageName = resolveInfo.activityInfo.packageName;
                grantUriPermission(packageName, apkUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }

            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(MainActivity.this, "Error al abrir instalador de Android: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void downloadAndInstallApk(String urlString) {
        new Thread(() -> {
            HttpURLConnection connection = null;
            InputStream input = null;
            FileOutputStream output = null;
            try {
                reportDownloadProgress(0, "Iniciando conexión con el servidor...");
                String currentUrl = urlString;
                int redirectCount = 0;

                while (redirectCount < 6) {
                    URL url = new URL(currentUrl);
                    connection = (HttpURLConnection) url.openConnection();
                    connection.setInstanceFollowRedirects(true);
                    connection.setConnectTimeout(15000);
                    connection.setReadTimeout(30000);
                    connection.setRequestProperty("User-Agent", "Mozilla/5.0 EEMM-Android-Updater");

                    int status = connection.getResponseCode();
                    if (status == HttpURLConnection.HTTP_MOVED_TEMP ||
                        status == HttpURLConnection.HTTP_MOVED_PERM ||
                        status == HttpURLConnection.HTTP_SEE_OTHER ||
                        status == 307 || status == 308) {
                        currentUrl = connection.getHeaderField("Location");
                        connection.disconnect();
                        redirectCount++;
                        continue;
                    }
                    if (status != HttpURLConnection.HTTP_OK) {
                        throw new IOException("El servidor respondió con código HTTP " + status);
                    }
                    break;
                }

                int fileLength = connection.getContentLength();
                File downloadDir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (downloadDir == null) {
                    downloadDir = getCacheDir();
                }
                if (!downloadDir.exists()) {
                    downloadDir.mkdirs();
                }

                File apkFile = new File(downloadDir, "eemm_update.apk");
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                input = connection.getInputStream();
                output = new FileOutputStream(apkFile);

                byte[] data = new byte[8192];
                long total = 0;
                int count;
                long lastReportTime = 0;

                while ((count = input.read(data)) != -1) {
                    total += count;
                    output.write(data, 0, count);

                    long now = System.currentTimeMillis();
                    if (now - lastReportTime > 200) {
                        if (fileLength > 0) {
                            int percent = (int) (total * 100 / fileLength);
                            reportDownloadProgress(percent, String.format(Locale.US, "Descargando: %d%% (%.1f / %.1f MB)", percent, total / (1024.0 * 1024.0), fileLength / (1024.0 * 1024.0)));
                        } else {
                            reportDownloadProgress(50, String.format(Locale.US, "Descargando: %.1f MB", total / (1024.0 * 1024.0)));
                        }
                        lastReportTime = now;
                    }
                }

                output.flush();
                try {
                    output.close();
                    output = null;
                } catch (Exception ignored) {}
                try {
                    if (input != null) {
                        input.close();
                        input = null;
                    }
                } catch (Exception ignored) {}

                try {
                    apkFile.setReadable(true, false);
                } catch (Exception ignored) {}

                reportDownloadProgress(100, "Descarga completada. Abriendo instalador...");

                runOnUiThread(() -> {
                    Toast.makeText(MainActivity.this, "Descarga completada. Abriendo instalador...", Toast.LENGTH_SHORT).show();
                    installApkFile(apkFile);
                });

            } catch (Exception e) {
                reportDownloadError(e.getMessage());
            } finally {
                try {
                    if (output != null) output.close();
                    if (input != null) input.close();
                } catch (Exception ignored) {}
                if (connection != null) connection.disconnect();
            }
        }).start();
    }

    private void reportDownloadProgress(int percent, String message) {
        runOnUiThread(() -> {
            if (webView != null) {
                String safeMsg = JSONObject.quote(message != null ? message : "");
                String script = "if (window.app && window.app.onUpdateDownloadProgress) { window.app.onUpdateDownloadProgress(" + percent + ", " + safeMsg + "); }";
                webView.evaluateJavascript(script, null);
            }
        });
    }

    private void reportDownloadError(String errorMsg) {
        runOnUiThread(() -> {
            Toast.makeText(MainActivity.this, "Error de actualización: " + errorMsg, Toast.LENGTH_LONG).show();
            if (webView != null) {
                String safeMsg = JSONObject.quote(errorMsg != null ? errorMsg : "Error desconocido");
                String script = "if (window.app && window.app.onUpdateDownloadError) { window.app.onUpdateDownloadError(" + safeMsg + "); }";
                webView.evaluateJavascript(script, null);
            }
        });
    }
}
