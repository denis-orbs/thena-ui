'use client'

import React, { useMemo } from 'react'

import AddLiquidity from '@/components/common/AddLiquidity'
import Modal from '@/components/modal'
import { PAIR_TYPES } from '@/constant'

export default function AddPositionModal({ popup, setPopup, strategy }) {
  const currentStep = useMemo(
    () => ([PAIR_TYPES.STABLE, PAIR_TYPES.CLASSIC].includes(strategy.title) ? 1 : 2),
    [strategy],
  )

  return (
    <Modal
      isOpen={popup}
      title='Add Liquidity'
      closeModal={() => {
        setPopup(false)
      }}
    >
      <AddLiquidity pool={strategy} currentStep={currentStep} isModal isAdd />
    </Modal>
  )
}
