import { create } from 'zustand'

import { Presets } from '../fusion/reducer'

export const useAprStore = create(set => ({
  APRs: {
    current: 0,
    [Presets.FULL]: 0,
    [Presets.SAFE]: 0,
    [Presets.NORMAL]: 0,
    [Presets.RISK]: 0,
    [Presets.STABLE]: 0,
  },

  setAPRs: data =>
    set(state => ({
      ...state,
      APRs: {
        ...data,
      },
    })),
}))
