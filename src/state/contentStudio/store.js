'use client'

import { create } from 'zustand'

const buildInitial = tpl => ({
  ...(tpl?.defaults || {}),
})

export const useTemplateStore = create((set, get) => ({
  // --- GLOBAL state ---
  background: {
    id: 1,
    name: '3D Grid',
    image: '/images/content-studio/bg_1.png',
    value: '/images/content-studio/bg_1.png',
  },
  setBackground: bg => set({ background: bg }),

  // --- PER-SLUG ---
  templates: {}, // { [slug]: { state, defaults } }

  initTemplate: (slug, tpl) => {
    const defaults = buildInitial(tpl)
    set(s => {
      const existed = s.templates[slug]
      return {
        templates: {
          ...s.templates,
          [slug]: existed ? { ...existed, defaults } : { state: defaults, defaults },
        },
      }
    })
  },

  setField: (slug, k, v) => {
    if (k === 'background') {
      set({ background: v })
      return
    }

    set(s => {
      const entry = s.templates[slug] || { state: {}, defaults: {} }
      const prev = entry.state || {}
      const next = { ...prev, [k]: v }

      if (k === 'displayCount') {
        const count = Number(v) || 0
        const pairs = Array.isArray(prev.pairs) ? [...prev.pairs] : []
        next.pairs = pairs.slice(0, count)
      }

      return {
        templates: {
          ...s.templates,
          [slug]: { ...entry, state: next },
        },
      }
    })
  },

  setMany: (slug, patch) => {
    set(s => {
      const { background: bgFromPatch, ...rest } = patch || {}
      const entry = s.templates[slug] || { state: {}, defaults: {} }
      const prev = entry.state || {}
      const next = { ...prev, ...rest }

      const updates = {
        templates: {
          ...s.templates,
          [slug]: { ...entry, state: next },
        },
      }

      if (bgFromPatch !== undefined) {
        updates.background = bgFromPatch
      }

      return updates
    })
  },

  reset: slug => {
    const { templates } = get()
    const entry = templates[slug]
    if (!entry) return
    set({
      templates: {
        ...templates,
        [slug]: { ...entry, state: entry.defaults },
      },
    })
  },
}))
