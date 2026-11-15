import { Img } from 'react-email';
import { BRAND } from 'twenty-shared/constants';

const logoStyle = {
  marginBottom: '40px',
};

export const Logo = () => {
  return (
    <Img
      src={`${BRAND.appUrl}${BRAND.emailLogoPath}`}
      alt={BRAND.name}
      width="236"
      height="40"
      style={logoStyle}
    />
  );
};
