# Private X-Center deployment — 2026-11-07

## Deployed result

Fieldplay is running privately on X-Center in container `fieldplay-private`, Compose project `fieldplay-private`, bound only to `127.0.0.1:18787`. The app is `/`, the separate landing is `/welcome/`. Access requires a trusted SSH tunnel as described in [self-hosting](../SELF_HOSTING.md); this is not a public deployment.

| Item | Verified value |
|---|---|
| Source commit | `34e6ca3d0d7eb87ecc170d83828eecc9689cbdca` |
| App version / build / channel | `0.1.0` / `1` / `testing` |
| Tagged image | `fieldplay:34e6ca3d0d7eb87ecc170d83828eecc9689cbdca` |
| Image ID | `sha256:600b37e5c7a8c893c0e5859bc4d76f7b699425d4169c68af1a4188e98b754d2d` |
| Server bundle SHA-256 | `e744e37bfbf2735e0dcda811ba0671c33c542176f121b4f28c58cb6c67a823be` |
| Served source archive SHA-256 | `faa1587187ef7751c9aa37c64a5993ac27cc153b5dbaf2b9e6ff2a148fe23f89` |
| Release directory | `/srv/xcenter/apps/fieldplay/releases/34e6ca3d0d7eb87ecc170d83828eecc9689cbdca/` |

The image uses Node 24 without changing the host Node installation. It runs without root, with a read-only filesystem, temporary writable storage, dropped capabilities and limits of 256 MB, 0.5 CPU and 128 processes. Existing Docker was reused; no major toolchain was installed.

## Actual verification

- A candidate was staged on separate loopback port 18788 and tested before starting the final service.
- The deployed health response matched the intended commit; the running server bundle and downloadable original-source archive matched their SHA-256 values.
- Production app, landing, PWA assets and SVG content type were served successfully.
- Two authenticated clients used real network connections through the tunnel: handshake, chat synchronization, readiness/start, guest safety pause, host end and sharing cleanup all passed. No location was collected or transmitted by this deployment smoke test.
- All 14 pre-existing containers retained their IDs and start times. No unrelated container, reverse proxy, DNS, firewall or host Node configuration was changed.
- The staging container and local test server/tunnel were removed after successful verification. The private application service remains running. Approximately 3.4 GB of host disk space remained after image construction.

Local evidence is in `artifacts/xcenter-deployment-smoke.json`, `artifacts/xcenter-services-before.txt` and `artifacts/xcenter-services-after.txt`; generated artifacts are not committed. This report records their verified results. Documentation-only commits after the deployed commit do not imply a different running application version.

## Recovery and limits

This was the first Fieldplay installation, so there is no previous Fieldplay runtime to restore. The immutable tagged image, release payload and source archive are retained for reproducibility. To withdraw this installation, stop only the `fieldplay-private` Compose service; do not remove unrelated services or data. Future updates must retain this working image and stage their replacement first.

Games/sessions remain in memory and do not survive a server restart. No public hostname, TLS endpoint, TURN relay, native package, GitHub release or store distribution was activated. Browser smoke success does not establish physical-device GPS, native networking or outdoor game correctness.
