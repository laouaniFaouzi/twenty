import { describe, expect, it } from 'vitest';

import application from 'src/application-config';

describe('application config', () => {
  it('declares the site sync variables, with the two secrets marked secret', () => {
    const variables = application.config.applicationVariables ?? {};

    expect(
      Object.fromEntries(
        Object.entries(variables).map(([name, variable]) => [
          name,
          variable.isSecret === true,
        ]),
      ),
    ).toEqual({
      SUPABASE_URL: false,
      SUPABASE_SECRET_KEY: true,
      HUBFAZE_WEBHOOK_SECRET: true,
      LEAD_OWNER_EMAIL: false,
      SITE_URL: false,
    });
  });

  it('points the client tracker links to interfaze.fr by default', () => {
    const siteUrl = application.config.applicationVariables?.SITE_URL;

    expect(siteUrl !== undefined && 'value' in siteUrl && siteUrl.value).toBe(
      'https://interfaze.fr',
    );
  });

  it('labels and describes every variable', () => {
    for (const variable of Object.values(
      application.config.applicationVariables ?? {},
    )) {
      expect(variable.label).toBeTruthy();
      expect(variable.description).toBeTruthy();
    }
  });
});
