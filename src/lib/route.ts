export type Route = 'home' | 'medical-bill-checker'

export const MEDICAL_BILL_PATH = '/tools/medical-bill-checker'

/** Maps a URL path to a page. Unknown paths keep showing the homepage, as before. */
export function resolveRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/'
  return path === MEDICAL_BILL_PATH ? 'medical-bill-checker' : 'home'
}
