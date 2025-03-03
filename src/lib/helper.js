export function getFromLocalStorage(key) {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(key)
  }
  return null
}

export function getFromSessionStorage(key) {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(key)
  }
  return null
}

export const getTokenInfo = ({ tokenAddress, assets, customAssets }) => {
  if (!tokenAddress) return undefined

  let token = assets.find(item => item.address.toLowerCase() === tokenAddress.toLowerCase())
  if (!token) {
    token = customAssets.find(item => item.address.toLowerCase() === tokenAddress.toLowerCase())
    if (token) {
      token.isWarning = true
    }
  }
  return token
}

export const formatDelta = (delta, locale = 'en-US') => {
  if (delta === null || delta === undefined || delta === Infinity || isNaN(delta)) {
    return '-'
  }

  return `${Number(Math.abs(delta).toFixed(2)).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  })}%`
}
