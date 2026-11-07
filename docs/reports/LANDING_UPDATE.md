# Integrated landing update

The web-specific Expo layout now shows the introduction at `/` on first visit. Explicit entry stores `fieldplay.web.opened.v1`; ordinary subsequent visits open the app. Invitation query strings and non-root routes bypass the introduction. A labeled Fieldplay return action uses `/#welcome`; `/#app` explicitly opens the app. Browser back/forward restores the view without resetting the preference. Storage errors fall back to session history.

The app stays mounted while the landing is visible, preserving forms and party state. The existing responsive landing asset is embedded from the same origin. Native builds retain their original layout and contain no landing navigation. Existing private exposure restrictions remain unchanged.

Validation: strict TypeScript and production web export passed. Dedicated Chromium checks cover first visit, entry, reload persistence, return, history and invitation bypass. Deployed privately to X-Center at commit `cbc06848dfd3e9f7fdae1a568cccd00eec1e7693` after staging. Both staging and deployed Chromium landing checks and real two-client service smoke tests passed. Previous image and `.env.rollback-34e6ca3` retained. Existing unrelated container IDs/start times were unchanged; staging container removed. No native verification or public exposure is claimed.
