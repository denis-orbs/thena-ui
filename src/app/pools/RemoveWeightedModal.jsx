import { useTranslations } from 'next-intl'
import React from 'react'

import Modal from '@/components/modal'
import RemoveWeighted from '@/modules/Position/RemoveWeighted'

function RemoveWeightedModal({ pool, isOpen, setIsOpen }) {
  const t = useTranslations()
  return (
    <Modal isOpen={isOpen} closeModal={() => setIsOpen(false)} title={t('Remove Liquidity')}>
      <RemoveWeighted pool={pool} onCancel={() => setIsOpen(false)} />
    </Modal>
  )
}

export default RemoveWeightedModal
