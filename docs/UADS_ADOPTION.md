# UADS adoption — 2026-11-07

The active global `/Users/xarber/.codex/AGENTS.md` was reread, including the new section 36. This project specializes it without changing unrelated repositories or services.

| New requirement | Fieldplay application | Evidence / remaining validation |
|---|---|---|
| Mandatory web version and distinct landing | Shared Expo Web/PWA at `/`; responsive product page at `/welcome/` with real app screenshot, platform/install status, source/privacy/docs and service check | Production/browser landing, actual service check, light/dark and reduced-motion checks passed; native downloads honestly unavailable |
| X-Center default hosting | Existing X-Center selected; isolated runtime/Compose configuration binds only loopback, with resource limits and health check | Read-only inventory confirmed existing Docker; no public DNS/proxy or unrelated service changes authorized |
| Repository continuity | Reuse the existing `Xarber/Fieldplay`, preserve testing/beta/main and all history | Only the exact intended repository was checked; no similar-name repository search |
| Hardware-backed signing preference | Original hardware signing configuration preserved; unavailable key permits unsigned development commits | No alternate key, automatic rebase or force-push |
| Design guidance and Apple principles | Applied installed Apple/design-engineering/Expo motion guidance to shared controls, sheets, typography and materials | UI runtime tests do not establish physical-device animation quality |
| Coherent motion | 120 ms press feedback; 160 ms disclosure; 200/140 ms dialog opacity and damped scale settle; transform/opacity only | Reduced Motion replaces scale with a short fade; frequent tab/GPS/timer changes remain immediate |
| Meaningful icons / hierarchy | Shared Feather style, descriptive navigation/actions/statuses, secondary copy, accessible disclosures for lengthy interactive help | Dedicated landing information stays directly visible |
| Native modern materials | iOS Liquid Glass capability detection and reduced-transparency fallback for navigation; solid readable fallback elsewhere | Physical iOS/Android rendering remains unverified |

## Focused design review

| Before | After | Why |
|---|---|---|
| Mobile hero header could extend beyond the viewport | Flexible bounded heading and shrinkable text | Preserve content at narrow widths |
| Instant control-only opacity changes | Short transform/opacity press feedback | Confirm touch-down without delaying the action |
| Abrupt modal removal | Interruptible fade/scale, keeping closing content stable | Preserve spatial continuity and avoid a title/content flash |
| Unstructured long descriptions alongside controls | Grouped cards, muted supporting text and labeled disclosures | Keep the immediate decision visible; retain safety/consent text |
| Solid bottom navigation on every platform | Supported iOS glass with readable solid fallback | Respect capability and accessibility preferences |

No blanket claim of full UADS or production compliance is made. The wider specification still includes device validation, additional game families and other gaps listed in ROADMAP.md.
