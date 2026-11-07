# Data model and retention

## Authority memory

`Match` stores stable random IDs, host/co-host IDs, roster, validated configuration, phases/timers, treasures and per-hunter assignments, bounded event/chat buffers, pending encounters, checkpoints, team scores and the last 20 results. Commands keep a bounded 2,000-ID deduplication window. Single-use discovery codes and confirmation IDs remain invalid after consumption even if their command IDs later leave that window.

`Player.samples` retains at most 100 accepted samples within four minutes. Accurate recent samples support proximity, plausibility and checkpoint checks; delayed samples support opponent pings. Future, stale, duplicate/out-of-order and implausible movement updates are rejected without replacing the last valid sample. Unknown accuracy becomes 1,000 m and cannot prove an interaction. No location is silently replaced with zero.

Finish, withdrawal and sharing revocation clear sensitive data. Paused projections show no live locations. The server never writes GPS, guest credentials, game secrets or movement histories to disk. A restart safely loses sessions/matches. This is deliberate ephemeral behavior, not durable server recovery.

## Device persistence

Native `fieldplay.db` uses SQLite WAL and a `kv(key TEXT PRIMARY KEY, value TEXT NOT NULL)` table, `PRAGMA user_version=1`. Inserts/upserts are atomic. A newer unsupported schema fails without deletion. Missing v1 values can migrate from earlier `fieldplay.v1.*` AsyncStorage keys; originals are preserved. The web uses IndexedDB database `fieldplay`, schema version 1, object store `kv`, with the same legacy fallback and commit acknowledgement.

Stored collections: local profile/preferences, friends/contact notes, recent party metadata (not session bearer tokens), favorites, presets, summarized match results, last app version, update metadata/preferences and developer ideas. Native guest session tokens use SecureStore; web tokens use sessionStorage and expire with the tab/session. Invitations are bearer capabilities: share privately.

## Ideas

The versioned collection is `{schemaVersion:1, projectId:'it.xarber.fieldplay', exportedAt, ideas:[]}`. Idea fields include stable ID, title, description, reproduction, category, priority, status, timestamps, embedded screenshot, implementation/release references and status history. Imports validate schema/project, reject duplicate incoming IDs, and preview additions, exact duplicates and conflicts. Existing records win unless a conflict is explicitly selected. Selected replacements merge status history.

No automatic synchronization with the private repo is configured. `docs/IDEAS.json` starts empty. Export/import is the supported transfer path. Exported ideas may contain private descriptions or screenshots; do not put them in releases or public repositories without authorization.
