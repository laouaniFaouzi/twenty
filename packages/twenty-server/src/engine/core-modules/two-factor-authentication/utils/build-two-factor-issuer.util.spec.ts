import { buildTwoFactorIssuer } from 'src/engine/core-modules/two-factor-authentication/utils/build-two-factor-issuer.util';

describe('buildTwoFactorIssuer', () => {
  it('names HubFaze and the workspace in the authenticator app', () => {
    expect(buildTwoFactorIssuer('Interfaze')).toBe('HubFaze - Interfaze');
  });

  it('names HubFaze alone when the workspace has no name', () => {
    expect(buildTwoFactorIssuer(undefined)).toBe('HubFaze');
    expect(buildTwoFactorIssuer('')).toBe('HubFaze');
  });
});
