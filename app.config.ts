const variant = process.env.APP_VARIANT;
const isDev = variant === "dev";

const DEV_EAS_PROJECT_ID = "aee07193-9652-4ea1-b7ee-928237f3030b";
const PROD_EAS_PROJECT_ID = "6bf49a08-3207-43ba-b65d-a4d0b3e3be05";

const updatesUrl = isDev
  ? `https://u.expo.dev/${DEV_EAS_PROJECT_ID}`
  : `https://u.expo.dev/${PROD_EAS_PROJECT_ID}`;

export default {
  expo: {
    owner: "siondw",
    name: isDev ? "SBHQ Dev" : "SBHQ",
    slug: isDev ? "sbhq-mobile-dev" : "sbhq-mobile",
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
    updates: {
      url: updatesUrl,
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: isDev
        ? "com.anonymous.sbhqmobile.dev"
        : "com.anonymous.sbhqmobile",
      icon: "./assets/images/SBHQ_IOS_ICON_1024x1024.png",
      infoPlist: {
        CFBundleDisplayName: isDev ? "SBHQ Dev" : "SBHQ",
        ITSAppUsesNonExemptEncryption: false,
      },
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
      appVariant: isDev ? "dev" : "prod",
      eas: {
        projectId: isDev ? DEV_EAS_PROJECT_ID : PROD_EAS_PROJECT_ID,
      },
    },
  },
};
