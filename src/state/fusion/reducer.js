import { createReducer } from '@reduxjs/toolkit'

import { FusionRangeType } from '@/constant'

import {
  Field,
  resetMintState,
  selectCurrency,
  setFullRange,
  setInitialTokenPrice,
  typeInput,
  typeLeftRangeInput,
  typeRightRangeInput,
  typeStartPriceInput,
  updateCurrentStep,
  updateDynamicFee,
  updateLiquidityRangeType,
  updatePresetRange,
  updateSelectedPreset,
} from './actions'

export const Presets = {
  SAFE: 'SAFE',
  RISK: 'RISK',
  NORMAL: 'NORMAL',
  FULL: 'FULL',
  STABLE: 'STABLE',
}

const initialState = {
  independentField: Field.CURRENCY_A,
  typedValue: '',
  startPriceTypedValue: '',
  leftRangeTypedValue: '',
  rightRangeTypedValue: '',
  dynamicFee: 0,
  preset: null,
  initialTokenPrice: '',
  currentStep: 0,
  [Field.CURRENCY_A]: {
    currencyId: '',
  },
  [Field.CURRENCY_B]: {
    currencyId: '',
  },
  liquidityRangeType: FusionRangeType.MANUAL_RANGE,
  presetRange: undefined,
}

export default createReducer(initialState, builder =>
  builder
    .addCase(updateDynamicFee, (state, { payload: { dynamicFee } }) => ({
      ...state,
      dynamicFee,
    }))
    .addCase(resetMintState, () => initialState)
    .addCase(setFullRange, state => ({
      ...state,
      leftRangeTypedValue: true,
      rightRangeTypedValue: true,
    }))
    .addCase(typeStartPriceInput, (state, { payload: { typedValue } }) => ({
      ...state,
      startPriceTypedValue: typedValue,
    }))
    .addCase(typeLeftRangeInput, (state, { payload: { typedValue } }) => ({
      ...state,
      leftRangeTypedValue: typedValue,
    }))
    .addCase(typeRightRangeInput, (state, { payload: { typedValue } }) => ({
      ...state,
      rightRangeTypedValue: typedValue,
    }))
    .addCase(typeInput, (state, { payload: { field, typedValue, noLiquidity } }) => {
      if (noLiquidity) {
        if (field === state.independentField) {
          // they're typing into the field they've last typed in
          return {
            ...state,
            independentField: field,
            typedValue,
          }
        }
        // they're typing into a new field, store the other value
        return {
          ...state,
          independentField: field,
          typedValue,
        }
      }
      return {
        ...state,
        independentField: field,
        typedValue,
      }
    })
    .addCase(updateSelectedPreset, (state, { payload: { preset } }) => ({
      ...state,
      preset,
    }))
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      const otherField = field === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A
      if (currencyId === state[otherField].currencyId) {
        // the case where we have to swap the order
        return {
          ...state,
          independentField: state.independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A,
          [field]: { currencyId },
          [otherField]: { currencyId: state[field].currencyId },
        }
      }
      // the normal case
      return {
        ...state,
        [field]: { currencyId },
      }
    })
    .addCase(setInitialTokenPrice, (state, { payload: { typedValue } }) => ({
      ...state,
      initialTokenPrice: typedValue,
    }))
    .addCase(updateCurrentStep, (state, { payload: { currentStep } }) => ({
      ...state,
      currentStep,
    }))
    .addCase(updateLiquidityRangeType, (state, { payload: { liquidityRangeType } }) => ({
      ...state,
      liquidityRangeType,
    }))
    .addCase(updatePresetRange, (state, { payload: { presetRange } }) => ({
      ...state,
      presetRange,
    })),
)
