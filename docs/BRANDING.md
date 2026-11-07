# Branding

Fieldplay is the user's provisional working name: it describes outdoor spaces becoming a shared game. A naming lookup found an unrelated [FieldPlay app](https://apps.apple.com/us/app/fieldplay/id6782360616). The development identity is retained; no global availability or trademark clearance is claimed. Revisit naming before public distribution.

## Palette and typography

- Accessible white-label button fill: `#555CE0` (5.26:1 contrast); keep `#6269F5` for brand accents.
- Main violet: `#6269F5`; light-theme interactive violet: `#555CE0`.
- Outdoor lime: `#C4EF9A`; accessible light-theme lime text: `#406323`.
- Night background: `#10121B`; panel: `#191C28`; body text: `#F4F3F8`; supporting text: `#A3A6BA`.
- Day background: `#F6F6FA`; panel: `#FFFFFF`; text: `#171B30`; secondary: `#62677D`.

Use system typography with default Dynamic Type support, tight display tracking, clear medium/semibold labels and relaxed body leading. Feather provides a consistent descriptive line-icon family. Do not substitute icons for consent, safety or action labels.

## Source assets

`assets/branding/icon.svg` is the editable 1024-square master, with stable background, trail, flag and highlight groups and a reusable field gradient. `icon-mono.svg` separates foreground symbol/trail for monochrome and tinted exports. The flag and dotted discovery trail represent a destination reached through playful exploration. Keep safe padding for platform masks and recognize the silhouette at small sizes.

`npm run branding` exports light/dark 1024 PNGs, adaptive foreground/background configuration, monochrome Android symbol, PWA 192/512 icons, Apple Touch Icon, favicon and repository banner. iOS asset catalogs are generated through Expo. SVG sources remain editable; raster exports do not replace them. Icon Composer layered `.icon` delivery and actual device masking still need native-platform validation.

The original TrailArt component is a decorative map illustration; it never claims to show player measurements. `apps/mobile/public/welcome/app-preview.png` is a real web UI screenshot, separately captioned. Do not present it as a native or physical-device screenshot.
