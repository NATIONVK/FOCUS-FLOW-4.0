package com.nationvk.focusflow;

import android.Manifest;
import android.content.ContentUris;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@CapacitorPlugin(
  name = "Gallery",
  permissions = {
    @Permission(alias = "images14", strings = { Manifest.permission.READ_MEDIA_IMAGES, "android.permission.READ_MEDIA_VISUAL_USER_SELECTED" }),
    @Permission(alias = "images", strings = { Manifest.permission.READ_MEDIA_IMAGES }),
    @Permission(alias = "selectedImages", strings = { "android.permission.READ_MEDIA_VISUAL_USER_SELECTED" }),
    @Permission(alias = "legacyImages", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
  }
)
public class GalleryPlugin extends Plugin {
  private String permissionAlias() {
    if (Build.VERSION.SDK_INT >= 34) return "images14";
    if (Build.VERSION.SDK_INT >= 33) return "images";
    return "legacyImages";
  }
  private boolean hasImageAccess() {
    return getPermissionState(permissionAlias()) == com.getcapacitor.PermissionState.GRANTED || (Build.VERSION.SDK_INT >= 34 && getPermissionState("selectedImages") == com.getcapacitor.PermissionState.GRANTED);
  }

  @PluginMethod
  public void listRecentImages(PluginCall call) {
    if (!hasImageAccess()) {
      // Android 14+ supports limited photo access. Request this first so users can
      // select only the photos they want to expose to the app.
      requestPermissionForAlias(Build.VERSION.SDK_INT >= 34 ? "selectedImages" : permissionAlias(), call, "galleryPermissionCallback");
      return;
    }
    queryImages(call);
  }

  @PluginMethod
  public void requestGalleryAccess(PluginCall call) {
    requestPermissionForAlias("images", call, "galleryPermissionCallback");
  }

  @PluginMethod
  public void galleryPermissionCallback(PluginCall call) {
    if (hasImageAccess()) queryImages(call);
    else call.reject("Photo library permission was not granted", "PERMISSION_DENIED");
  }

  private void queryImages(PluginCall call) {
    int limit = Math.max(1, Math.min(call.getInt("limit", 60), 150));
    int offset = Math.max(0, call.getInt("offset", 0));
    JSArray items = new JSArray();
    String[] projection = {
      MediaStore.Images.Media._ID,
      MediaStore.Images.Media.DISPLAY_NAME,
      MediaStore.Images.Media.DATE_ADDED,
      MediaStore.Images.Media.SIZE
    };
    String order = MediaStore.Images.Media.DATE_ADDED + " DESC";
    try (Cursor cursor = getContext().getContentResolver().query(
      MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
      projection, null, null, order
    )) {
      if (cursor != null) {
        int idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID);
        int nameCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME);
        int dateCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED);
        int sizeCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.SIZE);
        int skipped = 0, added = 0;
        while (cursor.moveToNext() && added < limit) {
          if (skipped++ < offset) continue;
          long id = cursor.getLong(idCol);
          Uri uri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id);
          JSObject item = new JSObject();
          item.put("id", String.valueOf(id));
          item.put("name", cursor.getString(nameCol));
          item.put("date", cursor.getLong(dateCol) * 1000L);
          item.put("size", cursor.getLong(sizeCol));
          item.put("thumbnail", thumbnail(uri));
          items.put(item);
          added++;
        }
      }
      JSObject result = new JSObject();
      result.put("items", items);
      result.put("offset", offset);
      result.put("nextOffset", offset + items.length());
      result.put("hasMore", items.length() == limit);
      call.resolve(result);
    } catch (Exception e) {
      call.reject("Unable to read device gallery: " + e.getMessage(), e);
    }
  }

  private String thumbnail(Uri uri) {
    try {
      Bitmap bitmap;
      if (Build.VERSION.SDK_INT >= 29) {
        bitmap = getContext().getContentResolver().loadThumbnail(uri, new android.util.Size(240, 240), null);
      } else {
        try (InputStream in = getContext().getContentResolver().openInputStream(uri)) {
          BitmapFactory.Options bounds = new BitmapFactory.Options();
          bounds.inJustDecodeBounds = true;
          BitmapFactory.decodeStream(in, null, bounds);
          int sample = Math.max(1, Math.min(bounds.outWidth, bounds.outHeight) / 240);
          BitmapFactory.Options opts = new BitmapFactory.Options();
          opts.inSampleSize = sample;
          try (InputStream in2 = getContext().getContentResolver().openInputStream(uri)) {
            bitmap = BitmapFactory.decodeStream(in2, null, opts);
          }
        }
      }
      if (bitmap == null) return "";
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      bitmap.compress(Bitmap.CompressFormat.JPEG, 68, out);
      bitmap.recycle();
      return "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    } catch (Exception e) { return ""; }
  }

  @PluginMethod
  public void readImage(PluginCall call) {
    if (!hasImageAccess()) {
      call.reject("Photo library permission is required", "PERMISSION_DENIED");
      return;
    }
    String id = call.getString("id");
    if (id == null) { call.reject("Image id is required"); return; }
    try {
      Uri uri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, Long.parseLong(id));
      try (InputStream in = getContext().getContentResolver().openInputStream(uri);
           ByteArrayOutputStream out = new ByteArrayOutputStream()) {
        if (in == null) { call.reject("Image file is unavailable"); return; }
        byte[] buffer = new byte[16384]; int count;
        while ((count = in.read(buffer)) != -1) out.write(buffer, 0, count);
        String mime = getContext().getContentResolver().getType(uri);
        JSObject result = new JSObject();
        result.put("dataUrl", "data:" + (mime == null ? "image/jpeg" : mime) + ";base64," +
          Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP));
        call.resolve(result);
      }
    } catch (Exception e) { call.reject("Unable to open image: " + e.getMessage(), e); }
  }
}