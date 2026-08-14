package online.streamfree.tv;

import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Environment;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.database.Cursor;
import android.provider.Settings;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.CookieManager;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.File;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends BridgeActivity {
    private static final long EXPECTED_UPDATE_SIZE = 3299335L;
    private static final String EXPECTED_UPDATE_SHA256 = "8519AF2CBDBE855E4048CC06A4FA856F2EB6FC807606C26FEFD495A3A26C4B34";
    private static final String EXPECTED_UPDATE_PACKAGE = "online.streamfree.tv";
    private static final String EXPECTED_UPDATE_CERTIFICATE = "3899CD4ABFB7DC439680CE0BE05BEB455B32CA2A4B012D15FCEFF1E0D4D2CE2B";
    private long updateDownloadId = -1L;
    private BroadcastReceiver updateReceiver;
    private File expectedUpdateFile;

    private static final Set<String> BLOCKED_HOSTS = new HashSet<>(Arrays.asList(
        "2mdn.net",
        "adform.net",
        "adnxs.com",
        "adsrvr.org",
        "adsterra.com",
        "advertising.com",
        "amazon-adsystem.com",
        "clickadu.com",
        "criteo.com",
        "criteo.net",
        "doubleclick.net",
        "exoclick.com",
        "exosrv.com",
        "googleadservices.com",
        "googlesyndication.com",
        "hilltopads.net",
        "juicyads.com",
        "mgid.com",
        "onclicka.com",
        "outbrain.com",
        "popads.net",
        "popcash.net",
        "propellerads.com",
        "pubmatic.com",
        "revcontent.com",
        "rubiconproject.com",
        "scorecardresearch.com",
        "taboola.com",
        "trafficjunky.net",
        "tsyndicate.com"
    ));

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(StreamFreeNativePlugin.class);
        super.onCreate(savedInstanceState);

        WebView webView = bridge.getWebView();
        WebSettings settings = webView.getSettings();
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) settings.setSafeBrowsingEnabled(true);
        WebView.setWebContentsDebuggingEnabled(false);
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }

        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocus();
        bridge.setWebViewClient(new TvWebViewClient(bridge));

        updateReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) {
                    long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
                    if (id == updateDownloadId) installDownloadedApk(id);
                }
            }
        };
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(updateReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(updateReceiver, filter);
        }
    }

    @Override
    public void onDestroy() {
        if (updateReceiver != null) unregisterReceiver(updateReceiver);
        super.onDestroy();
    }

    void downloadOfficialUpdate() {
        try {
            Uri source = Uri.parse("https://streamfree.online/downloads/StreamFree-TV-v1.2.apk");
            if (!"https".equalsIgnoreCase(source.getScheme()) ||
                !"streamfree.online".equalsIgnoreCase(source.getHost()) ||
                !source.getPath().startsWith("/downloads/")) throw new IllegalArgumentException("Invalid update source");
            expectedUpdateFile = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "streamfree-update.apk");
            if (expectedUpdateFile.exists()) expectedUpdateFile.delete();
            DownloadManager.Request request = new DownloadManager.Request(source)
                .setTitle("StreamFree TV update")
                .setDescription("Downloading the latest StreamFree TV app")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setMimeType("application/vnd.android.package-archive")
                .setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, "streamfree-tv-update.apk");
            updateDownloadId = ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(request);
            Toast.makeText(this, "Downloading StreamFree TV update…", Toast.LENGTH_SHORT).show();
        } catch (Exception error) {
            Toast.makeText(this, "Could not download the TV update", Toast.LENGTH_LONG).show();
        }
    }

    private void installDownloadedApk(long id) {
        DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        DownloadManager.Query query = new DownloadManager.Query().setFilterById(id);
        try (Cursor cursor = manager.query(query)) {
            if (cursor == null || !cursor.moveToFirst()) return;
            int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            if (status != DownloadManager.STATUS_SUCCESSFUL) {
                Toast.makeText(this, "TV update download failed", Toast.LENGTH_LONG).show();
                return;
            }
            if (expectedUpdateFile == null || !verifyOfficialApk(expectedUpdateFile)) {
                if (expectedUpdateFile != null) expectedUpdateFile.delete();
                Toast.makeText(this, "TV update verification failed", Toast.LENGTH_LONG).show();
                return;
            }
            Uri packageUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", expectedUpdateFile);
            Intent install = new Intent(Intent.ACTION_VIEW)
                .setDataAndType(packageUri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                startActivity(install);
            } catch (SecurityException error) {
                Intent settings = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName()));
                startActivity(settings);
                Toast.makeText(this, "Allow installs, then tap Check for update again", Toast.LENGTH_LONG).show();
            }
        } catch (Exception error) {
            Toast.makeText(this, "Could not open the TV update installer", Toast.LENGTH_LONG).show();
        }
    }

    private boolean verifyOfficialApk(File apk) {
        try {
            if (!apk.isFile() || apk.length() != EXPECTED_UPDATE_SIZE) return false;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (FileInputStream input = new FileInputStream(apk)) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = input.read(buffer)) >= 0) if (count > 0) digest.update(buffer, 0, count);
            }
            if (!EXPECTED_UPDATE_SHA256.equalsIgnoreCase(toHex(digest.digest()))) return false;
            int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                ? PackageManager.GET_SIGNING_CERTIFICATES
                : PackageManager.GET_SIGNATURES;
            PackageInfo info = getPackageManager().getPackageArchiveInfo(apk.getAbsolutePath(), flags);
            if (info == null || !EXPECTED_UPDATE_PACKAGE.equals(info.packageName)) return false;
            Signature[] signatures = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                ? info.signingInfo.getApkContentsSigners()
                : info.signatures;
            if (signatures == null || signatures.length == 0) return false;
            return EXPECTED_UPDATE_CERTIFICATE.equalsIgnoreCase(
                toHex(MessageDigest.getInstance("SHA-256").digest(signatures[0].toByteArray()))
            );
        } catch (Exception error) {
            return false;
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) result.append(String.format("%02X", value));
        return result.toString();
    }

    private static boolean shouldBlock(Uri uri) {
        String host = uri == null ? null : uri.getHost();
        if (host == null || host.trim().isEmpty()) return false;
        String normalized = host.toLowerCase(Locale.US);
        for (String blocked : BLOCKED_HOSTS) {
            if (normalized.equals(blocked) || normalized.endsWith("." + blocked)) return true;
        }
        return false;
    }

    private static WebResourceResponse blockedResponse() {
        return new WebResourceResponse(
            "text/plain",
            "utf-8",
            204,
            "No Content",
            Collections.emptyMap(),
            new ByteArrayInputStream(new byte[0])
        );
    }

    private static final class TvWebViewClient extends BridgeWebViewClient {
        TvWebViewClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (shouldBlock(request.getUrl())) return blockedResponse();
            return super.shouldInterceptRequest(view, request);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (shouldBlock(request.getUrl())) return true;
            return super.shouldOverrideUrlLoading(view, request);
        }
    }
}
