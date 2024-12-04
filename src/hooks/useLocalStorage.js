'use client'

import { useCallback } from 'react'

export const LOCAL_STORAGE_TOKENS = 'LOCAL_STORAGE_TOKENS'

export const useLocalStorage = () => {
  const getWithExpiry = key => {
    if (typeof window !== 'undefined') {
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
  }

  const setWithExpiry = useCallback((key, value, ttl) => {
    if (typeof window !== 'undefined') {
      const now = new Date()

      const item = {
        value,
        expiry: now.getTime() + ttl,
      }
      localStorage.setItem(key, JSON.stringify(item))
    }
  }, [])
  return { getWithExpiry, setWithExpiry }
}
