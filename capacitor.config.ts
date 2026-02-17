import type { CapacitorConfig } from '@capacitor/cli';

const appUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.partsvertical.app',
  appName: 'Parts Vertical',
  webDir: 'out',
  server: appUrl
    ? {
        url: appUrl,
        cleartext: appUrl.startsWith('http://')
      }
    : undefined
};

export default config;
