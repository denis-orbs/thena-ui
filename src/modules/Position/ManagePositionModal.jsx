'use client'

import React, { useMemo, useState } from 'react'

import Modal from '@/components/modal'
import Selection from '@/components/selection'

import RemovePosition from './RemovePosition'
import PoolTitle from '../PoolTitle'

export default function ManagePositionModal({ popup, setPopup, strategy }) {
  const [isRemove, setIsRemove] = useState(false)

  const manageSelections = useMemo(
    () => [
      {
        label: 'Add',
        active: !isRemove,
        onClickHandler: () => {
          setIsRemove(false)
        },
      },
      {
        label: 'Remove',
        active: isRemove,
        onClickHandler: () => {
          setIsRemove(true)
        },
      },
    ],
    [isRemove],
  )

  return (
    <Modal
      isOpen={popup}
      title='Manage Position'
      closeModal={() => {
        setPopup(false)
      }}
    >
      <div className='inline-flex w-full flex-col gap-5 p-3 lg:px-6'>
        <PoolTitle strategy={strategy} />
        <Selection data={manageSelections} isFull />
      </div>
      {isRemove ? (
        <RemovePosition strategy={strategy} setPopup={setPopup} isManage />
      ) : (
        <>
          <p className='px-3 pt-3 font-medium text-white lg:px-6'>Add Liquidity Options</p>
          {/* TODO: Add Liquidity redirects to page */}
          <></>
        </>
      )}
    </Modal>
  )
}
