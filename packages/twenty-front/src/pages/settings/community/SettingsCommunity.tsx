import { SettingsCard } from '@/settings/components/SettingsCard';
import { SettingsDiscoveryHeroCard } from '@/settings/components/SettingsDiscoveryHeroCard';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsLabContent } from '@/settings/lab/components/SettingsLabContent';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useContext } from 'react';
import { IconBrandGithub, IconTransform } from 'twenty-ui/icon';
import { H2Title } from 'twenty-ui/typography';
import { Section } from 'twenty-ui/layout';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import coverDark from '~/pages/settings/community/assets/cover-dark.png';
import coverLight from '~/pages/settings/community/assets/cover-light.png';
import { BRAND } from 'twenty-shared/constants';

const SETTINGS_COMMUNITY_HERO_INSTANCE_ID_PREFIX = 'settings-community-hero';

const StyledCardLink = styled.a`
  display: block;
  min-width: 0;
  text-decoration: none;
`;

const StyledFeaturesContent = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
`;

export const SettingsCommunity = () => {
  const { theme } = useContext(ThemeContext);
  const brandName = BRAND.name;

  return (
    <SettingsPageLayout
      title={t`Community`}
      links={[
        {
          children: t`Other`,
          href: getSettingsPath(SettingsPath.Community),
        },
        { children: t`Community` },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <SettingsDiscoveryHeroCard
            lightSrc={coverLight}
            darkSrc={coverDark}
            instanceIdPrefix={SETTINGS_COMMUNITY_HERO_INSTANCE_ID_PREFIX}
            tabs={[]}
          />
        </Section>

        <Section>
          <H2Title
            title={t`Source code`}
            description={t`${brandName} is built on Twenty, open-source software published under the AGPL license.`}
          />
          <StyledCardLink
            href={BRAND.sourceCodeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SettingsCard
              Icon={
                <IconBrandGithub
                  size={theme.icon.size.md}
                  stroke={theme.icon.stroke.sm}
                />
              }
              title={t`View the source code`}
            />
          </StyledCardLink>
        </Section>

        <Section>
          <H2Title
            title={t`Features`}
            description={t`Try our upcoming features. Note they are still in beta. Please bear with us and report any issues you find.`}
          />
          <StyledFeaturesContent>
            <SettingsLabContent />
            <StyledCardLink
              href="https://twenty.com/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              <SettingsCard
                Icon={
                  <IconTransform
                    size={theme.icon.size.md}
                    stroke={theme.icon.stroke.sm}
                  />
                }
                title={t`Read changelog`}
              />
            </StyledCardLink>
          </StyledFeaturesContent>
        </Section>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
