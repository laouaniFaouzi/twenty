import { Font, Head } from 'react-email';

import { canvasTheme } from 'src/common-style';
import { BRAND } from 'twenty-shared/constants';

export const BaseHead = () => {
  return (
    <Head>
      <title>{BRAND.name}</title>
      <Font
        fontFamily={canvasTheme.font.family}
        fallbackFontFamily="sans-serif"
        fontStyle="normal"
        fontWeight={canvasTheme.font.weight.regular}
      />
    </Head>
  );
};
