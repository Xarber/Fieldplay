# Remaining acceptance work

This roadmap preserves the wider specification without presenting unfinished features as complete.

## Essential before a native/public release

1. Build all four native artifacts with the approved Android signing identity; resolve any SDK 58/WebRTC/MapLibre/native-module compatibility failures.
2. Install on physical iOS and Android devices. Complete an outdoor Treasure Hunt and verify background/foreground safety pauses, real GPS uncertainty, reconnection, map loading, QR scanning, permissions, data persistence, battery and accessibility.
3. Verify different-network WebRTC, owned STUN, TURN and relay-only mode; measure real latency and disconnect behavior.
4. Complete the Docker/X-Center staged deployment checks and record actual commit/health/handshake evidence. Preserve unrelated infrastructure.
5. Exercise Android self-update with real old/new same-key packages, wrong checksum/signature/build rejection, network interruption, cancellation, system permission denial and actual install results. Validate iOS's authorized signing/update path.
6. Review the name collision, dependency/native-binary/asset licenses and AGPL source availability for the intended audience; obtain explicit public/store/channel authorization.
7. Resolve build-tool audit findings without blindly downgrading/upgrading the SDK; keep the exact tested package lock.

## Functional specification still to implement

- Persistent server accounts/friend groups, tournaments and invitation revocation/rotation.
- General event zones, moving objectives, seven fully configurable visibility policies, custom roles/abilities/scoring editor beyond the validated built-in settings.
- The remaining fourteen game families and their distinct variants. Obtain the missing original detailed concept document rather than inventing its requirements.
- Local mDNS discovery, secret-preserving server recovery, deliberate host migration design, advanced anti-cheat and optional voice chat.
- Approved bidirectional idea synchronization, richer diagnostics and store-specific build/update variants.
- Compatible OTA delivery only if deliberately configured; no native changes through OTA.

## Recommendations

Keep the tested four-mode slice usable and improve the above in bounded batches. Prefer native field evidence over additional catalogue screens. Do not add an unrelated plugin marketplace, cloud provider, public player search or tracking service merely to satisfy a checklist.
