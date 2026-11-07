// SPDX-License-Identifier: AGPL-3.0-only
import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = "apps/mobile/dist";
async function files(path: string): Promise<string[]> {
  const entries = await readdir(`${root}/${path}`, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory()
          ? files(`${path}${e.name}/`)
          : Promise.resolve([`/${path}${e.name}`]),
      ),
    )
  ).flat();
}
const html = await readFile(`${root}/index.html`, "utf8");
await writeFile(
  `${root}/index.html`,
  html
    .replace(
      "</head>",
      `<link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="description" content="Private outdoor multiplayer adventures."><style>*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}button,a{touch-action:manipulation}input,textarea{font-size:16px}*:focus-visible{outline:2px solid #A6A9FF;outline-offset:4px}body{overscroll-behavior-y:none}</style></head>`,
    )
    .replace("shrink-to-fit=no", "viewport-fit=cover"),
);
const assets = (await files("")).filter((p) =>
  /\.(js|css|png|svg|ico|woff2?|ttf|webmanifest|html)$/.test(p),
);
const hash = createHash("sha256");
for (const asset of assets) hash.update(await readFile(`${root}${asset}`));
const key = `fieldplay-${hash.digest("hex").slice(0, 16)}`;
const worker = `// Fieldplay static shell only. No API, GPS, session or external map responses cached.\nconst CACHE=${JSON.stringify(key)},ASSETS=${JSON.stringify(assets)};\nself.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));\nself.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('fieldplay-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));\nself.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting();});\nself.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('/index.html')));return;}if(ASSETS.includes(u.pathname))e.respondWith(caches.match(u.pathname).then(c=>c||fetch(e.request)));});\n`;
await writeFile(`${root}/sw.js`, worker);
console.log(`PWA shell generated: ${assets.length} assets, ${key}`);
