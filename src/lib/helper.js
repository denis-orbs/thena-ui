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
