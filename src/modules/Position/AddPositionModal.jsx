'use client'

import React, { useState } from 'react'

import FusionAdd from '@/components/common/AddLiquidity/FusionAdd'
import V1Add from '@/components/common/AddLiquidity/V1Add'
import Modal from '@/components/modal'
import { PAIR_TYPES } from '@/constant'
import { useGetAsset } from '@/hooks/fusion/Tokens'

export default function AddPositionModal({ popup, setPopup, strategy }) {
  const [firstAddress, setFirstAddress] = useState(strategy.token0.address)
  const [secondAddress, setSecondAddress] = useState(strategy.token1.address)

  const firstAsset = useGetAsset(firstAddress)
  const secondAsset = useGetAsset(secondAddress)

  const [slippage, setSlippage] = useState(0.5)

  return (
    <Modal
      isOpen={popup}
      title='Add Liquidity'
      closeModal={() => {
        setPopup(false)
      }}
    >
      {[PAIR_TYPES.CLASSIC, PAIR_TYPES.STABLE].includes(strategy.type) ? (
        <V1Add
          pairType={strategy.type}
          firstAsset={firstAsset}
          setFirstAddress={setFirstAddress}
          secondAsset={secondAsset}
          setSecondAddress={setSecondAddress}
          isModal
          isAdd
          slippage={slippage}
          setSlippage={setSlippage}
        />
      ) : (
        <FusionAdd strategy={strategy} isModal isAdd />
      )}
    </Modal>
  )
}
