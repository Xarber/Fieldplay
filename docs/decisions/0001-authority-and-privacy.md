# ADR 0001 — One authority, filtered views, fail-closed host loss

Status: accepted for the private development implementation.

The same pure typed engine runs in a trusted player host or dedicated server. Both transports send per-player projections. This avoids hidden coordinates leaking through a superficially hidden client marker and keeps scoring/interaction rules consistent.

P2P cannot hide secrets from its authority. The UI discloses host trust and network-address exposure. Dedicated authority is available for stronger separation. Losing a peer safely pauses; losing the host's in-memory state requires a new party. Automatically electing a peer would risk transferring hidden state to an unauthorized player, so it is not implemented.

Device feedback stays local and offline-first. Native SQLite and web IndexedDB persist ideas without a GitHub account. Guest secrets are stored separately. Active server games are deliberately ephemeral; no GPS history is persisted merely to make recovery convenient.

Tradeoff: immediate secret-preserving crash recovery, durable server groups and autonomous nearby discovery remain future work. The choice prioritizes integrity and reviewability over falsely claiming complete recovery.
