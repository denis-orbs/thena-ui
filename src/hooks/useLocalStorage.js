export const useLocalStorage = () => {
  const getWithExpiry = key => {
    const itemStr = localStorage.getItem(key)

    if (!itemStr) {
      return null
    }

    const item = JSON.parse(itemStr)
    const now = new Date()

    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key)
      return null
    }

    return item.value
  }

  const setWithExpiry = (key, value, ttl) => {
    const now = new Date()

    const item = {
      value,
      expiry: now.getTime() + ttl,
    }
    localStorage.setItem(key, JSON.stringify(item))
  }

  return { getWithExpiry, setWithExpiry }
}
