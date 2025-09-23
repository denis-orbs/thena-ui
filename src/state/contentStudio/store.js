'use client'

import { create } from 'zustand'

const makeTplKey = tpl => (tpl && tpl.title) || {}

const buildInitial = tpl => ({
  ...((tpl && tpl.defaults) || {}),
})

export const useTemplateStore = create((set, get) => ({
  // --- GLOBAL state ---
  background: {
    id: 1,
    name: '3D Grid',
    image: '/images/content-studio/3d_grid.png',
    value: '/images/content-studio/3d_grid_option.png',
  },
  setBackground: bg => set({ background: bg }),

  // --- PER-SLUG ---
  templates: {},

  initTemplate: (slug, tpl) => {
    const defaults = buildInitial(tpl)
    const tplKey = makeTplKey(tpl)

    set(s => {
      const existed = s.templates[slug]

      if (!existed || existed.tplKey !== tplKey) {
        return {
          templates: {
            ...s.templates,
            [slug]: { state: defaults, defaults, tplKey },
          },
        }
      }

      return {
        templates: {
          ...s.templates,
          [slug]: { ...existed, defaults },
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

      if (typeof bgFromPatch !== 'undefined') {
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
