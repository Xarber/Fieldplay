// SPDX-License-Identifier: AGPL-3.0-only
import AsyncStorage from "@react-native-async-storage/async-storage";
let database: Promise<IDBDatabase> | undefined;
function db() {
  return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open("fieldplay", 1);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains("kv"))
        open.result.createObjectStore("kv");
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () =>
      reject(
        new Error("Browser storage is unavailable. Original data preserved."),
      );
  }));
}
async function rawRead(key: string) {
  const database = await db();
  return new Promise<string | undefined>((resolve, reject) => {
    const request = database
      .transaction("kv", "readonly")
      .objectStore("kv")
      .get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function read<T>(key: string, fallback: T): Promise<T> {
  let raw = await rawRead(key);
  if (raw === undefined) {
    const legacy = await AsyncStorage.getItem(`fieldplay.v1.${key}`);
    if (legacy !== null) {
      raw = legacy;
      await write(key, JSON.parse(legacy));
    }
  }
  if (raw === undefined) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Saved ${key} could not be read. Original data preserved.`);
  }
}
export async function write(key: string, value: unknown) {
  const database = await db();
  return new Promise<void>((resolve, reject) => {
    const tx = database.transaction("kv", "readwrite");
    tx.objectStore("kv").put(JSON.stringify(value), key);
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(
        new Error(`Could not save ${key}. Free browser storage and retry.`),
      );
    tx.onabort = () => reject(tx.error);
  });
}
export async function saveSession(value: unknown) {
  sessionStorage.setItem("fieldplay.session", JSON.stringify(value));
}
export async function loadSession<T>(): Promise<T | undefined> {
  const raw = sessionStorage.getItem("fieldplay.session");
  if (!raw) return;
  try {
    return JSON.parse(raw);
  } catch {
    return;
  }
}
export async function clearSession() {
  sessionStorage.removeItem("fieldplay.session");
}
