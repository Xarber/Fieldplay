# Third-party notices

Original Fieldplay code/branding is AGPL-3.0-only. Dependencies and geographic data retain their own licenses. This inventory is a development record, not a completed legal/store clearance.

| Component | Upstream license / source |
|---|---|
| Expo, Expo Router and Expo modules | MIT; installed package notices and https://github.com/expo/expo |
| React / React Native / React Native Web | MIT; upstream package license files |
| Native WebRTC integration | MIT; https://github.com/react-native-webrtc/react-native-webrtc |
| Underlying WebRTC/Jitsi binaries | Their distributed BSD and third-party notices must accompany binary distribution; native archive review remains required |
| MapLibre React Native | BSD-2-Clause; installed package LICENSE |
| MapLibre GL JS | BSD-3-Clause; installed package LICENSE |
| Zod / ws | MIT; installed package notices |
| React Native Reanimated / Worklets | MIT; installed package notices |
| React Native SVG / QR generator / AsyncStorage | MIT; installed package notices |
| Feather icons/font | MIT; retain the bundled font/icon notice |
| OpenStreetMap data | ODbL; visible map attribution is retained. https://www.openstreetmap.org/copyright |
| OpenFreeMap hosted style/tiles/fonts | Respect provider attribution and dataset/style/font terms. https://openfreemap.org/ |
| Caddy / coturn optional images | Upstream Apache-2.0 / BSD-family notices; independently maintained images, never the application's license |

The UI uses system fonts; decorative map artwork and layered branding are original. No proprietary game artwork or mandatory commercial map token is bundled. Cached/offline map packs are not enabled; do not indiscriminately cache geographic datasets without checking their terms.

Before any wider native/store distribution, inspect the exact built binary/framework/font notices, transitive dependency licenses and AGPL source-availability obligations for the intended channel. Keep corresponding source available to the authorized audience. Store-policy/license compatibility has not been established; do not silently relicense Fieldplay to satisfy a store.
