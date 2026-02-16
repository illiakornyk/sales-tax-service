import { ENV_KEYS } from '../constants/env.constants';

type DatabaseEnv = NodeJS.ProcessEnv;

function getRequiredEnvValue<K extends keyof DatabaseEnv>(
  env: DatabaseEnv,
  key: K,
): string {
  const value = env[key];
  if (!value) {
    throw new Error(`${String(key)} is not set`);
  }
  return value;
}

export function buildDatabaseUrl(env: DatabaseEnv = process.env): string {
  const host = getRequiredEnvValue(env, ENV_KEYS.DB_HOST);
  const port = getRequiredEnvValue(env, ENV_KEYS.DB_PORT);
  const dbName = getRequiredEnvValue(env, ENV_KEYS.DB_NAME);
  const user = getRequiredEnvValue(env, ENV_KEYS.DB_USER);
  const password = getRequiredEnvValue(env, ENV_KEYS.DB_PASSWORD);

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(dbName)}`;
}
