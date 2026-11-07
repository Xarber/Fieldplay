# Self-hosting on X-Center

X-Center is the mandatory default target. Do not move Fieldplay to a third-party host merely for convenience. The server is an independent service; it does not depend on Pathway or an existing game platform.

## Private deployment

`deploy/xcenter.compose.yaml` defines a single bounded, read-only container with a loopback-only `127.0.0.1:18787` endpoint. This deliberately does not edit existing Nginx/Caddy/firewall/DNS, register public hostnames, or restart unrelated containers. Reach it through a trusted SSH tunnel. For example, with your configured X-Center host:

```sh
ssh -N -L 18787:127.0.0.1:18787 YOUR_XCENTER_HOST
```

Then open `http://localhost:18787/welcome/` or the app at `http://localhost:18787/`. The tunnel provides authenticated encrypted transport, and browsers permit location/WebRTC on localhost. Each remote device needs an appropriate trusted access route; no public mobile access is implied by this loopback deployment.

The runtime payload includes compiled server, the production PWA/landing, LICENSE, an original-source archive and a source commit identifier. The original ideas collection is deliberately excluded from distributable source archives because it can contain private feedback rather than program source. Node runs as an unprivileged container user. Host Node 18 is not upgraded or used for this Node 24 service.

## Full build / optional TLS and relay

`compose.yaml` and `deploy/Dockerfile` can build source in an isolated Node 24 image. `npm ci` uses the committed lockfile. Copy `.env.example` to a private `.env`; never commit secrets. Defaults remain loopback-only.

The optional `tls` profile is for a separately authorized isolated HTTPS endpoint. Existing X-Center reverse proxies must be inspected and reused appropriately before activating any new exposure. A public domain/profile is not authorized by this repository's private setup.

The optional `turn` profile requires a random `TURN_SECRET`, correct external IP and your own ICE URLs. It fails closed without a secret, uses short-lived session-bound HMAC credentials, allocation quotas and denied local/metadata peer ranges. The sample UDP/TCP relay lacks TURN-over-TLS; configure certificate-backed `turns:` when required by your networking/security policy. No relay ports are opened by default. TURN functionality is prepared, not field-validated.

## Health, validation and rollback

The image health check uses `/health`. Verify its exact commit, then the landing/app/PWA assets and an actual two-client service handshake with `scripts/deployment-smoke.ts`. A successful image build alone is insufficient.

Before replacing an existing Fieldplay image, record the running image ID, immutable source commit and Compose file. Stage on a free loopback port and validate. Keep the previous tagged image and release directory. Promote only the Fieldplay service and rerun the handshake. If validation fails, restore the previous image and service configuration; do not restart unrelated services.

Sessions and active games intentionally live in memory. A restart pauses/disconnects clients and requires a new party; it is not crash-resumable server persistence. Important device ideas/presets should be exported using the app. Back up only app-specific configuration/source artifacts and user-authorized local exports; never collect movement histories as a backup shortcut.

No PostgreSQL/Redis service is provisioned merely because it appeared in the preferred stack. Durable server accounts/groups and secret-preserving recovery require the future data design in ROADMAP.md.
