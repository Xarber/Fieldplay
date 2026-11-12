import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { makeServer } from "../services/server/src/server";

const service = makeServer({ port: 0, webRoot: "apps/mobile/dist" });
const port = await service.listen();
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.goto(`http://localhost:${port}/#app`);
  await page.getByRole("tab", { name: "Games" }).click();
  await page
    .getByText("Apri la console riservata al master", { exact: true })
    .click();
  for (const name of ["Ada", "Leone", "Marta", "Neri", "Bianca", "Elia"]) {
    const pending = page.waitForEvent("download");
    await page
      .getByRole("button", { name: `Scarica scheda di ${name}` })
      .click();
    assert.equal((await pending).suggestedFilename(), `${name}.md`);
  }
  for (const event of [
    "Presentazioni concluse",
    "Delitto annunciato",
    "Registro ritrovato",
    "Accuse raccolte",
  ]) {
    await page
      .getByRole("textbox", { name: "Evento segnalato al master" })
      .fill(event);
    await page.getByRole("button", { name: "Registra annuncio" }).click();
    await page.getByText(event, { exact: true }).waitFor();
    if (event !== "Accuse raccolte")
      await page.getByRole("button", { name: "Fase successiva" }).click();
  }
  assert.deepEqual(errors, []);
  console.log("PASS: six character downloads and four master phases");
} finally {
  await browser.close();
  await service.close();
}
