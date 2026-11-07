#!/usr/bin/env bash
set -euo pipefail
variant="${1:?Choose unsigned or simulator}"
version="$(node -p 'require("./apps/mobile/package.json").version')"
commit="${BUILD_COMMIT:-$(git rev-parse HEAD)}"
channel="${RELEASE_CHANNEL:-testing}"
output="$PWD/artifacts/release"
mkdir -p "$output"
workspace="$PWD/apps/mobile/ios/Fieldplay.xcworkspace"
if [[ "$variant" == "unsigned" ]]; then
  archive="$RUNNER_TEMP/Fieldplay.xcarchive"
  xcodebuild -workspace "$workspace" -scheme Fieldplay -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' -archivePath "$archive" CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO archive
  app="$archive/Products/Applications/Fieldplay.app"
  xcrun lipo -verify_arch arm64 "$app/Fieldplay"
  test -f "$app/main.jsbundle"
  test "$(/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$app/Info.plist")" = it.xarber.fieldplay
  package="$RUNNER_TEMP/fieldplay-ipa"
  mkdir -p "$package/Payload"
  ditto "$app" "$package/Payload/Fieldplay.app"
  (cd "$package" && /usr/bin/zip -qry "$output/Fieldplay-v${version}-${channel}-${commit:0:8}-ios-unsigned.ipa" Payload)
elif [[ "$variant" == "simulator" ]]; then
  derived="$RUNNER_TEMP/fieldplay-simulator"
  xcodebuild -workspace "$workspace" -scheme Fieldplay -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath "$derived" ARCHS=arm64 ONLY_ACTIVE_ARCH=NO CODE_SIGNING_ALLOWED=NO build
  app="$derived/Build/Products/Release-iphonesimulator/Fieldplay.app"
  xcrun lipo -verify_arch arm64 "$app/Fieldplay"
  test -f "$app/main.jsbundle"
  ditto -c -k --sequesterRsrc --keepParent "$app" "$output/Fieldplay-v${version}-${channel}-${commit:0:8}-ios-simulator.app.zip"
else
  exit 2
fi
node -e 'require("fs").writeFileSync(process.argv[1],JSON.stringify({version:process.argv[2],channel:process.argv[3],commit:process.argv[4],build:process.env.BUILD_NUMBER,variant:process.argv[5]},null,2))' "$output/ios-${variant}.json" "$version" "$channel" "$commit" "$variant"
(cd "$output" && shasum -a 256 Fieldplay* > "ios-${variant}.sha256")
