import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
const master = await readFile("assets/branding/icon.svg", "utf8");
for (const [name, size] of [
  ["icon", 1024],
  ["icon-192", 192],
  ["icon-512", 512],
  ["apple-touch-icon", 180],
  ["favicon", 48],
] as const) {
  await sharp(Buffer.from(master))
    .resize(size, size)
    .png()
    .toFile(`apps/mobile/assets/${name}.png`);
  if (size !== 1024)
    await sharp(Buffer.from(master))
      .resize(size, size)
      .png()
      .toFile(`apps/mobile/public/${name}.png`);
}
await sharp(
  Buffer.from(
    master.replace('<g id="background">', '<g id="background" opacity="0">'),
  ),
)
  .png()
  .toFile("apps/mobile/assets/adaptive-foreground.png");
await sharp("assets/branding/icon-mono.svg")
  .png()
  .toFile("apps/mobile/assets/monochrome.png");
await sharp(
  Buffer.from(
    master.replace("#777BFF", "#242844").replace("#494DD2", "#101422"),
  ),
)
  .png()
  .toFile("apps/mobile/assets/icon-dark.png");
const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="560"><g id="background"><rect width="1600" height="560" fill="#101422"/></g><g id="wordmark" font-family="Arial,sans-serif"><text x="110" y="235" fill="white" font-size="100" font-weight="700">fieldplay<tspan fill="#C4EF9A">.</tspan></text><text x="115" y="325" fill="#BFC2D1" font-size="36">Turn the world into a game.</text><text x="118" y="445" fill="#C4EF9A" font-size="22" letter-spacing="5">OUTSIDE IS THE PLAYGROUND</text></g><g id="compass" fill="none" stroke="#6269F5" stroke-width="3"><circle cx="1280" cy="280" r="180"/><circle cx="1280" cy="280" r="110"/><path d="m1190 370 55-125 125-55-55 125Z" fill="#6269F5"/></g></svg>`;
await writeFile("assets/branding/banner.svg", banner);
await sharp(Buffer.from(banner)).png().toFile("assets/branding/banner.png");
console.log("Layered SVG sources and platform PNG exports generated.");
