package com.nationvk.focusflow;
import android.Manifest;
import android.content.Intent;
import android.os.Build;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
@CapacitorPlugin(name="FocusTimer", permissions={@Permission(alias="notifications", strings={Manifest.permission.POST_NOTIFICATIONS})})
public class FocusTimerPlugin extends Plugin {
 @PluginMethod public void requestNotificationPermission(PluginCall call) {
  if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) { JSObject r=new JSObject(); r.put("granted",true); call.resolve(r); return; }
  requestPermissionForAlias("notifications",call,"notificationCallback");
 }
 @PermissionCallback private void notificationCallback(PluginCall call) { JSObject r=new JSObject(); r.put("granted",Build.VERSION.SDK_INT<33 || getPermissionState("notifications")==PermissionState.GRANTED); call.resolve(r); }
 @PluginMethod public void startTimer(PluginCall call) {
  try {
   Intent i=new Intent(getContext(),FocusTimerService.class).setAction(FocusTimerService.START);
   String subject=call.getString("subject","Focus session");if(subject==null)subject="Focus session";i.putExtra("subject",subject.substring(0,Math.min(80,subject.length())));
   i.putExtra("elapsed",Math.max(0L,call.getLong("elapsedMs",0L))); i.putExtra("paused",call.getBoolean("paused",false));
   if(Build.VERSION.SDK_INT>=26)getContext().startForegroundService(i); else getContext().startService(i); call.resolve();
  } catch(Exception error){call.reject("Unable to start the focus notification service: "+error.getMessage(),error);}
 }
 @PluginMethod public void stopTimer(PluginCall call) {
  try {
   getContext().stopService(new Intent(getContext(),FocusTimerService.class));
   getContext().getSharedPreferences("focus_timer",0).edit().clear().commit();
   call.resolve();
  } catch(Exception error){call.reject("Unable to stop the focus notification service: "+error.getMessage(),error);}
 }
}