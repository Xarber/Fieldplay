import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { makeServer } from "../services/server/src/server";
const service = makeServer({ port: 0, webRoot: "apps/mobile/dist" });
const port = await service.listen();
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`http://localhost:${port}/`);
  await page.getByTitle("Welcome to Fieldplay").waitFor();
  await page
    .frameLocator("iframe")
    .getByRole("link", { name: "Open web app" }).first()
    .click();
  await page.getByTitle("Welcome to Fieldplay").waitFor({ state: "detached" });
  assert.equal(
    await page.evaluate(() => localStorage.getItem("fieldplay.web.opened.v1")),
    "yes",
  );
  await page.reload();
  await page.getByRole("link", { name: "Fieldplay introduction" }).click();
  await page.getByTitle("Welcome to Fieldplay").waitFor();
  await page.goBack();
  await page.getByTitle("Welcome to Fieldplay").waitFor({ state: "detached" });
  const fresh = await browser.newPage();
  await fresh.goto(`http://localhost:${port}/?code=example`);
  await fresh.getByRole("link", { name: "Fieldplay introduction" }).waitFor();
  assert.equal(await fresh.getByTitle("Welcome to Fieldplay").count(), 0);
  console.log(
    "PASS first visit, explicit entry, persistence, return, history, invitation bypass",
  );
} finally {
  await browser.close();
  await service.close();
}
