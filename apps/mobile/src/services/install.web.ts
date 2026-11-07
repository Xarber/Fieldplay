import type { Release } from "./releases";
export type DownloadStatus = {
  state:
    "idle" | "downloading" | "paused" | "downloaded" | "installing" | "error";
  written: number;
  total: number;
  speed: number;
  message: string;
};
export const supportsInstaller = () => false;
export function subscribeDownload(callback: (s: DownloadStatus) => void) {
  callback({ state: "idle", written: 0, total: 0, speed: 0, message: "" });
  return () => {};
}
export async function downloadUpdate(_release: Release) {
  throw new Error("Web updates use the service worker update prompt.");
}
export async function pauseDownload() {}
export async function resumeDownload() {}
export function cancelDownload() {}
export async function installUpdate() {}
export async function lastInstallStatus() {
  return "Web updates use the service worker update prompt.";
}
