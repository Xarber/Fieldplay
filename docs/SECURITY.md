# Security and privacy

## Scope and trust

Private invitations are 128-bit bearer capabilities. Keep codes/QRs out of public screenshots and chat rooms. Guest session credentials are random, expire after six hours and are compared through server-side SHA-256 digests. A guest identity is not a verified person: an identity ban cannot prevent a person from obtaining another invitation and creating a new guest identity.

The player host or dedicated authority is trusted with precise GPS and secret objectives. Guests receive projections only. In P2P mode a malicious host can cheat; for competitive hidden-information games use a trusted dedicated server. Direct peers may learn network addresses; relay-only connectivity requires a configured TURN service. GPS spoofing on an untrusted client cannot be completely prevented.

## Enforcement

- Bounded Zod schemas reject unknown commands, invalid coordinates, unsupported configuration and oversized text. Presets are data, never executable code.
- Socket identity supplies the actor; clients cannot submit another actor or award points.
- Command IDs deduplicate accepted actions in a bounded window. Objective codes and encounter confirmations are consumed and phase-scoped.
- Capture requires recent accurate proximity plus the target's explicit confirmation. GPS alone never counts as physical contact.
- Treasures require location/arena checks and secret code verification; assignment and location authorization happen before transmission.
- Discovery circles have independent hidden offsets for each stage and scanner view; a fixed linear center/radius relationship is not used.
- Accuracy and timestamps are preserved. Stale, future, out-of-order, imprecise or implausibly fast samples do not replace valid samples.
- Configuration changes require fresh consent and readiness; finish/withdrawal revoke sharing and clear temporary secrets.
- Server/peer packet sizes and message rates are limited. Origin allowlists supplement invitation/session authentication. Do not expose an unreviewed private build to the public internet.
- Native credentials use SecureStore; browser credentials use sessionStorage. Browser same-origin script integrity remains part of the trust boundary.

## Location lifecycle

Foreground permission is requested only after explicit game sharing consent or a local arena-center action. Joining alone never starts GPS. No background-location permission or Android location service is enabled. A backgrounded active match pauses, and local watchers stop. The stop-sharing control removes its local watcher immediately, before a round-trip acknowledgement. Terminal results contain no movement trail.

Map tiles are a separate external data provider; tile requests reveal a map area to that provider. There are no ads or analytics trackers. Do not infer that a map certifies venue safety. Private service logs omit tokens and coordinates.

## APK updates

The Android local module accepts only a downloaded cache file, checks the published SHA-256, same package identifier, strictly newer expected build and exact current signing certificate set. PackageInstaller performs the OS installation and user confirmation; no prompt is bypassed. Permission settings and installation result are reported separately from download completion. Play-owned installs are rejected by this sideload path. Signing-key rotation, Play In-App Updates and official-store variants require a separate deliberately validated integration.

The HTTPS manifest is a trust anchor and is unset in this private development build. No long-lived GitHub token is embedded. No release or artifact URLs are fabricated. Pause/resume applies while the download task/runtime survives; process-termination restoration is not yet implemented.

## Audit limits

The implementation has focused automated security cases, not an independent full audit. Native dependency licenses/binaries, OS permissions, physical GPS, APK installation, TURN and deployment access controls must be reviewed before wider distribution. Build-tool transitive dependency advisories are tracked in the validation report; never use a forced SDK downgrade as an unreviewed audit fix.

Report vulnerabilities privately to the repository owner. Do not post location traces, invite codes or credentials in public issues.
