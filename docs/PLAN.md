# Implementation plan

Baseline: empty directory, no existing repository or ideas collection (2026-11-06).

1. Establish independent AGPL-3.0-only Expo/TypeScript monorepo and private Git repository with testing/beta/main.
2. Implement shared validated schemas, geospatial helpers, authoritative rules, visibility projections and four game modes. Acceptance: deterministic tests for transitions, privacy, replay and scoring.
3. Implement authenticated WebSocket signaling/dedicated authority and host-authoritative WebRTC DataChannels. Acceptance: two actual socket clients and two browser peer connections complete a Treasure Hunt, including replay and privacy rejection.
4. Build accessible adaptive game-first mobile/web interface: parties, lobby, arena placement, GPS consent, treasure preparation, objectives, results, history and replay. Add settings, local-first ideas and release history.
5. Prepare branding, PWA shell, self-hosting, CI mobile matrix and release metadata, documentation. Validate production web export and native JavaScript bundles without claiming native device execution.
6. Record evidence and remaining platform, security and outdoor validation. Keep publication disabled until authorized.

Architecture review: authority owns all mutations; all receivers get per-player projections. Dedicated server never exposes secrets in signaling. P2P host is explicitly trusted. WebSocket and WebRTC use the same command contract. Exact positions have bounded retention. No location outside consented active play. No simulated movement in the ordinary app.

Risks: mobile background restrictions; native dependency compatibility; NAT/TURN; malicious hosts; spoofed GPS; unsafe real-world arenas cannot be certified automatically. Fail closed on host loss instead of migrating hidden state.

The original expanded-concept document referenced in the specification was not attached. Unknown variant details will not be invented. Expanded catalogue entries are explicitly planned, not falsely playable.
