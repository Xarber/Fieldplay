# Networking and local play

## P2P-first

Private WebRTC uses a star centered on the player host. The server authenticates six-hour guest sessions and routes offers, answers and ICE only between authenticated members and the host. Commands travel over ordered encrypted DataChannels. The host runs the same shared authority as a dedicated server, then projects a separate view for each peer. Signaling contains no game snapshots or GPS histories.

STUN/TURN settings belong to the self-hosted service, not a mandatory proprietary platform. No external STUN host is silently configured. A LAN can establish host candidates without a public STUN service. Across NATs/carrier networks, your own STUN/TURN configuration may be required. The relay-only option asks WebRTC to use TURN candidates; without a configured relay it fails rather than pretending to connect directly.

The optional TURN service uses shared-secret HMAC credentials returned only after guest authentication, expiring within the guest session lifetime. Keep the secret server-side. Candidate-pair stats report measured direct/relay path and round-trip time when the implementation provides them; packet loss is not invented. Physical native statistics and TURN connectivity remain unverified.

## Dedicated authority

Select Dedicated authority in the host form to run rules on the self-hosted Node service. The same authenticated command contract and per-member privacy projections travel over WebSockets. TLS must terminate at your existing trusted private infrastructure outside loopback. This is the preferred trust model when hiding objectives from the player host matters.

## Reconnection and host loss

Connection failure stops local GPS transmission and pauses a running authority. The reconnect action uses scoped credentials stored securely. A dedicated server can resume an in-memory match after an authenticated host reconnects. A live P2P host can preserve its memory while reconnecting. A restarted host cannot safely recover its secret state; create a new party. No insecure secret-state migration is attempted.

Ordering, revision checks, bounded deduplication, stale GPS rejection and single-use confirmation/code validation prevent common duplicate/out-of-order actions. Real packet-loss/high-latency and long suspension scenarios still need field testing.

## Offline scope

The web app shell, preferences, presets, summarized results and ideas work offline. Multiplayer still requires a working link and host/signaling or authority endpoint. A private LAN can host that endpoint without the public internet, using trusted TLS for actual devices. There is no claim of neighborhood-wide Bluetooth coverage, automatic mDNS discovery, or continuous background peer synchronization. External map assets are not pre-cached; a map connection/cache provider must respect dataset licensing.

Ideas and friend address books currently stay on their device; JSON export/import is deliberate, not automatic cloud synchronization.
