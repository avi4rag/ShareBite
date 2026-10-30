const stripTrailingSlash = value => value?.trim().replace(/\/+$/, '') || '';
const configuredApi = stripTrailingSlash(import.meta.env.VITE_API_URL);
export const apiOrigin = configuredApi.replace(/\/api$/, '');
export const socketOrigin = stripTrailingSlash(import.meta.env.VITE_SOCKET_URL) || apiOrigin;

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const pathname = `/${String(path).replace(/^\/+/, '')}`;
  return `${apiOrigin}${pathname === '/api' || pathname.startsWith('/api/') ? pathname : `/api${pathname}`}`;
}

export function assetUrl(path) {
  if (!path || /^(https?:|data:|blob:)/i.test(path)) return path;
  if (/^\/(api\/uploads|seed-assets|uploads)(\/|$)/.test(path)) return `${apiOrigin}${path}`;
  return path;
}
