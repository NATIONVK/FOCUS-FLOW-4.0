package com.nationvk.focusflow;
import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.os.*;
import androidx.core.app.NotificationCompat;
public class FocusTimerService extends Service {
 static final String START="FOCUS_START", STOP="FOCUS_STOP", CHANNEL="focus_flow_timer";
 private static final int ID=4108;
 private String subject="Focus session", sessionId=""; private long elapsedBase, baseEpoch; private boolean paused;
 @Override public void onCreate(){super.onCreate();if(Build.VERSION.SDK_INT>=26){NotificationChannel c=new NotificationChannel(CHANNEL,"Focus timer",NotificationManager.IMPORTANCE_LOW);c.setDescription("Persistent study timer");getSystemService(NotificationManager.class).createNotificationChannel(c);}}
 @Override public int onStartCommand(Intent intent,int flags,int startId){
  if(intent!=null&&STOP.equals(intent.getAction())){clearSnapshot();stopForeground(true);stopSelf();return START_NOT_STICKY;}
  if(intent!=null&&START.equals(intent.getAction())){
   subject=safeSubject(intent.getStringExtra("subject"));sessionId=safeSessionId(intent.getStringExtra("sessionId"));elapsedBase=Math.max(0,intent.getLongExtra("elapsed",0L));baseEpoch=System.currentTimeMillis();paused=intent.getBooleanExtra("paused",false);
  }else if(!restoreSnapshot()){stopSelf();return START_NOT_STICKY;}
  Notification notification=buildNotification();
  if(Build.VERSION.SDK_INT>=34)startForeground(ID,notification,ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);else startForeground(ID,notification);
  saveSnapshot();
  return START_STICKY;
 }
 private String safeSessionId(String value){if(value==null)return "";String clean=value.trim();return clean.substring(0,Math.min(200,clean.length()));}
 private String safeSubject(String value){if(value==null||value.trim().isEmpty())return "Focus session";String clean=value.replaceAll("[\\r\\n\\t]"," ").trim();return clean.substring(0,Math.min(60,clean.length()));}
 private long elapsed(){long delta=paused?0:Math.max(0,System.currentTimeMillis()-baseEpoch);if(Long.MAX_VALUE-elapsedBase<delta)return Long.MAX_VALUE;return elapsedBase+delta;}
 private Notification buildNotification(){
  long ms=elapsed(),sec=ms/1000;
  NotificationCompat.Builder builder=new NotificationCompat.Builder(this,CHANNEL).setSmallIcon(R.drawable.ic_stat_focus_flow)
   .setContentTitle("FOCUS FLOW").setContentText(subject+" · "+(paused?"Paused · ":"Studying · ")+String.format(java.util.Locale.getDefault(),"%02d:%02d:%02d",sec/3600,(sec%3600)/60,sec%60))
   .setOngoing(true).setOnlyAlertOnce(true).setPriority(NotificationCompat.PRIORITY_LOW).setCategory(NotificationCompat.CATEGORY_WORKOUT);
  Intent launch=getPackageManager().getLaunchIntentForPackage(getPackageName());
  if(launch!=null)builder.setContentIntent(PendingIntent.getActivity(this,0,launch,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
  if(!paused)builder.setWhen(System.currentTimeMillis()-ms).setUsesChronometer(true);else builder.setShowWhen(false);
  return builder.build();
 }
 private void saveSnapshot(){getSharedPreferences("focus_timer",MODE_PRIVATE).edit().putString("subject",subject).putString("sessionId",sessionId).putLong("elapsed",elapsedBase).putLong("epoch",baseEpoch).putBoolean("paused",paused).commit();}
 private boolean restoreSnapshot(){
  SharedPreferences preferences=getSharedPreferences("focus_timer",MODE_PRIVATE);
  if(!preferences.contains("epoch"))return false;
  subject=safeSubject(preferences.getString("subject","Focus session"));sessionId=safeSessionId(preferences.getString("sessionId",""));elapsedBase=Math.max(0,preferences.getLong("elapsed",0));baseEpoch=Math.max(1,preferences.getLong("epoch",System.currentTimeMillis()));paused=preferences.getBoolean("paused",false);return true;
 }
 private void clearSnapshot(){getSharedPreferences("focus_timer",MODE_PRIVATE).edit().clear().commit();}
 @Override public void onDestroy(){super.onDestroy();}
 @Override public IBinder onBind(Intent intent){return null;}
}
