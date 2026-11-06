import { describe, expect, it } from 'vitest';

import { readSyncSettings } from 'src/utils/sync-settings';

const COMPLETE_ENV = {
  SUPABASE_URL: 'https://abc.supabase.co',
  SUPABASE_SECRET_KEY: 'sb_secret_xyz',
  HUBFAZE_WEBHOOK_SECRET: 'webhook-secret',
  LEAD_OWNER_EMAIL: 'tim@apple.dev',
};

describe('readSyncSettings', () => {
  it('reads the four variables', () => {
    expect(readSyncSettings(COMPLETE_ENV)).toEqual({
      success: true,
      settings: {
        supabaseUrl: 'https://abc.supabase.co',
        supabaseSecretKey: 'sb_secret_xyz',
        webhookSecret: 'webhook-secret',
        leadOwnerEmail: 'tim@apple.dev',
      },
    });
  });

  it('drops a trailing slash from the Supabase URL', () => {
    const result = readSyncSettings({
      ...COMPLETE_ENV,
      SUPABASE_URL: 'https://abc.supabase.co/',
    });

    expect(result.success && result.settings.supabaseUrl).toBe(
      'https://abc.supabase.co',
    );
  });

  it('leaves the lead owner empty when the variable is empty or missing', () => {
    const empty = readSyncSettings({ ...COMPLETE_ENV, LEAD_OWNER_EMAIL: '' });
    const missing = readSyncSettings({
      ...COMPLETE_ENV,
      LEAD_OWNER_EMAIL: undefined,
    });

    expect(empty.success && empty.settings.leadOwnerEmail).toBeNull();
    expect(missing.success && missing.settings.leadOwnerEmail).toBeNull();
  });

  it('names every missing required variable', () => {
    const result = readSyncSettings({ SUPABASE_SECRET_KEY: '  ' });

    expect(result).toEqual({
      success: false,
      error:
        'Variables manquantes : SUPABASE_URL, SUPABASE_SECRET_KEY, HUBFAZE_WEBHOOK_SECRET',
    });
  });
});
