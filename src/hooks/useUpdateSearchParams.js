import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export const useUpdateSearchParams = () => {
  const { replace } = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  return useCallback(
    updates => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      const newPath = params.toString() ? `${pathname}?${params.toString()}` : pathname

      return replace(newPath)
    },
    [replace, searchParams, pathname],
  )
}
