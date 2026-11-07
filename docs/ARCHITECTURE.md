# Architecture

The npm workspace shares strict TypeScript contracts across an Expo client, an authoritative engine and a self-hosted Node server. No Pathway code or services are required.

## Modules

- `packages/engine/src/schema.ts`: bounded Zod command, arena, GPS and preset schemas; four built-in mode descriptors.
- `model.ts`, `state.ts`, `random.ts`: authority-only state, safe terminal cleanup and CSPRNG identifiers/secret offsets.
- `index.ts`: membership, configuration, readiness, phase transitions, clocks and command routing.
- `geo.ts`: spherical distance, polygon membership, exclusions, discovery and survival zones, accuracy-aware proximity.
- `rules/treasure.ts`: registration, return check-in, one-to-one assignments and verified finds.
- `rules/encounters.ts`: proximity plus target confirmation for Manhunt/cargo interception. GPS is never physical-tag proof.
- `rules/territory.ts`: multiple-sample checkpoint claims and contested presence.
- `rules/cargo.ts`: courier pickup/delivery and team scoring.
- `rules/abilities.ts`: authority-validated charges, effects, expiry and cooldowns.
- `visibility.ts`: per-receiver projections. Secret coordinates, QR tokens, other assignments and cargo ownership never enter unauthorized packets.
- `ideas.ts`: versioned offline idea interchange, history and explicit conflict review.
- `packages/transport`: a shared client for WebSocket authority or host-authoritative WebRTC star topology.
- `services/server`: ephemeral guest authentication, high-entropy invites, bounded/rate-limited signaling, roster, dedicated authority and health endpoint.
- `apps/mobile/src/hooks`: location consent/lifecycle, session recovery and developer access.
- `screens`: home/catalogue, party, arena editor, profile and ideas. Platform map, RTC, storage and update adapters keep native details outside gameplay.
- `apps/mobile/modules/fieldplay-installer`: Android-only Expo module verifying APK checksum, package, build and signing identity before PackageInstaller user confirmation.

## Authority and privacy

Only one authority mutates a match: the trusted player host or the dedicated server. A command is schema-validated, authorized and applied to a cloned state. Rejected commands leave the original state intact. The authority generates all IDs, codes, scores and random assignments. Every receiver gets its own projection, never a full state snapshot.

P2P uses authenticated server-introduced host/member identities and encrypted WebRTC DataChannels. The server does not receive P2P game snapshots. Host trust is explicit; it is not a defense against a malicious host. Match migration is intentionally fail-closed: loss of a participant pauses the game; loss of host memory requires a fresh party rather than exposing secret state to an elected successor.

## State/lifecycle

`lobby → return → active → finished → lobby` for Treasure Hunt. Team games skip `return`. Any running phase can enter `paused`; only a host resumes after all participants reconnect and consent. A rules change clears readiness, consent and treasure registration. Withdrawal or a roster change ends a running match safely. Finish clears GPS samples, consent, treasure coordinates/codes and interactions. Results contain names and scores, never movement trails.

All external actions use validated data. Imported presets execute no code. There is no third-party plugin runtime or marketplace. See the explicit extension boundary and roadmap.
