// SPDX-License-Identifier: AGPL-3.0-only
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
export async function serveStatic(directory: string, port = 0) {
  const root = resolve(directory);
  const types: Record<string, string> = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".webmanifest": "application/manifest+json",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".ttf": "font/ttf",
    ".svg": "image/svg+xml",
  };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const path = resolve(root, "." + decodeURIComponent(url.pathname));
      if (path !== root && !path.startsWith(root + sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      let file = path;
      try {
        if ((await stat(file)).isDirectory())
          file = resolve(file, "index.html");
      } catch {
        if (extname(file)) throw new Error("Not found");
        file = resolve(root, "index.html");
      }
      const body = await readFile(file);
      res.writeHead(200, {
        "Content-Type": types[extname(file)] ?? "application/octet-stream",
        "Cache-Control":
          file.endsWith("sw.js") || file.endsWith("index.html")
            ? "no-cache"
            : "public,max-age=3600",
        "Service-Worker-Allowed": "/",
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise<void>((r) => server.listen(port, "127.0.0.1", r));
  return {
    port: (server.address() as { port: number }).port,
    server,
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}
if (process.argv[1]?.endsWith("static-server.ts")) {
  const s = await serveStatic(
    "apps/mobile/dist",
    Number(process.env.WEB_PORT ?? 8091),
  );
  console.log(`Fieldplay private local preview: http://localhost:${s.port}`);
}
