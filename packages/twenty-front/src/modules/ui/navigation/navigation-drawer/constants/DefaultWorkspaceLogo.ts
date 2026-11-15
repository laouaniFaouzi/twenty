import { BRAND } from 'twenty-shared/constants';
// Absolute: logo helpers would send a bare path to the server's /files route.
export const DEFAULT_WORKSPACE_LOGO = `${window.location.origin}${BRAND.logoPath}`;
