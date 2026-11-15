import { type BrandCheckException } from './find-brand-violations';

const CLOUD_ONLY =
  'Twenty Cloud screen or email (billing, Enterprise, DPA), absent from the self-hosted HubFaze';

// Each entry keeps a "Twenty" on purpose; BRANDING.md says when one may be added.
export const BRAND_CHECK_EXCEPTIONS: BrandCheckException[] = [
  {
    path: 'packages/twenty-front/src/modules/settings/billing/',
    reason: CLOUD_ONLY,
  },
  {
    path: 'packages/twenty-front/src/pages/settings/enterprise/',
    reason: CLOUD_ONLY,
  },
  {
    path: 'packages/twenty-front/src/modules/settings/legal/',
    reason: CLOUD_ONLY,
  },
  {
    path: 'packages/twenty-front/src/pages/settings/legal/',
    reason: CLOUD_ONLY,
  },
  {
    path: 'packages/twenty-server/src/engine/core-modules/billing/',
    reason: CLOUD_ONLY,
  },
  {
    path: 'packages/twenty-emails/src/emails/billing-trial-converting.email.tsx',
    reason: CLOUD_ONLY,
  },
  {
    path: 'packages/twenty-emails/src/emails/clean-suspended-workspace.email.tsx',
    reason: CLOUD_ONLY,
  },
  {
    path: 'packages/twenty-front/src/pages/settings/community/SettingsCommunity.tsx',
    text: 'is built on Twenty, open-source software published under the AGPL license.',
    reason:
      'Licence notice: the AGPL asks to say where the network software comes from',
  },
  {
    path: 'packages/twenty-front/src/modules/apollo/services/apollo.factory.ts',
    text: 'Twenty',
    reason:
      'Name of the GraphQL logger in the browser console, seen by developers only',
  },
];
