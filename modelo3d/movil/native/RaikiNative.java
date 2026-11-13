package com.raiki.r3d;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Puente propio de RAIKI 3D: versión instalada y actualizar la app desde la misma app
@CapacitorPlugin(name = "RaikiNative")
public class RaikiNative extends Plugin {

  @PluginMethod
  public void info(PluginCall call) {
    JSObject r = new JSObject();
    try {
      r.put("version", getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0).versionName);
    } catch (Exception e) {
      r.put("version", "");
    }
    call.resolve(r);
  }

  // Descarga el APK nuevo dentro de la app y abre el instalador de Android (un toque: «Actualizar»)
  @PluginMethod
  public void installUpdate(final PluginCall call) {
    final String url = call.getString("url", "https://github.com/riuk1126/oxenpro/releases/download/3d-v1.0.0/RAIKI-3D.apk");
    final Context ctx = getContext();
    if (Build.VERSION.SDK_INT >= 26 && !ctx.getPackageManager().canRequestPackageInstalls()) {
      try {
        Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + ctx.getPackageName()));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        ctx.startActivity(i);
      } catch (Exception e) { }
      JSObject r = new JSObject();
      r.put("status", "permission");
      call.resolve(r);
      return;
    }
    new Thread(() -> {
      try {
        File dir = new File(ctx.getCacheDir(), "update");
        dir.mkdirs();
        File f = new File(dir, "RAIKI-3D.apk");
        String u = url;
        HttpURLConnection c = null;
        for (int k = 0; k < 6; k++) {
          c = (HttpURLConnection) new URL(u).openConnection();
          c.setInstanceFollowRedirects(false);
          c.setConnectTimeout(20000);
          c.setReadTimeout(60000);
          int code = c.getResponseCode();
          if (code >= 300 && code < 400) { u = new URL(new URL(u), c.getHeaderField("Location")).toString(); c.disconnect(); continue; }
          if (code != 200) throw new Exception("HTTP " + code);
          break;
        }
        long total = c.getContentLength();
        InputStream in = c.getInputStream();
        FileOutputStream out = new FileOutputStream(f);
        byte[] buf = new byte[65536];
        long got = 0; int n; int last = -1;
        while ((n = in.read(buf)) > 0) {
          out.write(buf, 0, n);
          got += n;
          if (total > 0) {
            int pc = (int) (got * 100 / total);
            if (pc != last) { last = pc; JSObject p = new JSObject(); p.put("p", pc); notifyListeners("updProgress", p); }
          }
        }
        out.close(); in.close(); c.disconnect();
        Uri uri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", f);
        Intent i = new Intent(Intent.ACTION_VIEW);
        i.setDataAndType(uri, "application/vnd.android.package-archive");
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        ctx.startActivity(i);
        JSObject r = new JSObject();
        r.put("status", "installing");
        call.resolve(r);
      } catch (Exception e) {
        call.reject(String.valueOf(e.getMessage()));
      }
    }).start();
  }
}
