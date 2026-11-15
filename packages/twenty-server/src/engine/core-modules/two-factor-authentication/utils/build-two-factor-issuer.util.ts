import { BRAND } from 'twenty-shared/constants';

// The issuer is the label the team reads in its authenticator app.
export const buildTwoFactorIssuer = (workspaceDisplayName?: string | null) =>
  workspaceDisplayName ? `${BRAND.name} - ${workspaceDisplayName}` : BRAND.name;
