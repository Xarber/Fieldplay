// Section-36 browser checks. Does not claim native motion/device performance.
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { makeServer } from "../services/server/src/server";
import { mkdir, writeFile } from "node:fs/promises";
const service = makeServer({ port: 0, webRoot: "apps/mobile/dist" });
const port = await service.listen();
const base = `http://localhost:${port}`;
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
});
const errors: string[] = [];
const results: string[] = [];
await mkdir("artifacts/screenshots", { recursive: true });
try {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
    colorScheme: "dark",
  });
  const d = await desktop.newPage();
  d.on("pageerror", (e) => errors.push(e.message));
  await d.goto(base + "/welcome/");
  await d
    .getByRole("heading", { name: "The best part is out there." })
    .waitFor();
  await d.getByRole("button", { name: "Check service", exact: true }).click();
  await d.getByText(/Service available · 0.1.0/).waitFor();
  await d
    .locator("img")
    .evaluateAll((images) =>
      images.forEach(
        (image) => ((image as HTMLImageElement).loading = "eager"),
      ),
    );
  await d.waitForFunction(() =>
    Array.from(document.images).every(
      (image) => image.complete && image.naturalWidth > 0,
    ),
  );
  await d.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await d.screenshot({
    path: "artifacts/screenshots/landing-desktop.png",
    fullPage: true,
  });
  results.push("Distinct landing and actual server health-check interface");
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 2,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const p = await context.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base + "/welcome/");
  assert.equal(
    await p.evaluate(() => getComputedStyle(document.body).backgroundColor),
    "rgb(246, 246, 250)",
  );
  assert.ok(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  await p.screenshot({
    path: "artifacts/screenshots/landing-mobile-light.png",
    fullPage: true,
  });
  await p
    .getByRole("link", { name: "Open web app", exact: false })
    .first()
    .click();
  await p
    .getByRole("button", { name: "Host Treasure Hunt", exact: true })
    .waitFor();
  const heading = p.getByText("A little less screen. A lot more adventure.", {
    exact: true,
  });
  const box = await heading.boundingBox();
  assert.ok(
    box && box.x >= 0 && box.x + box.width <= 391,
    "Mobile title must fit",
  );
  await p.getByRole("tab", { name: "Profile", exact: true }).click();
  await p.getByRole("button", { name: "light", exact: true }).click();
  await p.getByRole("tab", { name: "Play", exact: true }).click();
  await p.screenshot({
    path: "artifacts/screenshots/home-mobile-light.png",
    fullPage: true,
  });
  const button = p.getByRole("button", {
    name: "Host Treasure Hunt",
    exact: true,
  });
  await button.scrollIntoViewIfNeeded();
  await button.hover();
  await p.mouse.down();
  const transform = await button
    .locator("div")
    .first()
    .evaluate((el) => getComputedStyle(el).transform);
  assert.ok(
    transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)",
    `Reduced-motion press should not scale: ${transform}`,
  );
  await p.mouse.up();
  await p
    .getByRole("textbox", { name: "Your player name", exact: true })
    .waitFor();
  await p.screenshot({
    path: "artifacts/screenshots/modal-mobile-reduced-motion.png",
    fullPage: true,
  });
  await p.getByRole("button", { name: "Close", exact: true }).click();
  await p
    .getByRole("button", { name: "Host Treasure Hunt", exact: true })
    .waitFor();
  results.push(
    "390px light/dark layouts, bounded hero typography, light theme and reduced-motion controls/dialogs",
  );
  assert.deepEqual(errors, []);
  await writeFile(
    "artifacts/design-results.json",
    JSON.stringify(
      { passed: results, errors, at: new Date().toISOString() },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ passed: results, errors }, null, 2));
} finally {
  await browser.close();
  await service.close();
}
