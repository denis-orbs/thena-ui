'use client'

import React, { useMemo, useState } from 'react'

import FusionAdd from '@/components/common/AddLiquidity/FusionAdd'
import V1Add from '@/components/common/AddLiquidity/V1Add'
import Modal from '@/components/modal'
import Selection from '@/components/selection'
import { PAIR_TYPES } from '@/constant'
import { useGetAsset } from '@/hooks/fusion/Tokens'

import RemovePosition from './RemovePosition'
import PoolTitle from '../PoolTitle'

export default function ManagePositionModal({ popup, setPopup, strategy }) {
  const [isRemove, setIsRemove] = useState(false)
  const [firstAddress, setFirstAddress] = useState(strategy.token0.address)
  const [secondAddress, setSecondAddress] = useState(strategy.token1.address)
  const [slippage, setSlippage] = useState(0.5)

  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

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
          {[PAIR_TYPES.CLASSIC, PAIR_TYPES.STABLE].includes(strategy.type) ? (
            <V1Add
              pairType={strategy.type}
              firstAsset={firstAsset}
              setFirstAddress={setFirstAddress}
              secondAsset={secondAsset}
              setSecondAddress={setSecondAddress}
              isModal
              isAdd={false}
              slippage={slippage}
              setSlippage={setSlippage}
            />
          ) : (
            <FusionAdd strategy={strategy} isModal isAdd />
          )}
        </>
      )}
    </Modal>
  )
}
