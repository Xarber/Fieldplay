# Testing

`npm run check` runs strict TypeScript and all Node tests. The team multiplayer case uses real 60-second timers and sockets, so allow roughly one minute. `npm run test:unit` omits that real-time case for focused follow-ups. Run `npm run web:build` before `npm run test:browser`.

Automated scope: command/state/phase validation; derangements for 2–20 players; circle containment; privacy projection; GPS accuracy/time/speed/provenance; replay/authorization; mutual encounters; team scoring; abilities; idea history/import conflicts; real WebSocket Treasure Hunt plus all three team games; dedicated host disconnect/resume; two real Chromium WebRTC UI clients; results and replay; PWA/offline shell; responsive UI; actual file-based idea export/import and browser persistence.

Synthetic GPS is confined to ephemeral test matches and isolated browser contexts. There are no demo players or simulated movements in the normal app. Transport communication is real, while geographic observations are test fixtures; neither establishes outdoor/device behavior. The deployed-service smoke uses no GPS at all.

## Manual native/device matrix

For each platform test portrait/landscape, safe areas, 200% text, both themes, screen readers, keyboard, reduced motion/transparency, map tap/pan, forms, camera, denial/regrant of permissions, app suspension/termination, exact stop-sharing, low accuracy, stale/offline fixes, LAN/different-network/relay, host loss and resumption. Check the slowest supported hardware's release-mode motion and battery behavior. Verify exported ideas survive upgrades and restore conflicts without silent overwrite.

Native archives/installations, physical GPS, TURN/STUN, packet loss/high latency, battery, independent security review and official-store behavior are separate acceptance gates. Read the current validation report rather than inferring success from this checklist.
