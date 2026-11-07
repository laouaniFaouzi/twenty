export type SyncSettings = {
  supabaseUrl: string;
  supabaseSecretKey: string;
  webhookSecret: string;
  leadOwnerEmail: string | null;
  siteUrl: string;
};

const DEFAULT_SITE_URL = 'https://interfaze.fr';

type SyncSettingsResult =
  | { success: true; settings: SyncSettings }
  | { success: false; error: string };

const REQUIRED_VARIABLES = [
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'HUBFAZE_WEBHOOK_SECRET',
] as const;

const readVariable = (
  env: Record<string, string | undefined>,
  name: string,
): string | null => {
  const value = env[name]?.trim();

  return value ? value : null;
};

export const readSyncSettings = (
  env: Record<string, string | undefined>,
): SyncSettingsResult => {
  const missing = REQUIRED_VARIABLES.filter(
    (name) => readVariable(env, name) === null,
  );

  if (missing.length > 0) {
    return {
      success: false,
      error: `Variables manquantes : ${missing.join(', ')}`,
    };
  }

  return {
    success: true,
    settings: {
      supabaseUrl: (readVariable(env, 'SUPABASE_URL') ?? '').replace(
        /\/+$/,
        '',
      ),
      supabaseSecretKey: readVariable(env, 'SUPABASE_SECRET_KEY') ?? '',
      webhookSecret: readVariable(env, 'HUBFAZE_WEBHOOK_SECRET') ?? '',
      leadOwnerEmail: readVariable(env, 'LEAD_OWNER_EMAIL'),
      siteUrl: (readVariable(env, 'SITE_URL') ?? DEFAULT_SITE_URL).replace(
        /\/+$/,
        '',
      ),
    },
  };
};
