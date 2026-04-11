import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.tehwolf',
  appName: 'Numveil',
  webDir: '../dist/apps/numveil/browser',
  server: {
    androidScheme: 'https',
  },
};

export default config;
