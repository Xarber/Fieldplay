// SPDX-License-Identifier: AGPL-3.0-only
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
let database: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  return (database ??= (async () => {
    const database = await SQLite.openDatabaseAsync("fieldplay.db");
    await database.execAsync("PRAGMA journal_mode=WAL;");
    const version = await database.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    if ((version?.user_version ?? 0) > 1)
      throw new Error(
        "Saved data is newer than this application. Original database preserved.",
      );
    await database.execAsync(
      "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL); PRAGMA user_version=1;",
    );
    return database;
  })());
}
export async function read<T>(key: string, fallback: T): Promise<T> {
  const database = await db();
  const row = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM kv WHERE key=?",
    key,
  );
  let raw = row?.value;
  if (raw === undefined) {
    const legacy = await AsyncStorage.getItem(`fieldplay.v1.${key}`);
    if (legacy !== null) {
      raw = legacy;
      await database.runAsync(
        "INSERT OR IGNORE INTO kv(key,value) VALUES(?,?)",
        key,
        raw,
      );
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
  await (
    await db()
  ).runAsync(
    "INSERT INTO kv(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    key,
    JSON.stringify(value),
  );
}
export async function saveSession(value: unknown) {
  await SecureStore.setItemAsync("fieldplay.session", JSON.stringify(value));
}
export async function loadSession<T>(): Promise<T | undefined> {
  const raw = await SecureStore.getItemAsync("fieldplay.session");
  if (!raw) return;
  try {
    return JSON.parse(raw);
  } catch {
    return;
  }
}
export async function clearSession() {
  await SecureStore.deleteItemAsync("fieldplay.session");
}
