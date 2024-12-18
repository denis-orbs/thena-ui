'use client'

import React, { useEffect, useState } from 'react'

import { PAIR_TYPES } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { LOCAL_STORAGE_TOKENS, useLocalStorage } from '@/hooks/useLocalStorage'

import ChooseStrategy from './ChooseStrategy'
import FusionAdd from './FusionAdd'
import ManualAdd from './FusionAdd/ManualAdd'
import SelectPair from './SelectPair'
import V1Add from './V1Add'

let init = false

export default function AddLiquidity({ currentStep, setCurrentStep, pool, isModal = false, isAdd = false }) {
  const [pairType, setPairType] = useState(PAIR_TYPES.LSD)
  const [strategy, setStrategy] = useState()
  const [isAutomatic, setIsAutomatic] = useState(true)
  const [isReverse, setIsReverse] = useState(true)
  const [firstAsset, setFirstAsset] = useState()
  const [secondAsset, setSecondAsset] = useState()
  const [firstAddress, setFirstAddress] = useState()
  const [secondAddress, setSecondAddress] = useState()
  const { getWithExpiry } = useLocalStorage()
  const assets = useAssets()

  const [slippage, setSlippage] = useState(0.5)

  useEffect(() => {
    if (!init && pool) {
      init = true
      setPairType(pool.type)
      setFirstAddress(pool.token0.address)
      setSecondAddress(pool.token1.address)
    }
  }, [assets, pool, firstAsset, secondAsset, pairType])

  useEffect(() => {
    const temp = getWithExpiry(LOCAL_STORAGE_TOKENS) ?? []
    const assetList = assets.concat(temp.map(tk => ({ ...tk, price: 0, balance: 0 })))

    setFirstAsset(assetList.find(ele => ele.address === firstAddress))
    setSecondAsset(assetList.find(ele => ele.address === secondAddress))
  }, [assets, firstAddress, getWithExpiry, secondAddress])

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
            strategy={strategy}
            setStrategy={setStrategy}
            setCurrentStep={setCurrentStep}
            isAutomatic={isAutomatic}
            setIsAutomatic={setIsAutomatic}
            isReverse={isReverse}
            setIsReverse={setIsReverse}
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
        (isAutomatic ? (
          <FusionAdd strategy={isAdd ? pool : strategy} isModal={isModal} isAdd={isAdd} />
        ) : (
          <ManualAdd
            firstAsset={firstAsset}
            secondAsset={secondAsset}
            isReverse={isReverse}
            slippage={slippage}
            isModal={isModal}
            strategy={strategy}
          />
        ))}
    </>
  )
}
