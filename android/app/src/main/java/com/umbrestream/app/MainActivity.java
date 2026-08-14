package online.streamfree.app;

import android.app.DownloadManager;
import android.app.AlertDialog;
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
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.webkit.CookieManager;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;

import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private static final String UPDATE_MANIFEST_URL = "https://streamfree.online/downloads/streamfree-android.json";
    private static final String EXPECTED_UPDATE_PACKAGE = "online.streamfree.app";
    private static final String EXPECTED_UPDATE_CERTIFICATE = "577D4F3C9BBE0A87C3F2CDFC087BD1A6D26EF1A613F392091DF0A26F10677DB9";
    private long updateDownloadId = -1L;
    private BroadcastReceiver updateReceiver;
    private File expectedUpdateFile;
    private UpdateMetadata pendingUpdate;

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
        if (isLegacyPackage()) {
            new AlertDialog.Builder(this)
                .setTitle("Move to the new StreamFree app")
                .setMessage("Sign in first so your library and watch history can sync. Then continue to install the new app alongside this one.")
                .setNegativeButton("Later", null)
                .setPositiveButton("I signed in — continue", (dialog, which) -> checkAndQueueUpdate())
                .show();
            return;
        }
        checkAndQueueUpdate();
    }

    private void checkAndQueueUpdate() {
        new Thread(() -> {
            try {
                UpdateMetadata update = fetchOfficialUpdateManifest();
                if (update == null) {
                    showUpdateToast("You are on the latest StreamFree version");
                    return;
                }
                pendingUpdate = update;
                new Handler(Looper.getMainLooper()).post(() -> enqueueOfficialUpdate(update));
            } catch (Exception error) {
                showUpdateToast("Could not check for a StreamFree update");
            }
        }, "streamfree-update-check").start();
    }
    /*
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
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (FileInputStream input = new FileInputStream(apk)) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = input.read(buffer)) >= 0) if (count > 0) digest.update(buffer, 0, count);
            }
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

    */

    private void enqueueOfficialUpdate(UpdateMetadata update) {
        try {
            Uri source = Uri.parse(update.apkUrl);
            if (!isOfficialDownloadUrl(source)) throw new IllegalArgumentException("Invalid update source");
            expectedUpdateFile = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "streamfree-update.apk");
            if (expectedUpdateFile.exists()) expectedUpdateFile.delete();
            DownloadManager.Request request = new DownloadManager.Request(source)
                .setTitle("StreamFree update")
                .setDescription("Downloading the latest StreamFree app")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setMimeType("application/vnd.android.package-archive")
                .setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, "streamfree-update.apk");
            updateDownloadId = ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(request);
            Toast.makeText(this, "Downloading StreamFree update", Toast.LENGTH_SHORT).show();
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
            if (expectedUpdateFile == null || pendingUpdate == null || !verifyOfficialApk(expectedUpdateFile, pendingUpdate)) {
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

    private UpdateMetadata fetchOfficialUpdateManifest() throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(UPDATE_MANIFEST_URL).openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(15000);
        connection.setInstanceFollowRedirects(false);
        try {
            if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) throw new IllegalStateException("Manifest unavailable");
            try (InputStream input = connection.getInputStream(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192];
                int count;
                int total = 0;
                while ((count = input.read(buffer)) != -1) {
                    total += count;
                    if (total > 256 * 1024) throw new IllegalStateException("Manifest too large");
                    output.write(buffer, 0, count);
                }
                JSONObject json = new JSONObject(output.toString("UTF-8"));
                if (json.optInt("schemaVersion", -1) != 1) throw new IllegalStateException("Unsupported manifest");
                String packageId = json.optString("packageId", "");
                long versionCode = json.optLong("versionCode", -1L);
                String versionName = json.optString("versionName", "");
                String apkUrl = json.optString("apkUrl", "");
                String sha256 = json.optString("sha256", "").toUpperCase(java.util.Locale.US);
                long sizeBytes = json.optLong("sizeBytes", -1L);
                String certificate = json.optString("signingCertificateSha256", "").toUpperCase(java.util.Locale.US);
                Uri apkUri = apkUrl.startsWith("/")
                    ? Uri.parse("https://streamfree.online" + apkUrl)
                    : Uri.parse(apkUrl);
                if (!EXPECTED_UPDATE_PACKAGE.equals(packageId) || versionName.trim().isEmpty() ||
                    !sha256.matches("[A-F0-9]{64}") || sizeBytes <= 0 ||
                    !EXPECTED_UPDATE_CERTIFICATE.equals(certificate) || !isOfficialDownloadUrl(apkUri)) {
                    throw new IllegalStateException("Manifest validation failed");
                }
                long currentVersionCode = currentVersionCode();
                if ((!isLegacyPackage() && versionCode <= currentVersionCode) ||
                    (isLegacyPackage() && versionCode < currentVersionCode)) return null;
                return new UpdateMetadata(packageId, versionCode, apkUri.toString(), sha256, sizeBytes, certificate);
            }
        } finally {
            connection.disconnect();
        }
    }

    private static boolean isOfficialDownloadUrl(Uri source) {
        return source != null && "https".equalsIgnoreCase(source.getScheme()) &&
            "streamfree.online".equalsIgnoreCase(source.getHost()) && source.getUserInfo() == null &&
            source.getQuery() == null && source.getFragment() == null &&
            source.getPath() != null && source.getPath().startsWith("/downloads/") &&
            source.getPath().toLowerCase(java.util.Locale.US).endsWith(".apk");
    }

    private boolean verifyOfficialApk(File apk, UpdateMetadata update) {
        try {
            if (update == null || !apk.isFile() || apk.length() != update.sizeBytes ||
                !EXPECTED_UPDATE_PACKAGE.equals(update.packageId) ||
                !EXPECTED_UPDATE_CERTIFICATE.equals(update.certificate)) return false;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (FileInputStream input = new FileInputStream(apk)) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = input.read(buffer)) >= 0) if (count > 0) digest.update(buffer, 0, count);
            }
            if (!update.sha256.equalsIgnoreCase(toHex(digest.digest()))) return false;
            int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                ? PackageManager.GET_SIGNING_CERTIFICATES
                : PackageManager.GET_SIGNATURES;
            PackageInfo info = getPackageManager().getPackageArchiveInfo(apk.getAbsolutePath(), flags);
            if (info == null || !update.packageId.equals(info.packageName)) return false;
            long versionCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? info.getLongVersionCode() : info.versionCode;
            long currentVersionCode = currentVersionCode();
            if (versionCode != update.versionCode ||
                (!isLegacyPackage() && versionCode <= currentVersionCode) ||
                (isLegacyPackage() && versionCode < currentVersionCode)) return false;
            Signature[] signatures = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                ? info.signingInfo.getApkContentsSigners()
                : info.signatures;
            if (signatures == null || signatures.length == 0) return false;
            return update.certificate.equalsIgnoreCase(
                toHex(MessageDigest.getInstance("SHA-256").digest(signatures[0].toByteArray()))
            );
        } catch (Exception error) {
            return false;
        }
    }

    private void showUpdateToast(String message) {
        new Handler(Looper.getMainLooper()).post(() -> Toast.makeText(this, message, Toast.LENGTH_LONG).show());
    }

    private boolean isLegacyPackage() {
        return !EXPECTED_UPDATE_PACKAGE.equals(getPackageName());
    }

    private long currentVersionCode() throws PackageManager.NameNotFoundException {
        PackageInfo current = getPackageManager().getPackageInfo(getPackageName(), 0);
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? current.getLongVersionCode() : current.versionCode;
    }

    private static final class UpdateMetadata {
        final String packageId;
        final long versionCode;
        final String apkUrl;
        final String sha256;
        final long sizeBytes;
        final String certificate;

        UpdateMetadata(String packageId, long versionCode, String apkUrl, String sha256, long sizeBytes, String certificate) {
            this.packageId = packageId;
            this.versionCode = versionCode;
            this.apkUrl = apkUrl;
            this.sha256 = sha256;
            this.sizeBytes = sizeBytes;
            this.certificate = certificate;
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) result.append(String.format("%02X", value));
        return result.toString();
    }

}
