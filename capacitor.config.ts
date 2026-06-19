import type { CapacitorConfig } from '@capacitor/cli';

// Capacitor wraps the built web app as a native iOS/Android shell.
// Replace `server.url` with your own published URL after publishing in Lovable
// (or remove `server` entirely to ship the bundled web assets from /dist).
const config: CapacitorConfig = {
  appId: 'app.lovable.f26arena',
  appName: 'F26 Arena',
  webDir: 'dist/client',
  backgroundColor: '#0a1320',
  ios: {
    contentInset: 'always',
    backgroundColor: '#0a1320',
  },
  android: {
    backgroundColor: '#0a1320',
  },
};

export default config;
