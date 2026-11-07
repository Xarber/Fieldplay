import type { ExpoConfig } from "expo/config";
const config: ExpoConfig = {
  name: "Fieldplay",
  slug: "fieldplay",
  scheme: "fieldplay",
  version: process.env.APP_VERSION ?? "0.1.0",
  orientation: "default",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  ios: {
    bundleIdentifier: "it.xarber.fieldplay",
    buildNumber: process.env.BUILD_NUMBER ?? "1",
    supportsTablet: true,
    icon: {
      light: "./assets/icon.png",
      dark: "./assets/icon-dark.png",
      tinted: "./assets/monochrome.png",
    },
    infoPlist: {
      NSLocalNetworkUsageDescription:
        "Connect to your private Fieldplay host on the local network.",
    },
  },
  android: {
    package: "it.xarber.fieldplay",
    versionCode: Number(process.env.BUILD_NUMBER ?? 1),
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-foreground.png",
      backgroundColor: "#6269F5",
      monochromeImage: "./assets/monochrome.png",
    },
    permissions: [],
    blockedPermissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.BLUETOOTH",
    ],
  },
  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/favicon.png",
    name: "Fieldplay",
    shortName: "Fieldplay",
    themeColor: "#6269F5",
    backgroundColor: "#101422",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Use your location only for a private game you consent to. Stop sharing at any time.",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "Scan party invitations and treasure verification QR codes.",
        recordAudioAndroid: false,
        microphonePermission: false,
      },
    ],
    ["@maplibre/maplibre-react-native", {}],
    "@config-plugins/react-native-webrtc",
    ["expo-build-properties", { android: { minSdkVersion: 28 } }],
    "./plugins/with-data-only.cjs",
    "./plugins/with-release-signing.cjs",
    [
      "expo-splash-screen",
      {
        image: "./assets/icon.png",
        imageWidth: 160,
        backgroundColor: "#10121B",
      },
    ],
  ],
  extra: {
    buildNumber: process.env.BUILD_NUMBER ?? "1",
    buildCommit: process.env.BUILD_COMMIT ?? "development",
    buildDate: process.env.BUILD_DATE ?? "",
    channel: process.env.RELEASE_CHANNEL ?? "testing",
    variant: "private",
    updateManifest: process.env.EXPO_PUBLIC_UPDATE_MANIFEST ?? "",
  },
};
export default config;
