# Fieldplay agent entry point

Independent OpenRecode project. Never modify Pathway. AGPL-3.0-only. Read docs/INDEX.md and docs/PROJECT_SPECIFICATION.md; user UADS apply. Work on testing or isolated temporary branches. Promotion testing → beta → main. Conventional Commits. No public deployment, publication, or paid infrastructure authorized.

At the start of substantial work read docs/IDEAS.json. Count pending, approved and deferred ideas; compare to the current feature. Offer relevant unrelated ideas once for now/later; do not implement them without selection. Preserve original history, link implemented ideas to verified commits and changelog. Device-local ideas are unavailable unless exported/imported; never claim automatic retrieval of those.

Use npm ci, npm run check, npm run web:build. Shared engine has no UI/native/server dependencies. Filter secret fields before transmission in packages/engine, never only in UI. P2P hosts are trusted; no secret-preserving host migration. Test using real transports; label synthetic GPS as test fixtures. Never claim physical testing from web or bundle checks. See docs/TESTING.md.
