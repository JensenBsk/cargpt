import type { CapacitorConfig } from "@capacitor/cli";

// Native shell strategy: the WebView loads the production site so the
// Next.js server features (API routes, SSR share pages) keep working.
// Native plugins (Haptics, Camera, StatusBar, Keyboard) are bridged in
// via lib/native.ts, which no-ops on plain web.
//
// App Store note: Apple rejects thin wrappers (guideline 4.2) unless the
// app feels native — the haptics, splash screen, status bar handling,
// keyboard avoidance, and OBD2 Bluetooth integration are what justify it.
const config: CapacitorConfig = {
  appId: "com.mechaniccarlos.app",
  appName: "Mechanic Carlos",
  webDir: "public/native-shell", // placeholder shell; real content loads from server.url
  server: {
    url: "https://mchaniccarlos.com",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
    scheme: "MechanicCarlos",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#060810",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#060810",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
