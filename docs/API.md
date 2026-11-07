# Contracts

The authoritative TypeScript/Zod definitions live in `packages/engine/src/schema.ts`. Limit examples are normative only when they agree with the schemas.

## Server

`GET /health` returns `{ok,version,commit,rooms}` with no-store caching. It contains no invite, token, coordinates or player names.

Open a WebSocket and send within ten seconds:

```json
{"type":"hello","operation":"create","name":"Ada","partyName":"Weekend explorers","authority":"peer"}
```

`join` requires the 32-hex-character invite `code`; `resume` additionally requires the server-generated session `token`. The welcome message includes the authenticated member ID, token (only on creation), invite code, authority type, host ID, ICE servers and credential expiry. Roster messages contain only member IDs, display names and connection flags. All session credentials expire after six hours. Rooms expire after two idle hours or six hours total.

Dedicated mode accepts `{type:'command', envelope:{id,command}}`; identity comes from the authenticated socket, never a supplied actor ID. It sends `{type:'state',view}` using `project(match,memberId)` separately for each member. Errors contain concise sanitized messages.

P2P mode accepts signaling `{type:'signal',to,data:{description|candidate}}` only between a guest and the authenticated host. The host may send a boolean joinable status and member-removal request. No full game state is relayed by the signaling service. Joining a running match is locked; authenticated members may resume.

Limits: 32 KB packets, 20 participants, 100 live rooms, 40 messages/member/second and bounded connection attempts. An explicit origin allowlist can reject unknown browser origins; native sockets may have no Origin header. WSS/TLS and a trusted private deployment are required outside loopback.

## Engine commands

- Lobby: configure, consent, ready, team, cohost, treasure, start.
- Location: sample with latitude/longitude, accuracy in meters, observation timestamp and explicit provenance.
- Treasure: returned, verify.
- Encounters: capture, confirm.
- Territory/cargo: claim, pickup, deliver.
- Abilities: ability (built-in identifier).
- Lifecycle: pause, resume, end, replay, leave.
- Community/integrity: chat, report, kick.

Host-only and phase constraints are checked inside the authority. GPS proximity plus explicit QR/code or mutual confirmation validates interactions. No score-award command exists. Arbitrary code, unknown modes or free-form abilities are rejected.

WebRTC carries the same command envelope and filtered state/error packets over an ordered DataChannel. Transport callbacks expose views, connection status, errors and secure credentials. Closing the client releases channels, peer connections, socket and authority clock.
