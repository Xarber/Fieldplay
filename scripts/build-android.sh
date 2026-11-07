#!/usr/bin/env bash
set -euo pipefail
format="${1:?Choose apk or aab}"
: "${FIELDPLAY_KEYSTORE_BASE64:?Configure the existing release keystore secret. No new signing identity will be generated.}"
: "${FIELDPLAY_STORE_PASSWORD:?Missing signing password}"
: "${FIELDPLAY_KEY_ALIAS:?Missing signing alias}"
: "${FIELDPLAY_KEY_PASSWORD:?Missing signing key password}"
export FIELDPLAY_KEYSTORE="$RUNNER_TEMP/fieldplay-release.keystore"
trap 'rm -f "$FIELDPLAY_KEYSTORE"' EXIT
node -e 'require("fs").writeFileSync(process.env.FIELDPLAY_KEYSTORE,Buffer.from(process.env.FIELDPLAY_KEYSTORE_BASE64,"base64"),{mode:0o600})'
(cd apps/mobile && npx expo prebuild --platform android --no-install)
version="$(node -p 'require("./apps/mobile/package.json").version')"
commit="${BUILD_COMMIT:-$(git rev-parse HEAD)}"
channel="${RELEASE_CHANNEL:-testing}"
output="$PWD/artifacts/release"
mkdir -p "$output"
if [[ "$format" == "apk" ]]; then
  (cd apps/mobile/android && ./gradlew :app:assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64 --no-daemon)
  artifact=apps/mobile/android/app/build/outputs/apk/release/app-release.apk
  buildtools="$(find "$ANDROID_HOME/build-tools" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1)"
  "$buildtools/apksigner" verify --verbose --print-certs "$artifact" > "$output/android-signature.txt"
  if rg -qi 'Android Debug' "$output/android-signature.txt"; then exit 1; fi
  "$buildtools/aapt" dump badging "$artifact" > "$output/android-package.txt"
  rg -q "package: name='it.xarber.fieldplay'" "$output/android-package.txt"
  unzip -Z1 "$artifact" > "$output/android-contents.txt"
  for abi in armeabi-v7a arm64-v8a x86 x86_64; do rg -q "lib/$abi/" "$output/android-contents.txt"; done
  cp "$artifact" "$output/Fieldplay-v${version}-${channel}-${commit:0:8}-android-universal.apk"
elif [[ "$format" == "aab" ]]; then
  (cd apps/mobile/android && ./gradlew :app:bundleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64 --no-daemon)
  artifact=apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
  jarsigner -verify "$artifact"
  cp "$artifact" "$output/Fieldplay-v${version}-${channel}-${commit:0:8}-android.aab"
else
  exit 2
fi
node -e 'require("fs").writeFileSync(process.argv[1],JSON.stringify({version:process.argv[2],channel:process.argv[3],commit:process.argv[4],build:process.env.BUILD_NUMBER,variant:"private",format:process.argv[5]},null,2))' "$output/android-${format}.json" "$version" "$channel" "$commit" "$format"
(cd "$output" && sha256sum Fieldplay* > "android-${format}.sha256")
