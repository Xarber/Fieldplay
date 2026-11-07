# Validation report — 2026-11-07

## Scope

New Fieldplay workspace only: shared engine/rule modules, privacy projections, WebSocket server, WebRTC client, Expo UI/platform adapters, local ideas, PWA/landing, native configuration generation, Android update module source and build/self-hosting configuration. No Pathway files or unrelated repositories were modified. This is not a full independent application/security audit or a completed native/public release.

## Executed evidence

- Strict TypeScript passed after the section-36 UI refinement and runtime configuration fixes.
- 24 focused tests passed: assignments, geometry, GPS validation, authority/security, interactions, abilities, ideas, full real WebSocket Treasure Hunt, guest privilege rejection, expired sessions and dedicated host disconnect/resume.
- Three additional team-mode scenarios passed concurrently over real sockets and 60-second authority timers: Manhunt, Domination and Smugglers, with synchronized final score/victory and sharing cleanup.
- Two separate Chromium UI clients completed a real host-authoritative WebRTC Treasure Hunt, including invitations, consent, registration, assignment, verified discovery, synchronized scores/results and replay.
- Production PWA manifest/service worker, offline cold reload, 390px layout and real idea JSON download/import with reviewed conflict preservation passed in Chromium. An actual idea survived browser reload in IndexedDB.
- Native iOS/Android project generation succeeded without installing SDKs; the Android local installer module was present in autolinking output. Generated privacy configuration removes unnecessary audio/overlay/Bluetooth permissions.
- iOS and Android Hermes JavaScript export succeeded earlier in the implementation. This is not native compilation or launch evidence; final exports must include the last UI/storage/motion batch.
- Desktop/mobile screenshots were inspected; a clipped mobile hero title was found and corrected. The final landing/service-check, narrow layout, light-theme and reduced-motion browser pass succeeded without page errors.
- X-Center was inspected read-only: reachable existing Docker host, no existing Fieldplay app directory, free intended loopback port. Existing services were not restarted or reconfigured.

All game GPS inputs above are explicitly synthetic test fixtures in isolated ephemeral sessions. Actual transport communication is real. These tests do not establish real outdoor GPS accuracy, physical tagging, native peer networking, STUN or TURN.

## Issues found and addressed

- MapLibre v11/v6 API mismatches: fixed native event access and GL JS named exports.
- Independent location consent after rules changes: configuration now resets sharing/readiness.
- Match end/withdrawal cleanup and immediate local stop: watchers and temporary sensitive state are cleared.
- Fixed-offset discovery center extrapolation: each normal/scanner stage now uses independent secret offsets.
- Peer connection loss now stops local sharing and pauses safely.
- Expo 58 extra-field serialization could turn unset null values into objects: normalized the build date and update endpoint before rendering/use.
- Version comparison now uses the installed semantic-version implementation and also requires a newer compatible build; stable/beta/platform/variant cases are tested.
- SVG MIME and light-hero badge contrast were corrected after visual inspection. White primary-button labels now have 5.26:1 contrast while brand accents retain #6269F5.
- Native release signing is fail-closed when no approved Android key exists; no debug-signed release substitute.
- Mobile header overflow and reduced-motion/transparency fallbacks were included in the UI refinement.

## Unavailable / not claimed

This Mac exposes only Command Line Tools, no full Xcode, Android SDK, simulator/emulator or Docker. No local SDKs were installed. No physical iPhone/Android test, native IPA/APK/AAB compilation, real APK update, external-network relay, battery profiling, independent security audit, public release, store submission or public deployment has succeeded here.

The native WebRTC config-plugin's documented tested matrix trails the installed SDK 58 integration. Native builds must settle compatibility. The wider specification's unimplemented families/features remain explicitly listed in ROADMAP.md.

Build-tool dependency auditing currently reports moderate advisories involving Expo CLI/fingerprint glob/minimatch dependencies. A forced SDK downgrade was not applied. Runtime server/engine use a separate bundled dependency set; do not infer a complete vulnerability clearance from that separation.

## Git / publication

Repository remains private at Xarber/Fieldplay. Work is on testing. Initial beta/main branches remain bootstrap baselines. Hardware-backed signing was unavailable, so development commits are unsigned; the configured key/history are preserved. No history rewrite or force-push is authorized.

The four native GitHub jobs and unpublished complete-artifact manifest are prepared. Native signing secrets are absent. Build/release and X-Center deployment outcomes must be recorded as actual observations, not inferred from these files.
