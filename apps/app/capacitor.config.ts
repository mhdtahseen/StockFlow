import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hyllos.finventree',
  appName: 'Finventree',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#064a98',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      // overlaysWebView: false → WebView sits below the status bar.
      // The OS reserves the status bar area — no safe-area padding needed in the app.
      // ThemeContext calls setBackgroundColor + setStyle on every theme change.
      overlaysWebView: false,
      style: 'light',           // dark icons — visible on white background (light mode default)
      backgroundColor: '#ffffff', // white — matches light-mode AppHeader bg
    },
    Keyboard: {
      // resize: 'native' → resizes the entire WKWebView frame on iOS, identical to Android.
      // This ensures that the webview automatically scrolls focused inputs into view.
      resize: 'native',
      resizeOnFullScreen: true,
      // style: 'dark' → keyboard appearance matches the current theme (set dynamically)
      style: 'light',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    // Register the custom URL scheme so the OS routes
    // com.hyllos.finventree://callback back into this app
    // after a user taps an auth email link on their phone.
    App: {
      appUrlOpen: true,
    },
  },
};

export default config;
