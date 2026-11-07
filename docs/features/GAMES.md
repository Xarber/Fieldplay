# Games and shared geographic mechanics

## Treasure Hunt — Secret Exchange

Every connected player consents, registers one treasure at an accurate GPS fix within the arena, chooses QR/physical/virtual type, writes a clue and readies up. A CSPRNG shuffle followed by a cycle creates a bijective derangement: each player hunts one other player's treasure, each treasure has one hunter, and no self-assignment is possible. The host starts a return phase. All players must check in at the starting point with fresh accurate fixes before the clock starts.

Default discovery stages: 300 m at 0 seconds, 200 m at 300, 120 m at 600, 70 m at 900, 30 m at 1,200. Hosts can edit the monotonic schedule. Secret independent per-stage offsets keep the treasure inside the circle without transmitting it as the center. Scanner circles use separate secret offsets, avoiding a fixed-offset extrapolation between normal and scanner circles. Successive search zones intentionally narrow the possible area; this is not cryptographic location anonymity.

The hunter submits the treasure's QR/secret code at the actual location. The authority checks assignment, unused code, location freshness, GPS uncertainty and interaction radius before awarding points. First-find can finish immediately; points mode waits for all finds or timeout. Finish publishes results and removes temporary location data. Replay resets preparations/assignments and keeps the party.

## Manhunt

Violet players hunt; lime players run. Teammates see recent authorized live positions. Opponents receive only delayed coarse snapshots at the configured ping interval, with timestamps/radii. A shrinking survival circle approaches 20% of arena radius, with a 30 m minimum. An accurate outside observation starts a 30-second grace; continuing accurate observations are required for zone elimination. Missing/stale fixes do not manufacture an elimination.

Captures require accurate nearby fixes and a runner's explicit, expiring confirmation. GPS alone never counts as a physical tag. Capturing/eliminating all runners wins for hunters. Remaining runners win at timeout. Any player can pause for safety. The app cannot certify a safe route back inside the boundary.

## Checkpoint Domination

Hosts place one or more checkpoints. A claim requires three accurate samples spanning at least five seconds, all inside the interaction region after accounting for accuracy. Four claims five seconds apart establish ownership. Nearby opponents contest claims. Owned checkpoints accrue points through the authoritative clock; optional moving hill rotates the single active checkpoint every minute. Timer expiry resolves the team score or a draw.

## Smugglers vs. Customs

Lime couriers collect one hidden virtual package at pickup point 1 and deliver it at point 2. Violet customs players request non-contact interceptions; the courier confirms, surrendering cargo and granting customs points. Possession is absent from opponent views. Delivery awards 100 points; an interception awards 50. Points resolve team victory at timeout.

## Shared systems

All modes share geospatial validation, phase control, teams, authenticated commands, replay protection, ability contracts and privacy projections. The implemented geographic behaviors cover survival, discovery, territory, moving hill and coarse detection. General temporary event hotspots and arbitrary moving objectives remain roadmap items, not an implemented six-zone editor.

Eight abilities have three charges, a 15-second effect and 60-second cooldown: scanner narrows a treasure search; radar exposes existing authorized coarse enemy circles; ghost hides enemy pings; decoy emits a false coarse ping; shield prevents capture requests; rescue frees a nearby captured teammate; jammer suppresses pings; proximity detector reveals only a nearby-opponent count. Role restrictions are authoritative. No client can self-award charges or score.

Other families/variants remain planned until their distinct rules and acceptance tests exist. The catalogue does not reskin identical chase rules and claim them as separate complete games.
