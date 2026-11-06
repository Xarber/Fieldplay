# PROJECT 09 — FIELDPLAY
## Complete Standalone Application Development Specification

**Working name:** Fieldplay — provisional, freely renameable  
**Tagline:** Turn the world into a game.  
**Parent initiative:** OpenRecode  
**Application type:** Real-world, location-based multiplayer gaming platform  
**Platforms:** iOS and Android, optional Web companion  
**Architecture:** Peer-to-peer-first, with optional dedicated authoritative servers  
**Status:** New, independent application

---

# 1. CRITICAL PROJECT IDENTITY

Build Fieldplay as a completely independent application.

**Fieldplay is NOT part of Pathway.**

Pathway is a separate social navigation and meetup application. Do not modify Pathway, import its architecture as a mandatory dependency, or merge the two products.

Fieldplay must have its own:

- Repository and application identity.
- iOS and Android application identifiers.
- User interface and design system.
- Authentication and player profiles.
- Friends and multiplayer groups.
- Lobby and matchmaking systems.
- Geographic game engine.
- Peer-to-peer networking.
- Backend and database.
- Privacy permissions.
- Developer options.
- UADS Ideas page.
- Changelog.
- Documentation.
- Release roadmap.

Future interoperability with other OpenRecode applications may be considered, but Fieldplay must function completely independently.

# 2. YOUR ROLE AND MISSION

Act as a complete senior software development team consisting of:

- Product architect.
- Multiplayer networking engineer.
- Game systems designer.
- Geospatial engineer.
- Senior React Native developer.
- Native iOS and Android engineer.
- Real-time backend engineer.
- Security and anti-cheat engineer.
- UI/UX designer.
- Quality assurance engineer.
- DevOps engineer.
- Open-source maintainer.

Inspect the workspace before implementing anything.

Read my Universal Application Development Standards (UADS) if accessible.

Do not stop after architectural plans or mockups.

**Build a real, playable application.**

Prioritize a complete, functioning multiplayer game over a large catalogue of unfinished game screens.

Do not deploy publicly, incur paid infrastructure costs, or alter unrelated repositories without authorization.

# 3. PRODUCT VISION

Fieldplay transforms suitable real-world outdoor spaces into multiplayer game arenas.

Users should be able to:

1. Create a private group with friends.
2. Select a real-world game mode.
3. Define an outdoor playing area.
4. Configure game rules.
5. Invite players through codes, links, or QR codes.
6. Assign teams and roles.
7. Start a synchronized multiplayer match.
8. Move around the real world.
9. Complete location-based objectives.
10. Use tactical abilities and hidden information.
11. Interact with other players.
12. Earn points and complete challenges.
13. Finish a match and see the results.
14. Start another game with the same group.

The game should use the physical environment as an essential gameplay component, not merely as a background map.

## Core Philosophy

**One map. Countless games.**

The same geographic infrastructure should support entirely different experiences:

- Hide and Seek.
- Treasure Hunt.
- Manhunt.
- Capture the Flag.
- Infection.
- Territory Control.
- Secret Missions.
- Social Deduction.
- Puzzle Hunts.
- And many more.

Different modes must have distinct objectives and mechanics.

Do not simply reskin the same chase game eighteen times.

# 4. MULTIPLAYER GROUP SYSTEM

Build a complete private group system.

## Group Types

- Temporary Party.
- Persistent Friend Group.
- Local Nearby Group.
- Tournament Group.

## Group Features

- Create group.
- Invite by code.
- Invite by QR code.
- Invite by link.
- Add friends.
- Remove participants.
- Kick and ban.
- Host and co-host roles.
- Player readiness.
- Team assignment.
- Group chat.
- Voice chat as an optional enhancement.
- Saved settings.
- Recent games.
- Match history.

## Group Privacy

Groups are private by default.

Joining a group does not automatically enable GPS sharing.

Players must independently accept location access and game-specific sharing rules.

## Guest Players

Allow temporary guest participation where feasible without requiring a permanent account.

Guests should have appropriately scoped permissions.

# 5. PEER-TO-PEER NETWORKING

Make peer-to-peer multiplayer a central architectural objective.

## Connection Modes

### Local Network

Use supported local discovery and connectivity mechanisms.

Investigate Bonjour/mDNS, WebRTC, and appropriate platform-specific discovery APIs.

### Internet Peer-to-Peer

Implement:

- WebRTC DataChannels.
- ICE negotiation.
- STUN.
- TURN fallback.
- Authenticated signaling.
- Encrypted peer communication.

### Dedicated Server

Provide an optional self-hosted authoritative game server.

## Important Limitations

Mobile devices cannot always connect directly because of NAT, carrier networking, firewall restrictions, and platform behavior.

TURN relays may be necessary.

Do not falsely claim that every remote match uses a direct connection.

## Host Authority

Support player-hosted sessions with a designated host.

The host coordinates authoritative game-state transitions.

For competitive modes where hidden information and cheating matter, support dedicated authoritative servers.

## Host Migration

Investigate:

- Successor selection.
- Replicated state.
- Reconnection.
- Match resumption.

Do not migrate secret data insecurely.

If migration cannot preserve game integrity, pause or terminate the match safely.

# 6. GAME LOBBIES

Every game must have a functional lobby.

## Lobby Settings

- Game mode.
- Arena.
- Match duration.
- Minimum and maximum players.
- Teams.
- Roles.
- Player readiness.
- Location visibility.
- Dynamic zones.
- Objectives.
- Abilities.
- Scoring.
- Victory conditions.

## Host Controls

- Edit settings.
- Assign teams.
- Randomize teams.
- Select game mode.
- Configure arena.
- Start match.
- Pause match.
- End match.

Validate the lobby configuration before starting.

Ensure that players understand location-sharing rules before entering the match.

# 7. REUSABLE GEOGRAPHIC GAME ENGINE

Create one shared engine with modular game rules.

## Map Engine

- Outdoor arena boundaries.
- Circular regions.
- Polygonal regions.
- Exclusion zones.
- Team territories.
- Objective locations.
- Safe checkpoints.
- Moving zones.

## Location Engine

- Live GPS.
- Delayed positions.
- Periodic snapshots.
- Approximate locations.
- Proximity detection.
- Hidden player states.
- Temporary reveals.

## Player Engine

- Teams.
- Roles.
- Captured states.
- Frozen states.
- Eliminations.
- Respawns.
- Dynamic team changes.

## Objective Engine

- QR objectives.
- Virtual collectibles.
- Physical treasures.
- Flags.
- Checkpoints.
- Bases.
- Delivery points.
- Rescue points.

## Interaction Engine

- Tag.
- Capture.
- Rescue.
- Claim.
- Deliver.
- Scan.
- Exchange.
- Activate.

## Event Engine

- Timed phase changes.
- Shrinking zones.
- Moving objectives.
- Temporary hotspots.
- Sudden death.
- Special reveals.

## Scoring Engine

- Individual scores.
- Team scores.
- Survival time.
- Territory control.
- Objective completion.
- Time bonuses.
- Victory conditions.

Do not duplicate these systems independently for every game.

# 8. SIX DYNAMIC ZONE TYPES

Implement six reusable geographic zone systems.

## Survival Zones

The permitted playing area contracts over time.

Used for Manhunt, Infection, and survival-based modes.

## Discovery Zones

A search area progressively narrows around an objective.

Used for Treasure Hunt, Artifact Hunt, and Geocaching.

The hidden objective must remain inside the displayed zone.

## Moving Zones

Objectives or scoring areas periodically relocate among safe predefined locations.

## Territory Zones

Teams capture and defend geographic regions.

## Detection Zones

Players receive progressively narrower search areas instead of exact enemy coordinates.

## Event Zones

Temporary hotspots grant points, clues, abilities, or virtual supplies.

Each game must explicitly define how its zones affect gameplay.

# 9. LOCATION VISIBILITY MECHANICS

Location visibility is a gameplay mechanic, not a permanent social-tracking feature.

Support:

- Live.
- Delayed.
- Periodic Ping.
- Approximate.
- Proximity Only.
- Hidden.
- Temporarily Revealed.

Visibility should depend on:

- Game mode.
- Team.
- Player role.
- Game phase.
- Ability.
- Objective state.
- Zone position.

## Privacy Enforcement

Never send precise live coordinates to players who are only authorized to see delayed or approximate information.

Enforce visibility before transmitting information.

In player-hosted games, disclose that the host may have greater access to authoritative state.

For competitive hidden-information games, prefer dedicated trusted servers.

Stop game location sharing when a player leaves or the match ends.

# 10. INITIAL PLAYABLE GAME — TREASURE HUNT

Implement Treasure Hunt first.

This should become the initial complete multiplayer vertical slice.

## Secret Exchange

Example: six friends, six treasures.

### Preparation

Every player creates a treasure within the arena.

A treasure can be:

- A small physical object.
- A QR-coded object.
- A virtual objective.

The player registers its position and provides clues.

### Return Phase

Players return to the agreed starting area.

### Assignment

Randomly assign each participant another player's treasure.

Ensure:

- No player gets their own treasure.
- Every treasure has one assigned hunter.
- Every player receives a valid assignment.

### Search Phase

Display a discovery circle.

The circle narrows over time.

Example:

- Start: 300 meters.
- After 5 minutes: 200 meters.
- After 10 minutes: 120 meters.
- After 15 minutes: 70 meters.
- After 20 minutes: 30 meters.

Allow configurable values.

### Discovery

Verify physical treasures through QR codes or another valid interaction.

### Victory

Allow:

- First verified discovery.
- Fastest completion.
- Highest points.

## Other Treasure Hunt Variants

- Treasure Thieves.
- Rival Hunters.
- Hot and Cold.

The system must support replaying a match with new assignments.

# 11. SECOND GAME — MANHUNT

Implement a complete Hunter-versus-Runner game.

## Mechanics

- Hunters and runners.
- Delayed GPS pings.
- Periodic location snapshots.
- Shrinking survival area.
- Capture confirmation.
- Match countdown.
- Team victory.

## Variants

- Classic Manhunt.
- Radar Hunt.
- Last Survivor.
- Safehouse.

Physical tagging must have a safe non-contact alternative.

GPS proximity alone must not automatically count as a physical capture.

# 12. THIRD GAME — CHECKPOINT DOMINATION

Build a territory-control mode.

## Mechanics

- Multiple geographic checkpoints.
- Team presence.
- Capture progress.
- Territory ownership.
- Points over time.
- Moving scoring zones.

## Variants

- King of the Hill.
- Domination.
- Moving Hill.
- Sudden Death.

Use location accuracy and multiple samples to validate checkpoint presence.

# 13. FOURTH GAME — SMUGGLERS VS. CUSTOMS

Build a game based on transporting virtual cargo.

## Mechanics

- Two teams.
- Virtual packages.
- Delivery locations.
- Hidden package ownership.
- Periodic location pings.
- Interception confirmation.
- Team scoring.

## Variants

- Border Run.
- Moving Customs.
- High-Value Cargo.
- Undercover Courier.

Do not require physical contact or dangerous high-speed pursuit.

# 14. COMPLETE GAME CATALOGUE

Architect all the following game families through the reusable engine.

| Family | Core gameplay |
|---|---|
| Treasure Hunt | Hidden treasures, clues, discovery circles |
| Hide and Seek / Manhunt | Hunters, runners, delayed tracking |
| Sardines | Increasingly concentrated hidden group |
| Kick the Can / Jailbreak | Prison zones and rescues |
| Zombie Infection | Dynamic team conversion |
| Freeze Tag | Captures and rescue objectives |
| Fugitive / Assassin | Secret targets and extraction points |
| Capture the Flag | Team bases and flag captures |
| Human Stratego | Secret ranks and encounters |
| Smugglers vs. Customs | Cargo deliveries and interceptions |
| King of the Hill / Domination | Geographic territory control |
| Secret Base / Camouflage | Hidden headquarters and decoys |
| QR Hunt / Puzzle Relay | Sequential geographic puzzles |
| Artifact / Photo Hunt | Collectibles and photo challenges |
| Spy Network / Dead Drop | Secret missions and rendezvous |
| Social Deduction | Hidden roles, investigations, sabotage |
| Flashlight / Firefly Hunt | Timed reveals and stealth |
| Beacon Heist / Night Trail | Beacon objectives and restricted information |

Include the variants and detailed mechanics from the provided original game-concept document.

Avoid creating proprietary-game-name dependencies or copying another game's protected art, branding, or implementation.

# 15. GAME CREATOR

Build a configurable game-creation interface.

Allow hosts to customize:

- Game type.
- Duration.
- Arena size.
- Teams.
- Roles.
- Objectives.
- Zone mechanics.
- Visibility rules.
- Special abilities.
- Scoring.
- Victory conditions.

Support saved presets and import/export.

Use versioned, validated configuration schemas.

Do not execute arbitrary code from imported game configurations.

# 16. ABILITIES AND POWER-UPS

Build a reusable ability system.

Initial abilities:

- Scanner.
- Radar Pulse.
- Ghost Mode.
- Decoy Ping.
- Temporary Shield.
- Rescue Bonus.
- Signal Jammer.
- Proximity Detector.

Each ability must have:

- Identifier.
- Eligible roles.
- Activation requirements.
- Duration.
- Cooldown.
- Charges.
- Effect.
- Expiration behavior.

The game authority validates activation.

Clients cannot award themselves abilities or points.

# 17. PHYSICAL INTERACTIONS

Implement validated real-world game interactions.

## Supported Methods

- Mutual confirmation.
- QR code.
- One-time interaction code.
- Host confirmation.
- GPS proximity plus explicit confirmation.
- Optional BLE-based nearby verification.

Do not treat GPS as proof of physical contact.

Prevent replaying previously used interaction codes.

Allow a non-contact interaction method for every game where tagging would otherwise be required.

# 18. GAME MAP AND USER INTERFACE

Create an original, game-first design.

## Main Navigation

- Play.
- Games.
- Groups.
- Profile.

## Play Screen

- Host Game.
- Join Game.
- Nearby Games.
- Recent Parties.
- Favorite Modes.

## Live Game Interface

Display:

- Map.
- Arena boundary.
- Current role.
- Team.
- Timer.
- Objectives.
- Score.
- Player markers when authorized.
- Dynamic zones.
- Abilities.
- Event notifications.

## Group Interface

Provide:

- Member avatars.
- Readiness.
- Team selection.
- Chat.
- Invite actions.
- Host settings.

Use **#6269F5** as the initial accent color.

Support dark and light themes, dynamic text, screen readers, and reduced motion.

# 19. IOS AND ANDROID ARCHITECTURE

Preferred stack:

- React Native.
- Expo.
- Expo Router.
- TypeScript.
- React Native Reanimated.
- Zustand or equivalent.
- TanStack Query.
- SecureStore.
- SQLite.
- Native location APIs.
- A maintained mapping SDK.
- WebRTC native integration.

Use development builds for native capabilities unavailable in Expo Go.

## Location Handling

Support:

- Foreground location.
- Explicitly authorized background location.
- Accuracy information.
- Adaptive updates.
- Battery-efficient tracking.
- Connection recovery.

## IOS

Use supported Core Location and background-location capabilities.

## Android

Use documented foreground services and location permissions.

Do not promise uninterrupted GPS collection under every operating-system condition.

# 20. MAPPING AND GEOSPATIAL SYSTEMS

Evaluate:

- MapLibre.
- OpenStreetMap-compatible data.
- Mapbox.
- Other suitable providers.

Use a provider abstraction.

Support:

- Polygon editing.
- Geofencing.
- Spatial queries.
- Proximity calculations.
- Safe objective placement.
- Cached map assets where licensed.
- Offline map capability where feasible.

Map data is not a substitute for inspecting a real-world playing area.

# 21. BACKEND AND SELF-HOSTING

Preferred stack:

- TypeScript.
- Node.js.
- PostgreSQL.
- PostGIS.
- Redis where justified.
- WebSockets.
- WebRTC signaling.
- Optional TURN.
- Docker Compose.

Backend responsibilities:

- Authentication.
- Signaling.
- Group invitations.
- Match authority.
- Rule validation.
- Game events.
- Optional score persistence.
- Anti-cheat checks.
- Game-state recovery.

## Self-Hosting

Provide:

- Docker Compose.
- Environment templates.
- Database migrations.
- HTTPS setup.
- TURN configuration.
- Backups.
- Health checks.
- Resource limits.
- Deployment documentation.

Basic private games should not require a proprietary gaming service.

# 22. DATA MODEL

Suggested entities:

- Player.
- Friend.
- Party.
- PartyMember.
- Lobby.
- LobbyParticipant.
- PeerConnection.
- GameMode.
- GamePreset.
- GameMatch.
- MatchPhase.
- MatchPlayer.
- MatchTeam.
- Role.
- Arena.
- ArenaZone.
- Objective.
- ObjectiveAssignment.
- ObjectiveInteraction.
- PlayerAbility.
- AbilityActivation.
- LocationVisibilityPolicy.
- LocationSnapshot.
- GameEvent.
- Score.
- MatchResult.
- MatchHistory.
- Device.
- DeveloperIdea.

Implement schema migrations, stable IDs, appropriate authorization, and time-limited retention of sensitive location data.

# 23. SECURITY AND ANTI-CHEAT

Implement:

- Authenticated multiplayer events.
- Authorization per group and match.
- Non-guessable invitation tokens.
- Short-lived session credentials.
- Encrypted communication.
- Safe game configuration parsing.
- Rate limiting.
- Invalid event rejection.
- Role-based information filtering.
- Replay protection.
- Duplicate event prevention.
- Plausibility checks for movement.
- Anti-cheat reporting.
- Match integrity validation.

## Limitations

GPS spoofing cannot be completely eliminated on untrusted mobile devices.

Peer-hosted games cannot guarantee protection against a malicious host.

Document those limits honestly.

# 24. LOCATION PRIVACY

Make privacy central.

## Rules

- Invite-only groups by default.
- Explicit location consent before play.
- No permanent location sharing.
- No background sharing outside an authorized match.
- Automatic permission/grant expiration.
- Immediate stop-sharing control.
- No public player-location search.
- Minimal location retention.
- No sale of location data.
- No advertising trackers.

## Hidden Information

Only disclose the location information permitted by the current game rules.

## Peer-to-Peer Privacy

Explain that direct peer connectivity may reveal network information to other participants.

Offer relay connectivity where feasible.

## End of Match

Stop sharing and expire temporary location data.

Do not save complete movement histories without separate, explicit consent.

# 25. SAFETY

Physical safety must always override game rules.

## Arena Restrictions

Do not generate objectives requiring:

- Trespassing.
- Dangerous road crossings.
- Entering motorways.
- Crossing railway infrastructure.
- Accessing restricted areas.
- Entering unsafe water or terrain.
- Climbing hazardous structures.

## Gameplay

- Do not require physical contact.
- Do not reward unsafe movement.
- Provide a safety pause.
- Allow immediate withdrawal.
- Clearly indicate GPS uncertainty.
- Do not encourage high-speed vehicle or scooter pursuits.

## Night Games

Require appropriate venue preparation and well-lit playing areas.

Do not imply the application can certify real-world safety from map data alone.

## Younger Players

Implement strong privacy protections, particularly for public discovery and interactions involving unknown people.

# 26. OFFLINE AND LOCAL PLAY

Investigate offline local-network multiplayer.

Support:

- Local host discovery.
- Joining without a public server.
- Local rule synchronization.
- Cached arena assets.
- Local game state.
- Match results.

Be clear that devices still need a functioning communication link.

Do not imply that Bluetooth or a normal Wi-Fi connection can automatically cover an entire neighborhood.

# 27. TESTING REQUIREMENTS

Build a comprehensive test suite.

## Unit Tests

- Game state transitions.
- Role assignments.
- Team balancing.
- Objective assignments.
- Zone geometry.
- Zone contraction.
- Ability cooldowns.
- Scoring.
- Victory conditions.
- Proximity validation.
- Permission checks.

## Multiplayer Tests

- Two devices on the same LAN.
- Two devices on different networks.
- STUN connectivity.
- TURN relay.
- Host disconnect.
- Reconnection.
- High latency.
- Packet loss.
- Duplicate events.
- Host migration where supported.

## Game Tests

Complete end-to-end testing for:

- Treasure Hunt.
- Manhunt.
- Checkpoint Domination.
- Smugglers vs. Customs.

## Security Tests

- Unauthorized location access.
- Hidden-role leaks.
- Invalid captures.
- Spoofed scoring events.
- Replayed QR codes.
- Expired invitations.
- Stale peer subscriptions.
- Location sharing after leaving.

## Physical Device Tests

Test real GPS and peer-to-peer behavior on physical iOS and Android devices where available.

Clearly distinguish simulated game testing from real outdoor testing.

# 28. UADS DEVELOPER OPTIONS

Implement developer options containing:

- App version.
- Build identifier.
- Multiplayer transport.
- P2P connection status.
- Host identity.
- Connection latency.
- Packet loss.
- Match state.
- Game engine version.
- Active game mode.
- Location permission status.
- GPS accuracy.
- Current map provider.
- Networking diagnostics.
- Sanitized logs.
- Changelog.
- Developer Ideas.

## Ideas Page

Implement the complete UADS Ideas system.

Support:

- Create.
- Edit.
- Delete.
- Categories.
- Priorities.
- Statuses.
- Screenshots.
- Search.
- Filter.
- Sort.
- JSON import/export.
- Deduplication.
- Implementation notes.
- Changelog linking.

Statuses:

- New.
- Under consideration.
- Approved.
- In progress.
- Implemented.
- Deferred.
- Rejected.

Developer Ideas must be distinct from user-created game modes and custom rule presets.

# 29. OPENRECODE STANDARDS

Fieldplay must be:

- Open-source.
- Free to use.
- Self-hostable.
- Forkable.
- Extensible.
- Community-maintainable.
- Free of advertisements.
- Free of mandatory subscriptions.
- Independent of proprietary gaming platforms.

Evaluate license compatibility, including mapping libraries, networking dependencies, and geographic datasets.

Document:

- Architecture.
- Game engine.
- Multiplayer networking.
- P2P hosting.
- Dedicated server hosting.
- Game mode creation.
- Map setup.
- Privacy.
- Security.
- Anti-cheat.
- Testing.
- Contributing.

Maintain a structured changelog and UADS compliance.

# 30. IMPLEMENTATION PHASES

Execute the project in this order.

## Phase 1 — Foundation

- Initialize application.
- Configure TypeScript.
- Create design system.
- Implement accounts or guest identities.
- Implement map interface.
- Create game-rule schemas.
- Build authoritative state machine.

## Phase 2 — Multiplayer

- Private parties.
- Invitations.
- QR codes.
- Lobby.
- Ready state.
- Peer-to-peer transport.
- Signaling.
- Host authority.
- Match synchronization.

## Phase 3 — First Playable Game

Implement Treasure Hunt completely.

Include:

- Arena editor.
- Treasure registration.
- Random assignments.
- Discovery zones.
- Clues.
- Physical objective verification.
- Scoring.
- Match results.

## Phase 4 — Chase Mechanics

Implement Manhunt.

Include:

- Hunters.
- Runners.
- Delayed GPS pings.
- Dynamic survival zones.
- Capture confirmation.

## Phase 5 — Territory Control

Implement Checkpoint Domination.

## Phase 6 — Objective Transport

Implement Smugglers vs. Customs.

## Phase 7 — Expanded Catalogue

Implement remaining game families through reusable rule modules.

## Phase 8 — Advanced Multiplayer

- Host migration.
- Dedicated servers.
- Local offline play.
- Tournament modes.
- Optional voice chat.
- Improved anti-cheat.

## Phase 9 — Production Readiness

- Privacy audit.
- Security testing.
- GPS accuracy testing.
- Battery optimization.
- Accessibility.
- CI.
- Documentation.
- Open-source release preparation.

# 31. MINIMUM PLAYABLE MILESTONE

Fieldplay's first release must support this complete scenario:

1. A player creates a private party.
2. A friend joins through a QR code or invite code.
3. Both devices establish a real multiplayer connection.
4. The host selects Treasure Hunt.
5. The players define an arena.
6. The host configures game duration and rules.
7. Participants register treasures.
8. All players ready up.
9. The game randomly assigns valid objectives.
10. The match begins.
11. Geographic discovery zones update correctly.
12. Players receive clues.
13. A treasure is found and verified.
14. Scores update across connected devices.
15. A winner is determined.
16. Results appear.
17. Temporary location sharing stops.
18. The party can start another game.

This is the initial definition of a playable product.

Do not substitute mocked player movements for real multiplayer functionality.

# 32. FINAL DELIVERABLES

Deliver:

1. Functional iOS application.
2. Functional Android application.
3. Multiplayer group system.
4. Lobby system.
5. Working P2P transport.
6. Optional dedicated server infrastructure.
7. Shared geographic game engine.
8. Arena editor.
9. GPS visibility rules.
10. Dynamic zone engine.
11. Objective system.
12. Player roles and teams.
13. Ability system.
14. Scoring and results.
15. Complete Treasure Hunt mode.
16. Complete Manhunt mode.
17. Checkpoint Domination.
18. Smugglers vs. Customs.
19. Extensible game catalogue architecture.
20. Privacy and security controls.
21. Anti-cheat validation.
22. Offline/local networking support where feasible.
23. UADS developer options.
24. Ideas page.
25. Changelog.
26. Automated tests.
27. Self-hosting configuration.
28. Documentation.
29. Build and deployment instructions.
30. Known limitations and roadmap.

# 33. FINAL EXECUTION DIRECTIVE

Begin implementation immediately.

Inspect the available workspace.

Build Fieldplay as an entirely independent OpenRecode application.

Do not modify or merge it with Pathway.

Start with the multiplayer transport, lobby, arena system, and reusable game engine.

Then complete one genuinely playable GPS Treasure Hunt match.

Test real communication between two clients.

Verify that game actions, objectives, scores, and match completion synchronize correctly.

Expand the engine to Manhunt, territory control, and objective transport.

Add other game modes incrementally.

Prioritize:

- Real multiplayer.
- Reusable game mechanics.
- Privacy.
- Physical safety.
- Reliable networking.
- Consistent game authority.
- Testability.
- Open-source portability.

Do not stop after producing plans or UI mockups.

**Final objective: deliver an independent, open-source, real-world multiplayer game platform that transforms suitable physical spaces into interactive arenas, where friends can host private groups and play dozens of GPS-driven games using peer-to-peer-first networking.**