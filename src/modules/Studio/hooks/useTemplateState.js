'use client'

import { useEffect, useMemo, useState } from 'react'

export default function useTemplateState(tpl, searchParams) {
  console.log({ searchParams })
  // defaults state
  const initial = useMemo(
    () => ({
      ...(tpl?.defaults || {}),
      background: '3d',
      gridStyle: '3d',
    }),
    [tpl],
  )

  const [state, setState] = useState(initial)

  // if tpl change -> reset state
  useEffect(() => {
    setState(initial)
  }, [initial])

  const setField = (k, v) => {
    setState(prev => {
      const next = { ...prev, [k]: v }

      // change displayCount Sync pairs again
      if (k === 'displayCount') {
        const count = Number(v) || 0
        const pairs = Array.isArray(prev.pairs) ? [...prev.pairs] : []
        next.pairs = pairs.slice(0, count)
      }

      return next
    })
  }

  const reset = () => setState(initial)

  return { state, setField, reset }
}
