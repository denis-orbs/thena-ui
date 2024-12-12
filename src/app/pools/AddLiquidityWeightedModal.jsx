import { useTranslations } from 'next-intl'
import React from 'react'

import Modal from '@/components/modal'

import AddLiquidityWeightedPool from './add-liquidity/AddLiquidityWeightedPool'

function AddLiquidityWeightedModal({ pool, isOpen, setIsOpen }) {
  const t = useTranslations()
  return (
    <Modal isOpen={isOpen} closeModal={() => setIsOpen(false)} title={t('Add Liquidity')}>
      <AddLiquidityWeightedPool
        pool={pool}
        showSidebar={false}
        setCurrentStep={() => {}}
        isModal
        setIsOpen={setIsOpen}
      />
    </Modal>
  )
}

export default AddLiquidityWeightedModal
