package com.nationvk.focusflow;
import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.os.*;
import androidx.core.app.NotificationCompat;
public class FocusTimerService extends Service {
 static final String START="FOCUS_START", STOP="FOCUS_STOP", CHANNEL="focus_flow_timer";
 private static final int ID=4108;
 private String subject="Focus session"; private long elapsedBase, baseEpoch; private boolean paused;
 public void onCreate(){super.onCreate(); if(Build.VERSION.SDK_INT>=26){NotificationChannel c=new NotificationChannel(CHANNEL,"Focus timer",NotificationManager.IMPORTANCE_LOW); c.setDescription("Persistent study timer"); getSystemService(NotificationManager.class).createNotificationChannel(c);}}
 public int onStartCommand(Intent i,int flags,int id){
  if(i!=null && STOP.equals(i.getAction())){stopForeground(true);stopSelf();return START_NOT_STICKY;}
  if(i!=null && START.equals(i.getAction())){subject=i.getStringExtra("subject");if(subject==null)subject="Focus session";elapsedBase=i.getLongExtra("elapsed",0L);baseEpoch=System.currentTimeMillis();paused=i.getBooleanExtra("paused",false);save();}
  else restore();
  Notification n=notification();
  if(Build.VERSION.SDK_INT>=34)startForeground(ID,n,ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);else startForeground(ID,n);
  return START_STICKY;
 }
 private long elapsed(){return elapsedBase+(paused?0:Math.max(0,System.currentTimeMillis()-baseEpoch));}
 private Notification notification(){
  long ms=elapsed(),sec=ms/1000;
  NotificationCompat.Builder b=new NotificationCompat.Builder(this,CHANNEL).setSmallIcon(android.R.drawable.ic_media_play)
   .setContentTitle("FOCUS FLOW · "+subject).setContentText((paused?"Paused · ":"Studying · ")+String.format("%02d:%02d:%02d",sec/3600,(sec%3600)/60,sec%60))
   .setOngoing(true).setOnlyAlertOnce(true).setPriority(NotificationCompat.PRIORITY_LOW).setCategory(NotificationCompat.CATEGORY_WORKOUT);
  Intent launch=getPackageManager().getLaunchIntentForPackage(getPackageName());
  if(launch!=null)b.setContentIntent(PendingIntent.getActivity(this,0,launch,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
  if(!paused)b.setWhen(System.currentTimeMillis()-ms).setUsesChronometer(true); else b.setShowWhen(false);
  return b.build();
 }
 private void save(){getSharedPreferences("focus_timer",0).edit().putString("subject",subject).putLong("elapsed",elapsedBase).putLong("epoch",baseEpoch).putBoolean("paused",paused).apply();}
 private void restore(){SharedPreferences p=getSharedPreferences("focus_timer",0);subject=p.getString("subject","Focus session");elapsedBase=p.getLong("elapsed",0);baseEpoch=p.getLong("epoch",System.currentTimeMillis());paused=p.getBoolean("paused",false);}
 public void onDestroy(){super.onDestroy();getSharedPreferences("focus_timer",0).edit().clear().apply();}
 public IBinder onBind(Intent i){return null;}
}