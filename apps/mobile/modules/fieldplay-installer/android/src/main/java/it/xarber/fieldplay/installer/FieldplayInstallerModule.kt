// SPDX-License-Identifier: AGPL-3.0-only
package it.xarber.fieldplay.installer

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.security.MessageDigest

class FieldplayInstallerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FieldplayInstaller")
    AsyncFunction("canInstall") {
      val context = appContext.reactContext ?: error("Application unavailable")
      context.packageManager.canRequestPackageInstalls()
    }
    AsyncFunction("requestInstallPermission") {
      val context = appContext.reactContext ?: error("Application unavailable")
      val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}"))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }
    AsyncFunction("install") { uri: String, expectedSha256: String, expectedBuild: Int ->
      val context = appContext.reactContext ?: error("Application unavailable")
      val pm = context.packageManager
      check(pm.canRequestPackageInstalls()) { "Allow system installation permission, then retry." }
      check(Regex("^[a-f0-9]{64}$").matches(expectedSha256)) { "Invalid checksum." }
      val file = File(Uri.parse(uri).path ?: error("Missing APK file"))
      check(file.canonicalPath.startsWith(context.cacheDir.canonicalPath + File.separator)) { "APK must be in the application cache." }
      check(file.exists() && file.length() > 0) { "Download is missing." }
      val digest = MessageDigest.getInstance("SHA-256")
      file.inputStream().use { input ->
        val buffer = ByteArray(65536)
        while (true) { val length = input.read(buffer); if (length < 0) break; digest.update(buffer, 0, length) }
      }
      val actual = digest.digest().joinToString("") { "%02x".format(it) }
      check(MessageDigest.isEqual(actual.toByteArray(), expectedSha256.toByteArray())) { "Download integrity verification failed." }
      val archive = pm.getPackageArchiveInfo(file.absolutePath, PackageManager.GET_SIGNING_CERTIFICATES) ?: error("Invalid APK package.")
      val installed = pm.getPackageInfo(context.packageName, PackageManager.GET_SIGNING_CERTIFICATES)
      check(archive.packageName == context.packageName) { "Package identifier does not match." }
      check(archive.longVersionCode == expectedBuild.toLong() && archive.longVersionCode > installed.longVersionCode) { "Incompatible build or downgrade rejected." }
      val incoming = archive.signingInfo?.apkContentsSigners?.map { it.toCharsString() }?.toSet() ?: emptySet()
      val current = installed.signingInfo?.apkContentsSigners?.map { it.toCharsString() }?.toSet() ?: emptySet()
      check(incoming.isNotEmpty() && incoming == current) { "APK signing identity differs from the installed application." }
      if (Build.VERSION.SDK_INT >= 30) {
        val source = pm.getInstallSourceInfo(context.packageName).installingPackageName
        check(source != "com.android.vending") { "Google Play installations must update through Google Play." }
      }
      val installer = pm.packageInstaller
      val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
      params.setAppPackageName(context.packageName)
      params.setSize(file.length())
      if (Build.VERSION.SDK_INT >= 31) params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_REQUIRED)
      val id = installer.createSession(params)
      try {
        installer.openSession(id).use { session ->
          session.openWrite("Fieldplay.apk", 0, file.length()).use { output ->
            file.inputStream().use { it.copyTo(output) }; session.fsync(output)
          }
          val result = Intent(context, InstallResultReceiver::class.java).setAction("it.xarber.fieldplay.INSTALL_RESULT")
          val flags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= 31) PendingIntent.FLAG_MUTABLE else 0)
          val pending = PendingIntent.getBroadcast(context, id, result, flags)
          session.commit(pending.intentSender)
        }
        context.getSharedPreferences("fieldplay-updates", Context.MODE_PRIVATE).edit().putString("status", "Awaiting Android installation confirmation").apply()
        "awaiting-system-confirmation"
      } catch (error: Throwable) { installer.abandonSession(id); throw error }
    }
    AsyncFunction("lastInstallStatus") {
      val context = appContext.reactContext ?: error("Application unavailable")
      context.getSharedPreferences("fieldplay-updates", Context.MODE_PRIVATE).getString("status", "No installation attempted")
    }
  }
}

class InstallResultReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)
    val message = when (status) {
      PackageInstaller.STATUS_PENDING_USER_ACTION -> {
        @Suppress("DEPRECATION")
        val confirmation = intent.getParcelableExtra<Intent>(Intent.EXTRA_INTENT)
        confirmation?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)?.let { context.startActivity(it) }
        "Awaiting Android installation confirmation"
      }
      PackageInstaller.STATUS_SUCCESS -> "Update installed successfully"
      else -> "Installation failed or was cancelled (Android status $status)"
    }
    context.getSharedPreferences("fieldplay-updates", Context.MODE_PRIVATE).edit().putString("status", message).apply()
  }
}
