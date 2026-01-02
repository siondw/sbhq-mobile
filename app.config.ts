const profile = process.env.EAS_BUILD_PROFILE; // set by EAS during builds
const isDev = profile === "development";

export default {
  expo: {
    name: "SBHQ",
    slug: "sbhq-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: isDev ? "sbhqmobile-dev" : "sbhqmobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0A1018",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: isDev
        ? "com.anonymous.sbhqmobile.dev"
        : "com.anonymous.sbhqmobile",
      icon: "./assets/images/SBHQ_IOS_ICON_1024x1024.png",
      infoPlist: { ITSAppUsesNonExemptEncryption: false },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0A1018",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: isDev
        ? "com.anonymous.sbhqmobile.dev"
        : "com.anonymous.sbhqmobile",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: ["expo-router", "expo-notifications", "expo-web-browser"],
    experiments: { typedRoutes: true },
    extra: {
      router: {},
      eas: { projectId: "6bf49a08-3207-43ba-b65d-a4d0b3e3be05" },
    },
  },
};
