'use client'

import React from 'react'

import Modal from '@/components/modal'

import RemovePosition from './RemovePosition'

export default function RemovePositionModal({ popup, setPopup, strategy }) {
  return (
    <Modal
      isOpen={popup}
      title='Remove Liquidity'
      closeModal={() => {
        setPopup(false)
      }}
    >
      <RemovePosition setPopup={setPopup} strategy={strategy} />
    </Modal>
  )
}
