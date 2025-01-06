'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import SelectPair from '@/components/common/AddLiquidity/SelectPair'
import Modal from '@/components/modal'
import { useToken } from '@/hooks/fusion/Tokens'

export default function AddLiquidityModal({ popup, setPopup }) {
  const { push } = useRouter()

  const [pairType, setPairType] = useState()
  const [currentStep, setCurrentStep] = useState(0)
  const [firstAddress, setFirstAddress] = useState()
  const [secondAddress, setSecondAddress] = useState()

  const firstAsset = useToken(firstAddress)
  const secondAsset = useToken(secondAddress)

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
