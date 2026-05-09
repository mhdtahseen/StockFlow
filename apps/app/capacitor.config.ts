import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hyllos.finventree',
  appName: 'Finventree',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#064a98',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      // overlaysWebView: true → WebView extends edge-to-edge behind the status bar.
      // The header uses env(safe-area-inset-top) to push content below the bar.
      // Style is dynamically updated by ThemeContext to match the active theme.
      style: 'dark', // dark icons — visible on white (light mode) header by default
      overlaysWebView: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
