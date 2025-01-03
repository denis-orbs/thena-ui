'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import SelectPair from '@/components/common/AddLiquidity/SelectPair'
import Modal from '@/components/modal'
import { useAssets } from '@/context/assetsContext'
import { useCustomAssets } from '@/context/customAssetsContext'

export default function AddLiquidityModal({ popup, setPopup }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [firstAsset, setFirstAsset] = useState()
  const [secondAsset, setSecondAsset] = useState()
  const [pairType, setPairType] = useState()

  const [firstAddress, setFirstAddress] = useState()
  const [secondAddress, setSecondAddress] = useState()

  const { push } = useRouter()

  const assets = useAssets()

  const customAssets = useCustomAssets()

  useEffect(() => {
    setFirstAsset([...assets, ...customAssets].find(ele => ele.address === firstAddress))
    setSecondAsset([...assets, ...customAssets].find(ele => ele.address === secondAddress))
  }, [assets, firstAddress, secondAddress, customAssets])

  const goToLiquidityPage = () => {
    push(`/pools/add-liquidity?firstAddress=${firstAddress}&secondAddress=${secondAddress}&pairType=${pairType}`)
  }

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      title='Select Pair'
      isBack={currentStep > 0}
      onClickHandler={() => {
        if (currentStep > 0) {
          setCurrentStep(currentStep - 1)
        }
      }}
      onAfterClose={() => setCurrentStep(0)}
    >
      <SelectPair
        fromAsset={firstAsset}
        toAsset={secondAsset}
        setFromAddress={setFirstAddress}
        setToAddress={setSecondAddress}
        isModal
        pairType={pairType}
        setPairType={setPairType}
        handleContinue={goToLiquidityPage}
      />
    </Modal>
  )
}
