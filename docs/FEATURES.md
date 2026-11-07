# Feature inventory

This is a private development implementation, not a completed production/mobile release. See the validation report for actual executed checks.

| Capability | Implemented behavior | Limit |
|---|---|---|
| Identity | Local profile and six-hour scoped server guest sessions | No permanent online accounts or cross-device friend identity |
| Parties | Create, high-entropy code/link/QR invites, roster, host/co-host, readiness, alternating teams, host team assignment, chat, kick/identity ban, replay | Temporary server sessions; local recent-party address book. No persistent server groups, tournaments or public discovery |
| Networking | Real WebRTC host-star DataChannels; authenticated WebSocket signaling and dedicated-authority mode | Same-machine browser communication tested; different networks, TURN and physical native links unverified |
| Arena | Circular boundary, optional polygon and exclusion circles, map tapping, GPS centering, checkpoint placement, durations and presets | Human venue inspection required; no automated road/hazard certification |
| Treasure Hunt | All players register a GPS treasure and clue, random derangement, return check-in, contracting secret-offset circles, QR/code verification plus accurate proximity, points/first-find, results and replay | Virtual treasures still require an owner-provided verification code; no automatic physical object manufacture |
| Manhunt | Hunter/runner teams, delayed approximate opponent pings, shrinking survival circle, mutual capture confirmation, zone-exit grace, team victory | Foreground GPS; no physical capture inferred from GPS |
| Domination | Multiple checkpoints, 3 GPS samples over 5 seconds, four spaced claims, contested checks, ownership, team points, optional rotating active hill | Physical accuracy and battery behavior unverified |
| Smugglers | Hidden courier cargo, pickup/delivery locations, delayed opponent visibility, mutually confirmed interceptions, timed team scoring | No undercover-role/high-value variants yet |
| Abilities | Eight authority-validated abilities, three charges, 15-second effects and 60-second cooldowns | Built-in policies; no general custom ability editor |
| Privacy | Separate consent, stop-sharing, safety pause, end/withdrawal cleanup, bounded live samples, per-view projection | Trusted host/server sees authoritative secrets; GPS spoofing cannot be eliminated |
| Ideas | CRUD, duplication, statuses/history, categories/priorities, search/filter/sort, batch defer/delete, embedded screenshot, JSON/Markdown export, reviewed import with ID deduplication | Explicit exports transfer to the repo; no claim of automatic access to private on-device storage |
| Storage | Native SQLite WAL with versioned key/value schema; web IndexedDB; secure native session store and browser sessionStorage | No server persistence or cloud sync; export important local ideas |
| Updates | Throttled HTTPS manifest checks, stable/beta filtering, release notes, optional Android download, pause/resume/cancel, storage check, APK integrity/signature/version checks and system confirmation | Endpoint not configured and no release artifact exists. Native installer not device-tested. No Play/App Store submission or OTA enabled |
| PWA | Manifest, icons, static-shell worker, offline app shell, explicit update/reload | A communication link is still required for multiplayer. External maps are not cached |
| Developer | Triple-tap version; main-tab/background timeout lock; diagnostic export, ideas, changelog and embedded build info | Latency/packet loss not fabricated; currently reported as unmeasured |
| Branding | Editable layered SVG master, dark/mono/adaptive/PWA assets and repository banner | Provisional name has a known collision; no trademark clearance claimed |

The other fourteen catalogue families are honestly labeled planned. The original expanded game-concept document mentioned in the request was not attached; its unspecified mechanics have not been invented.
