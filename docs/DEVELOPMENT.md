# Development

Use Node.js 24 and npm 11. The lockfile is committed. From the repository root:

```sh
npm ci
npm run check
npm run server
```

In another terminal run `npm run dev`, or `npm run web:build` followed by `npm run preview`. Expo development uses port 8091; the authority/signaling defaults to `127.0.0.1:8787`. In the connection form specify `ws://localhost:8787` when using separate local preview and server processes. The single self-hosted service serves app and signaling on the same origin; its web client defaults to that origin.

Native projects are generated, not hand-maintained: `cd apps/mobile && npx expo prebuild --no-install`. Do not edit ignored native projects to implement durable changes; use config plugins/local Expo modules. Native WebRTC, MapLibre and the Android installer require a development/release binary. Expo Go is insufficient. No local SDK, emulator or Xcode installation is authorized by this project setup.

## Commands

- `npm run typecheck`: strict TypeScript; first generates real Git commit metadata for the developer changelog.
- `npm run test:unit`: focused engine, ideas, security and real WebSocket tests.
- `npm run test:team`: real 60-second concurrent multiplayer matches for the other three modes.
- `npm test`: all tests, approximately one minute.
- `npm run test:browser`: production export plus two-client WebRTC UI, PWA/offline and idea transfer; uses existing Chrome. Set `CHROME_PATH` if necessary.
- `npm run branding`: reproducible vector-master platform exports using the installed image library.
- `npm run format`: source formatting, never a substitute for behavior tests.

## Versions and compatibility

The installed versions are pinned by package-lock: Expo 58.0.23, React Native 0.88.1, React 19.3.0, MapLibre React Native 11.5.1, MapLibre GL JS 6.16.0, native WebRTC 155.0.1, and SDK-matched Reanimated/Worklets/SQLite/Location packages. Run `npx expo install --check` from `apps/mobile` before integration changes.

MapLibre v11 uses `Map`, `Camera`, `GeoJSONSource`, `Layer` and `nativeEvent.lngLat`, with paint/layout properties. GL JS v6 has named exports. Old examples using a default export or earlier native component names do not match these versions.

The installed WebRTC config-plugin documentation lists its tested SDK matrix only through SDK 56 / plugin 15. Its current config generation succeeds on SDK 58, but that is not binary compatibility proof for WebRTC 155. Device/native builds must validate this combination before promotion. Data-only use explicitly removes unnecessary microphone, audio settings, overlay and Bluetooth permissions. Camera remains for opt-in QR scanning.

## Workflow

Develop on testing or an isolated temporary branch. Conventional Commits; never promote directly around testing. Beta/main builds are intended only after deliberate promotion. The initial beta/main branches contain the bootstrap baseline, not an advertised release.

Read docs/IDEAS.json at the start of substantial work. There are no outstanding ideas in the initial repository collection. Device-local ideas require an actual export/import path. Keep docs and validation report accurate.
