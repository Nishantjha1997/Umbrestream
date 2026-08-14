package com.umbrestream.app;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ActivityInfo;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import java.io.File;

public class MainActivity extends BridgeActivity {
    private long updateDownloadId = -1L;
    private BroadcastReceiver updateReceiver;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = bridge.getWebView();
        webView.addJavascriptInterface(new StreamFreeNativeBridge(this), "StreamFreeNative");

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
                .setTitle("StreamFree update")
                .setDescription("Downloading the latest StreamFree app")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setMimeType("application/vnd.android.package-archive")
                .setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, "streamfree-update.apk");
            updateDownloadId = ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(request);
            Toast.makeText(this, "Downloading StreamFree update…", Toast.LENGTH_SHORT).show();
        } catch (Exception error) {
            Toast.makeText(this, "Could not download the update", Toast.LENGTH_LONG).show();
        }
    }

    private void installDownloadedApk(long id) {
        DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        DownloadManager.Query query = new DownloadManager.Query().setFilterById(id);
        try (Cursor cursor = manager.query(query)) {
            if (cursor == null || !cursor.moveToFirst()) return;
            int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            if (status != DownloadManager.STATUS_SUCCESSFUL) {
                Toast.makeText(this, "Update download failed", Toast.LENGTH_LONG).show();
                return;
            }
            String localUri = cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI));
            Uri packageUri = Uri.parse(localUri);
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
            Toast.makeText(this, "Could not open the update installer", Toast.LENGTH_LONG).show();
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
            activity.runOnUiThread(() -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));
        }

        @JavascriptInterface
        public void installApk(String url) {
            activity.runOnUiThread(() -> activity.downloadApk(url));
        }
    }
}
