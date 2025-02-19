import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export const useUpdateSearchParams = () => {
  const { replace, push } = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  return useCallback(
    (updates, usePush = false) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      const newPath = params.toString() ? `${pathname}?${params.toString()}` : pathname

      return usePush ? push(newPath) : replace(newPath)
    },
    [searchParams, pathname, push, replace],
  )
}
