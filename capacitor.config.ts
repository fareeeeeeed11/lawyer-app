import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lawyer.justice',
  appName: 'Mr. Lawyer',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['192.168.0.145:3000']
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
