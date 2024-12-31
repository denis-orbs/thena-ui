import React from 'react'

import Modal from '@/components/modal'
import { useWindowSize } from '@/hooks/useWindowSize'

import AddLiquidityWeightedPool from './add-liquidity/AddLiquidityWeightedPool'

function AddLiquidityWeightedModal({ pool, isStake, isOpen, setIsOpen }) {
  const windowSize = useWindowSize()
  return (
    <Modal isOpen={isOpen} closeModal={() => setIsOpen(false)} title='Add Liquidity'>
      <AddLiquidityWeightedPool
        pool={pool}
        isStake={isStake}
        showSidebar={false}
        setCurrentStep={() => {}}
        width={windowSize.width >= 1024 ? '570px' : windowSize.width * 0.9}
        isModal
        setIsOpen={setIsOpen}
      />
    </Modal>
  )
}

export default AddLiquidityWeightedModal
