/**
 * Dev vs prod: set APP_VARIANT (EAS profiles set this).
 * Local `expo run:ios/android` defaults to development when unset.
 */
const variant =
  process.env.APP_VARIANT === "production" ? "production" : "development";

const isDevBuild = variant === "development";

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: isDevBuild ? "Bigback (Dev)" : "Bigback",
    slug: "Bigback",
    scheme: isDevBuild ? "bigback-dev" : "bigback",
    version: "2.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: isDevBuild
        ? "com.karsai1232.Bigback.dev"
        : "com.karsai1232.Bigback",
      buildNumber: "2",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: isDevBuild
        ? "com.karsai1232.bigback.dev"
        : "com.karsai1232.Bigback",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#ffffff",
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission:
            "Big Back needs camera access to scan your receipts.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Big Back needs photo access to scan receipts from your gallery.",
        },
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Big Back uses your location to detect when you're at a restaurant and remind you to log your spend.",
          locationWhenInUsePermission:
            "Big Back uses your location to find nearby restaurants.",
          isIosBackgroundLocationEnabled: true,
        },
      ],
    ],
    extra: {
      router: {},
      eas: {
        projectId: "347b5046-283d-4376-9195-d50d77663dd9",
      },
      appVariant: variant,
    },
    owner: "karsai1232",
  },
};
