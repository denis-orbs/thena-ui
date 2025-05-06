import { create } from 'zustand'

export const useFarmRewards = create()(set => ({
  rewards: {
    ichi: new Map(),
    gamma: new Map(),
    manual: new Map(),
    oldGauge: new Map(),
    newGauge: new Map(),
  },

  fees: {
    ichi: new Map(),
    gamma: new Map(),
    manual: new Map(),
    classic: new Map(),
    stable: new Map(),
    weighted: new Map(),
  },

  /**
   * Add a reward to the farm rewards
   * @param {Object} position - The reward position to add
   * @param {string} position.symbol - The pool symbol
   * @param {string} position.type - The reward type: ichi | gamma | manual | classic | stable | weighted
   * @param {string} position.key - The reward key
   * @param {number} position.amount - The reward  amount
   * @param {string} position.args - The reward args used to call smart contract
   */
  addReward: position =>
    set(state => {
      let { type } = position
      const { key } = position
      if (type === 'classic' || type === 'stable' || type === 'weighted') type = 'newGauge'

      delete position.type
      delete position.key
      return {
        rewards: {
          ...state.rewards,
          [type]: state.rewards[type].set(key, position),
        },
      }
    }),

  addFees: position =>
    set(state => {
      const { type } = position
      const { key } = position
      delete position.type
      delete position.key
      return {
        fees: {
          ...state.fees,
          [type]: state.fees[type].set(key, position),
        },
      }
    }),
}))

export const getKeyFromTokenAddress = (type, tokenAddresses) => {
  const key = tokenAddresses.join('_')
  return `${type}_${key}`
}
