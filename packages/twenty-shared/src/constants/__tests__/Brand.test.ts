import { BRAND } from '../Brand';

describe('BRAND', () => {
  it('carries the HubFaze name, addresses and logo paths', () => {
    expect(BRAND).toEqual({
      name: 'HubFaze',
      appUrl: 'https://crm.interfaze.fr',
      websiteUrl: 'https://interfaze.fr',
      sourceCodeUrl: 'https://github.com/laouaniFaouzi/twenty',
      legalNoticeUrl: 'https://interfaze.fr/mentions-legales',
      privacyPolicyUrl: 'https://interfaze.fr/confidentialite',
      logoPath: '/images/icons/android/android-launchericon-192-192.png',
      emailLogoPath: '/images/hubfaze/email-logo.png',
      companyLine: 'Interfaze · Tomblaine (Nancy)',
    });
  });
});
