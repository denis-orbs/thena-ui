'use client'

import React, { useState } from 'react'

import AddLiquidity from '@/components/common/AddLiquidity'
import Modal from '@/components/modal'

const STEPS = ['Select Pair', 'Choose Strategy', 'Add Liquidity']

export default function AddLiquidityModal({ popup, setPopup }) {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      title={STEPS[currentStep]}
      isBack={currentStep > 0}
      onClickHandler={() => {
        if (currentStep > 0) {
          setCurrentStep(currentStep - 1)
        }
      }}
      onAfterClose={() => setCurrentStep(0)}
    >
      <AddLiquidity currentStep={currentStep} setCurrentStep={setCurrentStep} isModal />
    </Modal>
  )
}
