// SPDX-License-Identifier: AGPL-3.0-only
import { createHmac } from "node:crypto";
import { makeServer } from "./server";
const iceServers = JSON.parse(process.env.ICE_SERVERS ?? "[]");
const service = makeServer({
  port: Number(process.env.PORT ?? 8787),
  host: process.env.HOST ?? "127.0.0.1",
  origins: process.env.ALLOWED_ORIGINS?.split(","),
  iceServers,
  webRoot: process.env.WEB_ROOT,
  getIceServers: (id) => {
    if (!process.env.TURN_SECRET || !process.env.TURN_URLS) return iceServers;
    const username = `${Math.floor(Date.now() / 1000) + 6 * 3600}:${id}`;
    const credential = createHmac("sha1", process.env.TURN_SECRET)
      .update(username)
      .digest("base64");
    return [
      ...iceServers,
      { urls: process.env.TURN_URLS.split(","), username, credential },
    ];
  },
});
console.log(
  `Fieldplay private authority/signaling listening on ${await service.listen()}. No location histories are written to disk.`,
);
for (const s of ["SIGTERM", "SIGINT"] as const)
  process.on(s, () => {
    void service.close().then(() => process.exit(0));
  });
