// define constants
export const PATH_NAME = {
  POOL_APR: '/content-studio/pools-apr',
  INCENTIVES: '/content-studio/incentives',
  PORTFOLIO: '/content-studio/portfolio',
  METRICS: '/content-studio/metrics',
}

export const METRICS_TYPE = {
  KEY_METRICS: 'Key Metrics',
  RECENT_ACTIVITY: 'Recent Activity',
}

export const normalizeAssetUrl = (url, size = '400x400') => {
  if (!url) return url
  try {
    const u = new URL(url)
    if (u.hostname === 'cdn.thena.fi') {
      return `/logos/${size}/${u.pathname.replace('/logos/', '')}`
    }
    return url
  } catch {
    return url
  }
}

export const calculateProfitPerDay = (apr, amount) => {
  if (!apr || !amount) {
    return 0
  }
  const profit = Number(amount) * (Number(apr) / (100 * 365))
  return profit
}
