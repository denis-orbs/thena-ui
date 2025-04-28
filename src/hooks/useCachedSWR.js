import { useMemo, useRef } from 'react'
import useSWR from 'swr'

export const useCachedSWR = (key, fetcher, options = {}) => {
  const prevData = useRef([])
  const { data, isLoading, error, ...rest } = useSWR(key, fetcher, options)

  const cachedData = useMemo(() => {
    if (!data || isLoading || error) {
      return prevData.current
    }
    prevData.current = data
    return data
  }, [data, error, isLoading])

  return { data: cachedData, error, isLoading, ...rest }
}
