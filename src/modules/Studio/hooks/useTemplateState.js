'use client'

import { useEffect, useMemo } from 'react'

import { useTemplateStore } from '@/state/contentStudio/store'

// background is global state for all slug, it'll not update if slug change
export default function useTemplateState(slug, tpl, searchParams) {
  const initTemplate = useTemplateStore(s => s.initTemplate)
  const setFieldStore = useTemplateStore(s => s.setField)
  const setManyStore = useTemplateStore(s => s.setMany)
  const resetStore = useTemplateStore(s => s.reset)

  const perSlugState = useTemplateStore(s => s.templates[slug]?.state)
  const background = useTemplateStore(s => s.background)
  const setBackground = useTemplateStore(s => s.setBackground)

  // init value slug + tpl
  useEffect(() => {
    if (!slug && !tpl) return
    initTemplate(slug, tpl)
  }, [slug, tpl, initTemplate])

  // hydrate from searchParams
  useEffect(() => {
    if (!slug || !searchParams) return
    const displayCount = searchParams.get?.('displayCount')
    if (displayCount != null) {
      setFieldStore(slug, 'displayCount', displayCount)
    }
  }, [slug, searchParams, setFieldStore])

  // view state
  const state = useMemo(() => ({ ...(perSlugState || {}), background }), [perSlugState, background])

  const setField = (k, v) => {
    if (k === 'background') setBackground(v)
    else setFieldStore(slug, k, v)
  }

  const setMany = patch => setManyStore(slug, patch)

  const reset = () => resetStore(slug)

  return { state, setField, setMany, reset }
}
