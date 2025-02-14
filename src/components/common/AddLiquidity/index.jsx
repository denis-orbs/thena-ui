'use client'

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { PAIR_TYPES } from '@/constant'
import { useGetAsset } from '@/hooks/fusion/Tokens'
import { useV3MintState } from '@/state/fusion/hooks'

import ChooseStrategy from './ChooseStrategy'
import FusionAdd from './FusionAdd'
import ManualAdd from './FusionAdd/ManualAdd'
import SelectPair from './SelectPair'
import V1Add from './V1Add'

let init = false

export default function AddLiquidity({ currentStep, setCurrentStep, pool, isModal = false, isAdd = false }) {
  const { strategy } = useV3MintState()
  const { isReverse } = useSelector(state => state.fusion)
  const [pairType, setPairType] = useState(PAIR_TYPES.LSD)
  const [firstAddress, setFirstAddress] = useState()
  const [secondAddress, setSecondAddress] = useState()

  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

  const [slippage, setSlippage] = useState(0.5)

  useEffect(() => {
    if (!init && pool) {
      init = true
      setPairType(pool.type)
      setFirstAddress(pool.token0.address)
      setSecondAddress(pool.token1.address)
    }
  }, [pool])

  useEffect(() => () => (init = false), [])

  return (
    <>
      {currentStep === 0 && (
        <SelectPair
          fromAsset={firstAsset}
          setFromAddress={setFirstAddress}
          toAsset={secondAsset}
          setToAddress={setSecondAddress}
          pairType={pairType}
          setPairType={setPairType}
          setCurrentStep={setCurrentStep}
          isModal={isModal}
        />
      )}

      {currentStep === 1 &&
        (pairType === PAIR_TYPES.LSD ? (
          <ChooseStrategy
            pool={pool}
            pairType={pairType}
            firstAsset={firstAsset}
            secondAsset={secondAsset}
            setCurrentStep={setCurrentStep}
            isReverse={isReverse}
            isModal={isModal}
          />
        ) : (
          <V1Add
            pairType={pairType}
            firstAsset={firstAsset}
            setFirstAddress={setFirstAddress}
            secondAsset={secondAsset}
            setSecondAddress={setSecondAddress}
            isModal={isModal}
            isAdd={isAdd}
            slippage={slippage}
            setSlippage={setSlippage}
          />
        ))}

      {currentStep === 2 &&
        (strategy.isAutomatic ? (
          <FusionAdd strategy={isAdd ? pool : strategy} isModal={isModal} isAdd={isAdd} />
        ) : (
          <ManualAdd
            firstAsset={firstAsset}
            secondAsset={secondAsset}
            isReverse={isReverse}
            slippage={slippage}
            isModal={isModal}
          />
        ))}
    </>
  )
}
