package online.streamfree.app;

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
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.webkit.CookieManager;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileInputStream;
import java.security.MessageDigest;

public class MainActivity extends BridgeActivity {
    private static final long EXPECTED_UPDATE_SIZE = 3269079L;
    private static final String EXPECTED_UPDATE_SHA256 = "5206A135601AA218A13DA13870011E40F09203CA9BAB542C946E1F59DD2FA836";
    private static final String EXPECTED_UPDATE_PACKAGE = "online.streamfree.app";
    private static final String EXPECTED_UPDATE_CERTIFICATE = "577D4F3C9BBE0A87C3F2CDFC087BD1A6D26EF1A613F392091DF0A26F10677DB9";
    private long updateDownloadId = -1L;
    private BroadcastReceiver updateReceiver;
    private File expectedUpdateFile;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(StreamFreeNativePlugin.class);
        super.onCreate(savedInstanceState);

        WebView webView = bridge.getWebView();
        WebSettings settings = webView.getSettings();
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
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }

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
            Uri source = Uri.parse("https://streamfree.online/downloads/StreamFree-Android-v1.3.apk");
            if (!"https".equalsIgnoreCase(source.getScheme()) ||
                !"streamfree.online".equalsIgnoreCase(source.getHost()) ||
                !source.getPath().startsWith("/downloads/")) throw new IllegalArgumentException("Invalid update source");
            expectedUpdateFile = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "streamfree-update.apk");
            if (expectedUpdateFile.exists()) expectedUpdateFile.delete();
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
            if (expectedUpdateFile == null || !verifyOfficialApk(expectedUpdateFile)) {
                if (expectedUpdateFile != null) expectedUpdateFile.delete();
                Toast.makeText(this, "Update verification failed", Toast.LENGTH_LONG).show();
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
            Toast.makeText(this, "Could not open the update installer", Toast.LENGTH_LONG).show();
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

}
