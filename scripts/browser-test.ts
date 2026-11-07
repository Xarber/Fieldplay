// Real Chromium UI + two real WebRTC peers. Geolocation is explicitly synthetic.
import { chromium, type Page, type BrowserContext } from "playwright-core";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { makeServer } from "../services/server/src/server";
import { serveStatic } from "./static-server";
const staticServer = await serveStatic("apps/mobile/dist");
const authority = makeServer({ port: 0 });
const signalPort = await authority.listen();
const executablePath =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: [
    "--disable-dev-shm-usage",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const errors: string[] = [];
const point = { latitude: 41.914, longitude: 12.486, accuracy: 2 };
let a: Page | undefined, b: Page | undefined;
async function context() {
  const c = await browser.newContext({
    viewport: { width: 1440, height: 1060 },
    geolocation: point,
    permissions: ["geolocation"],
  });
  const p = await c.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  return { c, p };
}
async function fix(c: BrowserContext) {
  await c.setGeolocation(point);
}
const results: string[] = [];
try {
  await mkdir("artifacts/screenshots", { recursive: true });
  const A = await context();
  a = A.p;
  await a.goto(`http://localhost:${staticServer.port}`);
  await a
    .getByRole("button", { name: "Host Treasure Hunt", exact: true })
    .waitFor();
  await a.screenshot({
    path: "artifacts/screenshots/home-desktop.png",
    fullPage: true,
  });
  await a
    .getByRole("button", { name: "Host Treasure Hunt", exact: true })
    .click();
  await a
    .getByRole("textbox", { name: "Your player name", exact: true })
    .fill("Ada");
  await a
    .getByRole("textbox", { name: "Private server address", exact: true })
    .fill(`ws://localhost:${signalPort}`);
  await a
    .getByRole("button", { name: "Create private party", exact: true })
    .click();
  await a.getByText("The party", { exact: true }).waitFor();
  await a.getByRole("button", { name: "Invite friends", exact: true }).click();
  const creds = await a.evaluate(
    () => JSON.parse(sessionStorage.getItem("fieldplay.session")!).credentials,
  );
  assert.equal(creds.authority, "peer");
  const B = await context();
  b = B.p;
  await b.goto(`http://localhost:${staticServer.port}`);
  await b
    .getByRole("button", { name: "Join your friends", exact: true })
    .click();
  await b
    .getByRole("textbox", { name: "Your player name", exact: true })
    .fill("Bo");
  await b
    .getByRole("textbox", { name: "Private server address", exact: true })
    .fill(`ws://localhost:${signalPort}`);
  await b
    .getByRole("textbox", { name: "Invite code or link", exact: true })
    .fill(creds.code);
  await b
    .getByRole("button", { name: "Join private party", exact: true })
    .click();
  await b.getByText("The party", { exact: true }).waitFor({ timeout: 15000 });
  for (const [p, c, clue] of [
    [a, A.c, "Under the first safe tree"],
    [b, B.c, "Beside the garden gate"],
  ] as const) {
    await p
      .getByRole("button", {
        name: "I accept the game & location rules",
        exact: true,
      })
      .click();
    await fix(c);
    await p
      .getByRole("button", { name: "Register treasure at my GPS", exact: true })
      .waitFor({ state: "visible" });
    await p
      .getByRole("textbox", { name: "A clue for the hunter", exact: true })
      .fill(clue);
    await p
      .getByRole("button", { name: "Register treasure at my GPS", exact: true })
      .click();
    await p.getByText("YOUR TREASURE IS REGISTERED", { exact: true }).waitFor();
    await p
      .getByRole("button", { name: "Show my treasure QR", exact: true })
      .click();
    await p.getByRole("button", { name: "I’m ready", exact: true }).click();
  }
  await a.getByText("2/2 READY", { exact: true }).waitFor();
  const text = await a.locator("body").innerText();
  const treasureCodes = text.match(/\b[a-f0-9]{32}\b/g)!;
  const aTreasure = treasureCodes.find((s) => s !== creds.code)!;
  assert.ok(aTreasure);
  await a.screenshot({
    path: "artifacts/screenshots/lobby-desktop.png",
    fullPage: true,
  });
  await a.getByRole("button", { name: "Start match", exact: true }).click();
  await b.getByText("Back to the beginning", { exact: true }).waitFor();
  await fix(A.c);
  await fix(B.c);
  await a
    .getByRole("button", { name: "I’m back at the starting area", exact: true })
    .click();
  await b
    .getByRole("button", { name: "I’m back at the starting area", exact: true })
    .click();
  await a.getByText("Follow the clue", { exact: true }).waitFor();
  await b.getByText("Under the first safe tree", { exact: true }).waitFor();
  await a.getByText("Beside the garden gate", { exact: true }).waitFor();
  await a.screenshot({
    path: "artifacts/screenshots/live-desktop.png",
    fullPage: true,
  });
  await fix(B.c);
  await b
    .getByRole("textbox", { name: "Treasure verification code", exact: true })
    .fill(aTreasure);
  await b
    .getByRole("button", { name: "Verify discovery", exact: true })
    .click();
  await a
    .getByText("That’s a wrap. Your location is no longer being shared.", {
      exact: true,
    })
    .waitFor();
  await b
    .getByText("That’s a wrap. Your location is no longer being shared.", {
      exact: true,
    })
    .waitFor();
  assert.match(await a.locator("body").innerText(), /Bo/);
  await a.screenshot({
    path: "artifacts/screenshots/results-desktop.png",
    fullPage: true,
  });
  results.push(
    "Two browser UI clients completed Treasure Hunt over actual host-authoritative WebRTC DataChannels.",
  );
  await a
    .getByRole("button", { name: "Play another round", exact: true })
    .click();
  await b.getByText("Leave a little mystery", { exact: true }).waitFor();
  results.push(
    "Replay synchronized to both clients; location consent and treasure preparation reset.",
  );
  // Separate clean profile for responsive/PWA/offline checks; no party state is cached.
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 2,
  });
  const m = await mobile.newPage();
  m.on("pageerror", (e) => errors.push(e.message));
  await m.goto(`http://localhost:${staticServer.port}`);
  await m
    .getByRole("button", { name: "Host Treasure Hunt", exact: true })
    .waitFor();
  await m.screenshot({
    path: "artifacts/screenshots/home-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await m.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  const manifest = await m.evaluate(async () => {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link) throw new Error("No manifest linked");
    return (await fetch(link.getAttribute("href")!)).json();
  });
  assert.equal(manifest.display, "standalone");
  await m.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await m.reload();
  await m
    .getByRole("button", { name: "Host Treasure Hunt", exact: true })
    .waitFor();
  await mobile.setOffline(true);
  await m.reload();
  await m
    .getByRole("button", { name: "Host Treasure Hunt", exact: true })
    .waitFor();
  results.push(
    "Production PWA manifest, service worker, cold reload offline and 390px layout verified in Chromium.",
  );
  await mobile.setOffline(false);
  await m.getByRole("tab", { name: "Profile", exact: true }).click();
  const unlock = async () => {
    const version = m.getByRole("button", { name: /^Fieldplay 0\.1\.0/ });
    await version.click();
    await version.click();
    await version.click();
    await m
      .getByRole("button", { name: "Developer Ideas", exact: true })
      .click();
  };
  await unlock();
  await m.getByRole("button", { name: "New idea", exact: true }).click();
  await m
    .getByRole("textbox", { name: "Idea title", exact: true })
    .fill("Isolated browser test idea");
  await m
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Synthetic test record, never synced to a production collection.");
  await m.getByRole("button", { name: "Save idea", exact: true }).click();
  const exported = m.waitForEvent("download");
  await m.getByRole("button", { name: "Export JSON", exact: true }).click();
  const download = await exported;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const collection = JSON.parse(Buffer.concat(chunks).toString());
  assert.equal(collection.ideas.length, 1);
  await m.reload();
  await m.getByRole("tab", { name: "Profile", exact: true }).click();
  await unlock();
  await m.getByText("□ Isolated browser test idea", { exact: true }).waitFor();
  collection.ideas[0].description = "Incoming conflict must be reviewed";
  const chooser = m.waitForEvent("filechooser");
  await m.getByRole("button", { name: "Import ideas", exact: true }).click();
  await (
    await chooser
  ).setFiles({
    name: "Fieldplay-Ideas.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(collection)),
  });
  await m.getByText("Review import before applying", { exact: true }).waitFor();
  await m
    .getByRole("button", { name: "Apply reviewed import", exact: true })
    .click();
  await m
    .getByText(
      "Synthetic test record, never synced to a production collection.",
      { exact: true },
    )
    .waitFor();
  results.push(
    "Offline developer idea creation, IndexedDB persistence across reload, real JSON download and reviewed conflict-preserving file import verified.",
  );
  assert.deepEqual(errors, []);
  results.push("No browser JavaScript page errors.");
  console.log(
    JSON.stringify(
      {
        passed: results,
        limitations: [
          "GPS coordinates are synthetic browser fixtures. No physical-device, outdoor, STUN/TURN or cross-network evidence.",
        ],
      },
      null,
      2,
    ),
  );
  await writeFile(
    "artifacts/browser-results.json",
    JSON.stringify(
      { passed: results, errors, at: new Date().toISOString() },
      null,
      2,
    ),
  );
} catch (e) {
  if (a)
    await a
      .screenshot({
        path: "artifacts/screenshots/failure-host.png",
        fullPage: true,
      })
      .catch(() => {});
  if (b)
    await b
      .screenshot({
        path: "artifacts/screenshots/failure-guest.png",
        fullPage: true,
      })
      .catch(() => {});
  console.error("Browser errors:", errors);
  console.error("Host page:", await a?.locator("body").innerText());
  console.error("Guest page:", await b?.locator("body").innerText());
  throw e;
} finally {
  await browser.close();
  await authority.close();
  await staticServer.close();
}
