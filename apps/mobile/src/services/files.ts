// SPDX-License-Identifier: AGPL-3.0-only
import { Platform } from "react-native";
import * as Picker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
export async function exportFile(
  filename: string,
  content: string,
  mime = "application/json",
) {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const file = new File(Paths.cache, filename);
  file.write(content);
  if (await Sharing.isAvailableAsync())
    await Sharing.shareAsync(file.uri, {
      mimeType: mime,
      dialogTitle: "Export Fieldplay data",
    });
  else throw new Error("Sharing is unavailable on this device.");
}
export async function importJSON() {
  const result = await Picker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return;
  const asset = result.assets[0];
  if ((asset.size ?? 0) > 50_000_000)
    throw new Error("Choose a JSON file under 50 MB.");
  const raw =
    Platform.OS === "web"
      ? await (asset.file?.text() ?? fetch(asset.uri).then((r) => r.text()))
      : await new File(asset.uri).text();
  if (raw.length > 50_000_000) throw new Error("File is too large.");
  return JSON.parse(raw) as unknown;
}
export async function pickScreenshot() {
  const result = await Picker.getDocumentAsync({
    type: ["image/png", "image/jpeg", "image/webp"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return;
  const a = result.assets[0];
  if (!a.size || a.size > 500000)
    throw new Error("Choose a screenshot under 500 KB.");
  if (Platform.OS === "web")
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(a.file!);
    });
  return `data:${a.mimeType};base64,${await new File(a.uri).base64()}`;
}
