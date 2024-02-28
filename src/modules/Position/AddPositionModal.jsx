'use client'

import React, { useMemo } from 'react'

import AddLiquidity from '@/components/common/AddLiquidity'
import Modal from '@/components/modal'

export default function AddPositionModal({ popup, setPopup, strategy }) {
  const currentStep = useMemo(() => (['Stable', 'Volatile'].includes(strategy.title) ? 1 : 2), [strategy])

  return (
    <Modal
      isOpen={popup}
      title='Add position'
      closeModal={() => {
        setPopup(false)
      }}
    >
      <AddLiquidity pool={strategy} currentStep={currentStep} isModal isAdd />
    </Modal>
  )
}
