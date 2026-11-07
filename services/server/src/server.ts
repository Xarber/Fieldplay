// SPDX-License-Identifier: AGPL-3.0-only
import { createServer, type Server } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import {
  addPlayer,
  apply,
  createMatch,
  disconnect,
  envelopeSchema,
  project,
  tick,
  type Match,
} from "@fieldplay/engine";
const helloSchema = z.object({
  type: z.literal("hello"),
  operation: z.enum(["create", "join", "resume"]),
  name: z.string().trim().min(1).max(32),
  code: z.string().max(80).optional(),
  token: z.string().max(100).optional(),
  authority: z.enum(["peer", "dedicated"]).default("peer"),
  partyName: z.string().trim().min(1).max(60).default("Weekend explorers"),
});
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const secret = () => randomBytes(16).toString("hex");
type Session = {
  id: string;
  name: string;
  digest: string;
  expires: number;
  socket?: WebSocket;
  window: number;
  count: number;
};
type Room = {
  code: string;
  authority: "peer" | "dedicated";
  hostId: string;
  members: Map<string, Session>;
  state?: Match;
  createdAt: number;
  lastActivity: number;
  joinable: boolean;
};
export function makeServer(
  options: {
    port?: number;
    host?: string;
    origins?: string[];
    iceServers?: unknown[];
    getIceServers?: (id: string) => unknown[];
    webRoot?: string;
    allowInsecure?: boolean;
  } = {},
) {
  const connections = new Map<string, { at: number; count: number }>();
  const rooms = new Map<string, Room>();
  const peers = new Map<WebSocket, { room: Room; session: Session }>();
  const server: Server = createServer(async (req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(
        JSON.stringify({
          ok: true,
          version: "0.1.0",
          commit: process.env.BUILD_COMMIT ?? "development",
          rooms: rooms.size,
        }),
      );
    } else if (options.webRoot && req.method === "GET") {
      try {
        const root = resolve(options.webRoot);
        const pathname = decodeURIComponent(
          new URL(req.url ?? "/", "http://localhost").pathname,
        );
        let file = resolve(root, "." + pathname);
        if (file !== root && !file.startsWith(root + sep)) {
          res.writeHead(403);
          res.end();
          return;
        }
        try {
          if ((await stat(file)).isDirectory())
            file = resolve(file, "index.html");
        } catch {
          if (extname(file)) throw new Error("Not found");
          file = resolve(root, "index.html");
        }
        const types: Record<string, string> = {
          ".html": "text/html",
          ".js": "application/javascript",
          ".css": "text/css",
          ".webmanifest": "application/manifest+json",
          ".png": "image/png",
          ".svg": "image/svg+xml",
          ".ttf": "font/ttf",
          ".ico": "image/x-icon",
          ".gz": "application/gzip",
        };
        const body = await readFile(file);
        res.writeHead(200, {
          "Content-Type": types[extname(file)] ?? "application/octet-stream",
          "Cache-Control":
            file.endsWith("index.html") || file.endsWith("sw.js")
              ? "no-cache"
              : "private,max-age=3600",
          "Service-Worker-Allowed": "/",
        });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end();
      }
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  const wss = new WebSocketServer({ server, maxPayload: 32768 });
  const send = (ws: WebSocket | undefined, data: unknown) => {
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
  };
  function broadcast(room: Room) {
    for (const s of room.members.values()) {
      if (room.state && room.state.players[s.id]?.connected) {
        try {
          send(s.socket, { type: "state", view: project(room.state, s.id) });
        } catch {
          /* removed */
        }
      }
    }
  }
  function roster(room: Room) {
    for (const s of room.members.values())
      send(s.socket, {
        type: "roster",
        members: [...room.members.values()].map((s) => ({
          id: s.id,
          name: s.name,
          connected: s.socket?.readyState === WebSocket.OPEN,
        })),
        hostId: room.hostId,
      });
  }
  wss.on("connection", (ws, req) => {
    const address = req.socket.remoteAddress ?? "unknown";
    const rate = connections.get(address);
    if (rate && Date.now() - rate.at < 60000) {
      if (++rate.count > 30) {
        ws.close(1008, "Connection rate limit");
        return;
      }
    } else {
      if (connections.size > 1000) connections.clear();
      connections.set(address, { at: Date.now(), count: 1 });
    }

    // With explicit origins configured, reject unknown browser origins before any credentials.
    if (
      options.origins?.length &&
      req.headers.origin &&
      !options.origins.includes(req.headers.origin)
    ) {
      ws.close(1008, "Origin not allowed");
      return;
    }
    let initialCount = 0;
    const deadline = setTimeout(() => {
      if (!peers.has(ws)) ws.close(1008, "Handshake timeout");
    }, 10000);
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        let peer = peers.get(ws);
        if (!peer) {
          if (++initialCount > 2) throw new Error("Too many handshakes.");
          const h = helloSchema.parse(msg);
          let room: Room | undefined;
          let session: Session;
          let token: string | undefined;
          if (h.operation === "create") {
            if (rooms.size >= 100)
              throw new Error("Server room limit reached.");
            const id = secret();
            token = secret();
            session = {
              id,
              name: h.name,
              digest: hash(token),
              expires: Date.now() + 6 * 3600000,
              window: Date.now(),
              count: 0,
              socket: ws,
            };
            room = {
              code: secret(),
              authority: h.authority,
              hostId: id,
              members: new Map([[id, session]]),
              createdAt: Date.now(),
              lastActivity: Date.now(),
              joinable: true,
            };
            if (room.authority === "dedicated")
              room.state = createMatch({ id, name: h.name }, h.partyName);
            rooms.set(room.code, room);
          } else {
            room = rooms.get(h.code ?? "");
            if (!room || Date.now() - room.createdAt > 6 * 3600000)
              throw new Error("Invite is invalid or expired.");
            if (h.operation === "resume") {
              const digest = hash(h.token ?? "");
              const existing = [...room.members.values()].find(
                (s) =>
                  timingSafeEqual(Buffer.from(s.digest), Buffer.from(digest)) &&
                  s.expires > Date.now(),
              );
              if (!existing) throw new Error("Session expired. Join again.");
              session = existing;
              session.socket?.close(4000, "Reconnected elsewhere");
              session.socket = ws;
              if (room.state)
                room.state = addPlayer(room.state, {
                  id: session.id,
                  name: session.name,
                });
            } else {
              if (!room.joinable)
                throw new Error(
                  "This match has started. Ask the host to finish and reopen the lobby.",
                );
              if (room.members.size >= 20) throw new Error("Party is full.");
              if (
                room.authority === "peer" &&
                !room.members.get(room.hostId)?.socket
              )
                throw new Error("Host is offline.");
              token = secret();
              session = {
                id: secret(),
                name: h.name,
                digest: hash(token),
                expires: Date.now() + 6 * 3600000,
                window: Date.now(),
                count: 0,
                socket: ws,
              };
              if (room.state)
                room.state = addPlayer(room.state, {
                  id: session.id,
                  name: h.name,
                });
              room.members.set(session.id, session);
            }
          }
          peer = { room, session };
          peers.set(ws, peer);
          clearTimeout(deadline);
          room.lastActivity = Date.now();
          send(ws, {
            type: "welcome",
            id: session.id,
            token,
            code: room.code,
            authority: room.authority,
            hostId: room.hostId,
            partyName: h.partyName,
            iceServers:
              options.getIceServers?.(session.id) ?? options.iceServers ?? [],
            expires: session.expires,
          });
          roster(room);
          broadcast(room);
          return;
        }
        const { room, session } = peer;
        if (session.expires < Date.now()) throw new Error("Session expired.");
        const now = Date.now();
        if (now - session.window >= 1000) {
          session.window = now;
          session.count = 0;
        }
        if (++session.count > 40) throw new Error("Slow down.");
        room.lastActivity = now;
        if (room.state) {
          if (msg.type !== "command")
            throw new Error("Expected a game command.");
          const e = envelopeSchema.parse(msg.envelope);
          room.state = apply(room.state, session.id, e.id, e.command);
          room.joinable = room.state.phase === "lobby";
          if (e.command.type === "kick") {
            const removed = room.members.get(e.command.playerId);
            removed?.socket?.close(4003, "Removed by host");
            room.members.delete(e.command.playerId);
          }
          broadcast(room);
          if (e.command.type === "leave") {
            session.socket = undefined;
            ws.close(1000, "Left party");
          }
          return;
        }
        if (
          msg.type === "status" &&
          session.id === room.hostId &&
          typeof msg.joinable === "boolean"
        ) {
          room.joinable = msg.joinable;
          return;
        }
        if (msg.type === "signal") {
          const packet = z
            .object({
              type: z.literal("signal"),
              to: z.string().max(80),
              data: z.union([
                z.object({
                  description: z.object({
                    type: z.enum(["offer", "answer"]),
                    sdp: z.string().max(24000),
                  }),
                }),
                z.object({ candidate: z.record(z.string(), z.unknown()) }),
              ]),
            })
            .parse(msg);
          if (session.id !== room.hostId && packet.to !== room.hostId)
            throw new Error("Only host connections are allowed.");
          const target = room.members.get(packet.to);
          if (!target) throw new Error("Unknown peer.");
          send(target.socket, {
            type: "signal",
            from: session.id,
            data: packet.data,
          });
        } else if (msg.type === "remove" && session.id === room.hostId) {
          const target = room.members.get(msg.playerId);
          if (target && target.id !== room.hostId) {
            target.socket?.close(4003, "Removed by host");
            room.members.delete(target.id);
            roster(room);
          }
        } else throw new Error("Unsupported message.");
      } catch (e) {
        send(ws, {
          type: "error",
          message:
            e instanceof z.ZodError
              ? "Invalid message format."
              : e instanceof Error
                ? e.message
                : "Request rejected.",
        });
      }
    });
    ws.on("close", () => {
      clearTimeout(deadline);
      const p = peers.get(ws);
      if (!p) return;
      peers.delete(ws);
      if (p.session.socket !== ws) return;
      p.session.socket = undefined;
      if (p.room.state) {
        p.room.state = disconnect(p.room.state, p.session.id);
        broadcast(p.room);
      }
      roster(p.room);
    });
    ws.on("error", () => {
      /* close handles cleanup; never log tokens */
    });
  });
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      if (
        now - room.lastActivity > 2 * 3600000 ||
        now - room.createdAt > 6 * 3600000
      ) {
        for (const s of room.members.values())
          s.socket?.close(1000, "Party expired");
        rooms.delete(code);
        continue;
      }
      if (room.state?.phase === "active") {
        room.state = tick(room.state, now);
        broadcast(room);
      }
    }
  }, 1000);
  timer.unref();
  return {
    server,
    rooms,
    listen: () =>
      new Promise<number>((resolve) =>
        server.listen(options.port ?? 8787, options.host ?? "127.0.0.1", () =>
          resolve((server.address() as { port: number }).port),
        ),
      ),
    close: async () => {
      clearInterval(timer);
      for (const ws of wss.clients) ws.close();
      await new Promise<void>((r) => wss.close(() => r()));
      await new Promise<void>((r) => server.close(() => r()));
    },
  };
}
