package com.umbrestream.tv;

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
import android.database.Cursor;
import android.provider.Settings;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.File;
import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends BridgeActivity {
    private long updateDownloadId = -1L;
    private BroadcastReceiver updateReceiver;

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
        super.onCreate(savedInstanceState);

        WebView webView = bridge.getWebView();
        webView.addJavascriptInterface(new StreamFreeNativeBridge(this), "StreamFreeNative");
        WebSettings settings = webView.getSettings();
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(false);

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

    private void downloadApk(String url) {
        try {
            Uri source = Uri.parse(url);
            if (!"https".equalsIgnoreCase(source.getScheme()) && !"http".equalsIgnoreCase(source.getScheme())) {
                throw new IllegalArgumentException("Update URL must use HTTPS");
            }
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
            Uri packageUri = Uri.parse(cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI)));
            if ("file".equalsIgnoreCase(packageUri.getScheme())) {
                packageUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", new File(packageUri.getPath()));
            }
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

    private static final class StreamFreeNativeBridge {
        private final MainActivity activity;

        StreamFreeNativeBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void lockLandscape() {
            activity.runOnUiThread(() -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
        }

        @JavascriptInterface
        public void lockPortrait() {
            activity.runOnUiThread(() -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
        }

        @JavascriptInterface
        public void installApk(String url) {
            activity.runOnUiThread(() -> activity.downloadApk(url));
        }
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
