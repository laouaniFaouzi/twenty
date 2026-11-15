import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';

import { SettingsCommunity } from '~/pages/settings/community/SettingsCommunity';

jest.mock('@/settings/components/layout/SettingsPageLayout', () => ({
  SettingsPageLayout: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('@/settings/components/SettingsPageContainer', () => ({
  SettingsPageContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('@/settings/components/SettingsDiscoveryHeroCard', () => ({
  SettingsDiscoveryHeroCard: () => null,
}));

jest.mock('@/settings/lab/components/SettingsLabContent', () => ({
  SettingsLabContent: () => null,
}));

const renderCommunityPage = () =>
  render(
    <I18nProvider i18n={i18n}>
      <SettingsCommunity />
    </I18nProvider>,
  );

describe('SettingsCommunity', () => {
  it('links to the source code of HubFaze', () => {
    renderCommunityPage();

    expect(
      screen.getByText('View the source code').closest('a'),
    ).toHaveAttribute('href', 'https://github.com/laouaniFaouzi/twenty');
  });

  it('no longer sends the team to the Twenty community', () => {
    renderCommunityPage();

    const hrefs = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href') ?? '');

    expect(
      hrefs.filter((href) =>
        /discord\.com|x\.com|twenty\.com\/partners/.test(href),
      ),
    ).toEqual([]);
  });
});
