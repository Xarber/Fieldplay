# Fieldplay

Turn the world into a game. Independent, private-by-default outdoor multiplayer for iOS, Android and web, from OpenRecode.

**Development status:** implementation in progress, not a published or device-validated release. Fieldplay is a provisional project name; an unrelated app already uses this name. No association is implied.

## Develop

Requires Node.js 24 and npm 11. `npm ci`, then `npm run server` and `npm run dev`. The server defaults to loopback port 8787. Configure a private LAN address for devices. Native WebRTC and MapLibre require a development or release build, not Expo Go.

See [the plan](docs/PLAN.md), [the specification](docs/PROJECT_SPECIFICATION.md) and [agent entry point](AGENTS.md).

## License

Original code © 2026 Fieldplay contributors, licensed AGPL-3.0-only. See [LICENSE](LICENSE). Third-party software and map data retain their licenses.
