import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lowkeygem.app',
  appName: 'Lowkey Gem',
  webDir: 'build',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#970747',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#970747',
      androidSplashResourceName: 'splash',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    },
  },
}

export default config
