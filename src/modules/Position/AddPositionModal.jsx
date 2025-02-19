'use client'

import React from 'react'

import Modal from '@/components/modal'

// TODO: Remove this modal
export default function AddPositionModal({ popup, setPopup, strategy }) {
  console.log('strategy', strategy)

  return (
    <Modal
      isOpen={popup}
      title='Add Liquidity'
      closeModal={() => {
        setPopup(false)
      }}
    >
      <></>
    </Modal>
  )
}
