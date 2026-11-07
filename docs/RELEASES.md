# Builds and releases

No public publication, store submission, alternative distribution source or paid infrastructure is authorized. Repository visibility stays private. No released native binaries currently exist.

## Branches

Work is integrated into `testing`; deliberate promotion follows `testing → beta → main`. Initial beta/main refs are bootstrap baselines, not product releases. Testing has no automatic full build/release trigger. The manual workflow can validate only, or explicitly request all four native formats. Beta/main pushes trigger parallel platform jobs, then aggregate only successful complete results. Publication remains disabled until a specific destination is authorized.

## Pipeline

`.github/workflows/build.yml` runs strict checks, real socket games, production web export, two-browser WebRTC/PWA/ideas tests and generated native configuration checks. Four independent native jobs are prepared: unsigned physical-device IPA, Apple Silicon simulator `.app.zip`, signed universal release APK and signed release AAB. A failure retains successful artifacts but prevents a complete release candidate.

Native scripts validate expected package structures/architectures, bundled JavaScript and signing where applicable. Artifacts and metadata include version, build, channel and exact commit. `scripts/release-manifest.ts` requires all four formats and matching metadata, calculates SHA-256, and emits an explicitly unpublished release candidate with no invented download URLs. A later authorized publication job must upload the complete set, verify actual URLs, generate a client-compatible manifest and update approved distribution sources.

Native signing secrets are not configured. Required Android names: FIELDPLAY_KEYSTORE_BASE64, FIELDPLAY_STORE_PASSWORD, FIELDPLAY_KEY_ALIAS, FIELDPLAY_KEY_PASSWORD. Supply the approved release identity; scripts never generate a substitute key or distribute Expo's debug signing identity. iOS device IPAs are unsigned and require an external signing workflow before ordinary device installation. Simulator bundles must not be called device IPAs; AABs are not directly installable APKs.

## Versions and changelogs

Application package version is the release version; BUILD_NUMBER, BUILD_COMMIT, BUILD_DATE and RELEASE_CHANNEL identify each build. Developer commit messages/IDs are generated from actual Git history. User highlights are structured separately and must describe only implemented behavior. An initial install records its version silently; a version change can show What's New once. The current history contains only the unreleased 0.1.0 implementation.

The private HTTPS update-manifest endpoint is unset. Its validated schema requires a complete published release, compatible platform/variant, proper stable/beta channel, version/build, commit, highlights/fixes, HTTPS artifact URLs, sizes and checksums. A metadata source identifier such as sources-v1.0 cannot be parsed as an application version. OTA is not configured; native dependencies/entitlements always require a new binary.

AltSources/Obtainium/public download links will be generated only from actual approved releases. No fixed metadata release or public channel is active.

## Verification limit

Native configuration generation and Hermes export are not native compilation, installation or outdoor testing. Follow docs/TESTING.md before beta/stable promotion. For long remote builds, verify submission, report the URL/status and stop actively waiting after the UADS limit; never imply completion.
