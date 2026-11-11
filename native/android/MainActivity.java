package com.nationvk.focusflow;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(GalleryPlugin.class);
    registerPlugin(FocusTimerPlugin.class);
    super.onCreate(savedInstanceState);
  }
}