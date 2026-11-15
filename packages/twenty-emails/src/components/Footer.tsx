import { type I18n } from '@lingui/core';
import { Column, Container, Row } from 'react-email';
import { Link } from 'src/components/Link';
import { ShadowText } from 'src/components/ShadowText';
import { BRAND } from 'twenty-shared/constants';

const footerContainerStyle = {
  marginTop: '12px',
};

type FooterProps = {
  i18n: I18n;
};

export const Footer = ({ i18n }: FooterProps) => {
  return (
    <Container style={footerContainerStyle}>
      <Row>
        <Column>
          <ShadowText>
            <Link
              href={BRAND.websiteUrl}
              value={i18n._('Website')}
              aria-label={i18n._('Visit the website')}
            />
          </ShadowText>
        </Column>
        <Column>
          <ShadowText>
            <Link
              href={BRAND.sourceCodeUrl}
              value={i18n._('Source code')}
              aria-label={i18n._('View the source code')}
            />
          </ShadowText>
        </Column>
      </Row>
      <ShadowText>{BRAND.companyLine}</ShadowText>
    </Container>
  );
};
