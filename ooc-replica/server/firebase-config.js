// Only this explicit public allowlist may leave the server. Never serialize process.env.
export function firebaseConfig(env = process.env) {
  const config = {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    appId: env.FIREBASE_APP_ID,
  };
  if (Object.values(config).some(value => !value?.trim())) return null;
  return { config, providers: { google: true, apple: env.FIREBASE_APPLE_ENABLED === 'true' } };
}
