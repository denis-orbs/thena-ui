// define constants
export const PATH_NAME = {
  POOL_APR: '/content-studio/pools-apr',
  INCENTIVES: '/content-studio/incentives',
  PORTFOLIO: '/content-studio/portfolio',
  METRICS: '/content-studio/metrics',
}

export function normalizeAssetUrl(url) {
  if (!url) return url
  try {
    const u = new URL(url)
    if (u.hostname === 'cdn.thena.fi') {
      return u.pathname
    }
    return url
  } catch {
    return url
  }
}
