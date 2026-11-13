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
  Intent i=new Intent(getContext(),FocusTimerService.class).setAction(FocusTimerService.START);
  i.putExtra("subject",call.getString("subject","Focus session")); i.putExtra("elapsed",Math.max(0L,call.getLong("elapsedMs",0L))); i.putExtra("paused",call.getBoolean("paused",false));
  if(Build.VERSION.SDK_INT>=26)getContext().startForegroundService(i); else getContext().startService(i); call.resolve();
 }
 @PluginMethod public void stopTimer(PluginCall call) {
  getContext().stopService(new Intent(getContext(),FocusTimerService.class));
  getContext().getSharedPreferences("focus_timer",0).edit().clear().apply();
  call.resolve();
 }
}