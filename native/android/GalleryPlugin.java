package com.nationvk.focusflow;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.provider.OpenableColumns;
import android.util.Size;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
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
import java.io.OutputStream;

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

  // System document picker: allows selecting multiple photos in one operation.
  @PluginMethod public void pickImages(PluginCall call) {
    Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT); i.addCategory(Intent.CATEGORY_OPENABLE);
    i.setType("image/*"); i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true);
    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
    startActivityForResult(call,i,"imagesPicked");
  }
  @ActivityCallback private void imagesPicked(PluginCall call, ActivityResult result) {
    if(call==null)return;
    if(result.getResultCode()!=Activity.RESULT_OK||result.getData()==null){call.reject("Photo selection cancelled","CANCELLED");return;}
    try {
      Intent d=result.getData(); JSArray items=new JSArray();
      if(d.getClipData()!=null){if(d.getClipData().getItemCount()>20)throw new Exception("Select up to 20 photos at a time to protect device memory");for(int n=0;n<d.getClipData().getItemCount();n++)items.put(imageItem(d.getClipData().getItemAt(n).getUri()));}
      else if(d.getData()!=null)items.put(imageItem(d.getData()));
      if(items.length()==0)throw new Exception("No photos selected");
      JSObject out=new JSObject();out.put("items",items);call.resolve(out);
    }catch(Exception e){call.reject("Could not read selected photos: "+e.getMessage(),e);}
  }
  private JSObject imageItem(Uri uri)throws Exception {
    Bitmap b=null;
    try {
      if(Build.VERSION.SDK_INT>=29)b=getContext().getContentResolver().loadThumbnail(uri,new Size(2000,2000),null);
      else {BitmapFactory.Options o=new BitmapFactory.Options();o.inJustDecodeBounds=true;try(InputStream in=getContext().getContentResolver().openInputStream(uri)){BitmapFactory.decodeStream(in,null,o);}int sample=1;while(Math.max(o.outWidth/sample,o.outHeight/sample)>2000)sample*=2;o.inJustDecodeBounds=false;o.inSampleSize=sample;try(InputStream in=getContext().getContentResolver().openInputStream(uri)){b=BitmapFactory.decodeStream(in,null,o);}}
      if(b==null)throw new Exception("Image decode failed");
      ByteArrayOutputStream out=new ByteArrayOutputStream();b.compress(Bitmap.CompressFormat.JPEG,88,out);
      JSObject item=new JSObject();item.put("name",displayName(uri));item.put("dataUrl","data:image/jpeg;base64,"+Base64.encodeToString(out.toByteArray(),Base64.NO_WRAP));return item;
    }finally{if(b!=null)b.recycle();}
  }
  @PluginMethod public void pickPdf(PluginCall call) {
    Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("application/pdf");
    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);startActivityForResult(call,i,"pdfPicked");
  }
  @ActivityCallback private void pdfPicked(PluginCall call,ActivityResult result) {
    if(call==null)return;
    if(result.getResultCode()!=Activity.RESULT_OK||result.getData()==null||result.getData().getData()==null){call.reject("PDF selection cancelled","CANCELLED");return;}
    Uri uri=result.getData().getData();
    try(InputStream in=getContext().getContentResolver().openInputStream(uri);ByteArrayOutputStream out=new ByteArrayOutputStream()){
      if(in==null)throw new Exception("Unable to read selected PDF");byte[] buf=new byte[16384];int n;long total=0;
      while((n=in.read(buf))!=-1){total+=n;if(total>25L*1024*1024)throw new Exception("PDF exceeds 25 MB in-app limit");out.write(buf,0,n);}
      JSObject response=new JSObject();response.put("name",displayName(uri));response.put("dataUrl","data:application/pdf;base64,"+Base64.encodeToString(out.toByteArray(),Base64.NO_WRAP));call.resolve(response);
    }catch(Exception e){call.reject("Could not open PDF: "+e.getMessage(),e);}
  }
  @PluginMethod public void savePdf(PluginCall call) {
    Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("application/pdf");
    String name=call.getString("name","Focus-Flow-document.pdf");i.putExtra(Intent.EXTRA_TITLE,name.toLowerCase().endsWith(".pdf")?name:name+".pdf");
    i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_GRANT_READ_URI_PERMISSION);startActivityForResult(call,i,"pdfSaveChosen");
  }
  @ActivityCallback private void pdfSaveChosen(PluginCall call,ActivityResult result) {
    if(call==null)return;
    if(result.getResultCode()!=Activity.RESULT_OK||result.getData()==null||result.getData().getData()==null){call.reject("Save cancelled","CANCELLED");return;}
    try {
      String data=call.getString("base64");if(data==null||data.isEmpty())throw new Exception("PDF data missing");
      byte[] bytes=Base64.decode(data,Base64.DEFAULT);Uri uri=result.getData().getData();
      try(OutputStream out=getContext().getContentResolver().openOutputStream(uri,"w")){if(out==null)throw new Exception("Cannot create destination");out.write(bytes);out.flush();}
      JSObject response=new JSObject();response.put("uri",uri.toString());response.put("bytesWritten",bytes.length);call.resolve(response);
    }catch(Exception e){call.reject("Could not save PDF: "+e.getMessage(),e);}
  }
  private String displayName(Uri uri) {
    try(Cursor c=getContext().getContentResolver().query(uri,null,null,null,null)){if(c!=null&&c.moveToFirst()){int k=c.getColumnIndex(OpenableColumns.DISPLAY_NAME);if(k>=0)return c.getString(k);}}catch(Exception ignored){}
    return "document.pdf";
  }

}
