package io.ionic.starter;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {

    @PluginMethod
    public void startDownload(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("Update URL is required.");
            return;
        }

        try {
            DownloadManager downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle("Staff Locator Update");
            request.setDescription("Downloading update");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(false);
            request.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, "StaffLocator-update.apk");
            request.setMimeType("application/vnd.android.package-archive");

            long downloadId = downloadManager.enqueue(request);

            JSObject result = new JSObject();
            result.put("downloadId", downloadId);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Unable to start update download.", error);
        }
    }

    @PluginMethod
    public void getDownloadProgress(PluginCall call) {
        Integer rawDownloadId = call.getInt("downloadId");
        if (rawDownloadId == null) {
            call.reject("downloadId is required.");
            return;
        }

        long downloadId = rawDownloadId.longValue();
        DownloadManager downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
        Cursor cursor = downloadManager.query(query);

        if (cursor == null || !cursor.moveToFirst()) {
            if (cursor != null) {
                cursor.close();
            }
            call.reject("Download could not be found.");
            return;
        }

        try {
            int statusIndex = cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS);
            int bytesIndex = cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
            int totalIndex = cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);

            int status = cursor.getInt(statusIndex);
            long bytesDownloaded = cursor.getLong(bytesIndex);
            long totalBytes = cursor.getLong(totalIndex);

            int progress = 0;
            if (totalBytes > 0) {
                progress = (int) ((bytesDownloaded * 100L) / totalBytes);
            }

            JSObject result = new JSObject();
            result.put("progress", Math.max(0, Math.min(100, progress)));
            result.put("status", getStatusLabel(status));
            result.put("isComplete", status == DownloadManager.STATUS_SUCCESSFUL);
            result.put("isFailed", status == DownloadManager.STATUS_FAILED);
            call.resolve(result);
        } finally {
            cursor.close();
        }
    }

    @PluginMethod
    public void installDownloadedApk(PluginCall call) {
        Integer rawDownloadId = call.getInt("downloadId");
        if (rawDownloadId == null) {
            call.reject("downloadId is required.");
            return;
        }

        long downloadId = rawDownloadId.longValue();
        DownloadManager downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);

        DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
        Cursor cursor = downloadManager.query(query);

        if (cursor == null || !cursor.moveToFirst()) {
            if (cursor != null) {
                cursor.close();
            }
            call.reject("Downloaded APK could not be found.");
            return;
        }

        try {
            String localUri = cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI));
            if (localUri == null || localUri.isEmpty()) {
                call.reject("Downloaded APK path is unavailable.");
                return;
            }

            File apkFile = new File(Uri.parse(localUri).getPath());
            if (!apkFile.exists()) {
                call.reject("Downloaded APK file was not found on disk.");
                return;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getContext().getPackageManager().canRequestPackageInstalls()) {
                Intent settingsIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
                settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(settingsIntent);
                call.reject("Package installation permission is not available. Please allow installation from this app in Settings.");
                return;
            }

            Uri contentUri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apkFile);
            Intent installIntent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
            installIntent.setData(contentUri);
            installIntent.setType("application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            installIntent.putExtra(Intent.EXTRA_RETURN_RESULT, true);

            getContext().startActivity(installIntent);
            call.resolve();
        } catch (Exception error) {
            call.reject("Unable to install the downloaded update.", error);
        } finally {
            cursor.close();
        }
    }

    private String getStatusLabel(int status) {
        switch (status) {
            case DownloadManager.STATUS_PENDING:
                return "pending";
            case DownloadManager.STATUS_RUNNING:
                return "running";
            case DownloadManager.STATUS_PAUSED:
                return "paused";
            case DownloadManager.STATUS_SUCCESSFUL:
                return "successful";
            case DownloadManager.STATUS_FAILED:
                return "failed";
            default:
                return "unknown";
        }
    }
}
