import { createAction } from '@reduxjs/toolkit'

export const Field = {
  CURRENCY_A: 'CURRENCY_A',
  CURRENCY_B: 'CURRENCY_B',
}

export const Bound = {
  LOWER: 'LOWER',
  UPPER: 'UPPER',
}

export const typeInput = createAction('fusion/typeInputMint')
export const typeStartPriceInput = createAction('fusion/typeStartPriceInput')
export const typeLeftRangeInput = createAction('fusion/typeLeftRangeInput')
export const typeRightRangeInput = createAction('fusion/typeRightRangeInput')
export const resetMintState = createAction('fusion/resetMintState')
export const setFullRange = createAction('fusion/setFullRange')
export const updateDynamicFee = createAction('fusion/updateDynamicFee')
export const updateSelectedPreset = createAction('fusion/updateSelectedPreset')
export const setInitialTokenPrice = createAction('fusion/setInitialTokenPrice')
export const updateCurrentStep = createAction('fusion/setCurrentStep')
export const selectCurrency = createAction('fusion/selectCurrency')
export const updateLiquidityRangeType = createAction('fusion/setliquidityRangeType')
export const updatePresetRange = createAction('fusion/setPresetRange')
