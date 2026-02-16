export const ENV_KEYS = {
  ADMIN_API_KEY: 'ADMIN_API_KEY',
  DATABASE_URL: 'DATABASE_URL',
} as const;

export type EnvKey = (typeof ENV_KEYS)[keyof typeof ENV_KEYS];

export const REQUIRED_ENV_KEYS: readonly EnvKey[] = [
  ENV_KEYS.ADMIN_API_KEY,
  ENV_KEYS.DATABASE_URL,
];
