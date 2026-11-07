// SPDX-License-Identifier: AGPL-3.0-only
import {getNetworkStateAsync,NetworkStateType} from "expo-network";
import {read} from "./storage";
import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import {
  DownloadTask,
  File,
  Paths,
  type DownloadProgress,
} from "expo-file-system";
import type { Release } from "./releases";
import { build } from "./releases";
type Installer = {
  canInstall: () => Promise<boolean>;
  requestInstallPermission: () => Promise<void>;
  install: (uri: string, sha256: string, build: number) => Promise<string>;
  lastInstallStatus: () => Promise<string>;
};
const installer =
  Platform.OS === "android"
    ? requireOptionalNativeModule<Installer>("FieldplayInstaller")
    : null;
export type DownloadStatus = {
  state:
    "idle" | "downloading" | "paused" | "downloaded" | "installing" | "error";
  written: number;
  total: number;
  speed: number;
  message: string;
};
let status: DownloadStatus = {
  state: "idle",
  written: 0,
  total: 0,
  speed: 0,
  message: "",
};
const listeners = new Set<(s: DownloadStatus) => void>();
let task: DownloadTask | undefined;
let artifact: Release["artifacts"][number] | undefined;
let file: File | undefined;
let sample = { at: 0, bytes: 0 };
const publish = (patch: Partial<DownloadStatus>) => {
  status = { ...status, ...patch };
  listeners.forEach((l) => l(status));
};
const progress = ({ bytesWritten, totalBytes }: DownloadProgress) => {
  const now = Date.now(),
    delta = now - sample.at;
  if (delta > 500) {
    const speed = ((bytesWritten - sample.bytes) / delta) * 1000;
    sample = { at: now, bytes: bytesWritten };
    publish({
      written: bytesWritten,
      total: totalBytes > 0 ? totalBytes : (artifact?.size ?? 0),
      speed,
    });
  }
};
export function subscribeDownload(callback: (s: DownloadStatus) => void) {
  listeners.add(callback);
  callback(status);
  return () => {
    listeners.delete(callback);
  };
}
export const supportsInstaller = () => !!installer;
async function done(operation: Promise<File | null>) {
  try {
    const result = await operation;
    if (result) {
      file = result;
      publish({
        state: "downloaded",
        written: result.size,
        message:
          "Download complete. Package verification runs before Android opens installation.",
      });
    } else publish({ state: "paused", message: "Download paused." });
  } catch (e) {
    if (task?.state === "cancelled") return;
    publish({
      state: "error",
      message:
        e instanceof Error
          ? e.message
          : "Download failed. Retry when connected.",
    });
  }
}
export async function downloadUpdate(release: Release) {
  if (!installer || Platform.OS !== "android")
    throw new Error(
      "Internal APK installation is available only in compatible Android private builds.",
    );
  if (["downloading", "installing"].includes(status.state))
    throw new Error("An update is already in progress.");
  artifact = release.artifacts.find(
    (a) =>
      a.platform === "android" &&
      a.variant === build.variant &&
      new URL(a.url).pathname.endsWith(".apk") &&
      a.build > Number(build.build),
  );
  if (!artifact)
    throw new Error(
      "No newer compatible APK is available for this distribution variant.",
    );
  if (Paths.availableDiskSpace < artifact.size * 2 + 50_000_000)
    throw new Error("Not enough free storage for a safe update.");
  if(await read("wifi-only-updates",true)){const network=await getNetworkStateAsync();if(network.type!==NetworkStateType.WIFI)throw new Error("Wi-Fi-only downloads are enabled. Connect to Wi-Fi or change your update preferences.");}
  task?.release();
  file = new File(Paths.cache, "fieldplay-update.apk");
  if (file.exists) file.delete();
  sample = { at: Date.now(), bytes: 0 };
  publish({
    state: "downloading",
    written: 0,
    total: artifact.size,
    speed: 0,
    message: "Downloading securely. Keep release notes open while you wait.",
  });
  task = new DownloadTask(artifact.url, file, { onProgress: progress });
  await done(task.downloadAsync());
}
export async function pauseDownload() {
  if (task?.state === "active") {
    await task.pauseAsync();
    publish({
      state: "paused",
      message: "Paused. Resume on a suitable network.",
    });
  }
}
export async function resumeDownload() {
  if (task?.state !== "paused") throw new Error("There is no paused download.");
  sample = { at: Date.now(), bytes: status.written };
  publish({ state: "downloading", message: "Resuming download." });
  await done(task.resumeAsync());
}
export function cancelDownload() {
  task?.cancel();
  if (file?.exists) file.delete();
  publish({
    state: "idle",
    written: 0,
    total: 0,
    speed: 0,
    message: "Download cancelled. Existing application and data preserved.",
  });
}
export async function installUpdate() {
  if (!installer || !artifact || !file?.exists)
    throw new Error("Download a compatible update first.");
  if (!(await installer.canInstall())) {
    await installer.requestInstallPermission();
    publish({
      message:
        "Allow installation in Android Settings, then tap Install downloaded update again.",
    });
    return;
  }
  publish({
    state: "installing",
    message:
      "Verifying checksum, package identity, version and signing certificate…",
  });
  try {
    await installer.install(file.uri, artifact.sha256, artifact.build);
    publish({
      state: "downloaded",
      message:
        "Android installation confirmation is required. Opening it does not mean installation succeeded.",
    });
  } catch (e) {
    publish({
      state: "error",
      message: e instanceof Error ? e.message : "Installation failed.",
    });
    throw e;
  }
}
export async function lastInstallStatus() {
  return installer
    ? await installer.lastInstallStatus()
    : "This platform uses its distribution channel’s installation workflow.";
}
