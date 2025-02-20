'use client'

import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import Modal from '@/components/modal'
import Selection from '@/components/selection'

import RemovePosition from './RemovePosition'
import PoolTitle from '../PoolTitle'

export default function ManagePositionModal({ popup, setPopup, strategy }) {
  const [isRemove, setIsRemove] = useState(true)
  const { push } = useRouter()

  const manageSelections = useMemo(
    () => [
      {
        label: 'Add',
        active: !isRemove,
        onClickHandler: () => {
          push(`/pools/add-liquidity?step=3&poolAddress=${strategy.address}`)
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
    [isRemove, push, strategy.address],
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
      {isRemove ? <RemovePosition strategy={strategy} setPopup={setPopup} isManage /> : <></>}
    </Modal>
  )
}
