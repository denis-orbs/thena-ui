import { useTranslations } from 'next-intl'
import React from 'react'

import Modal from '@/components/modal'
import { useWindowSize } from '@/hooks/useWindowSize'
import RemoveWeighted from '@/modules/Position/RemoveWeighted'

function RemoveWeightedModal({ pool, isOpen, setIsOpen }) {
  const t = useTranslations()
  const windowSize = useWindowSize()
  return (
    <Modal
      width={windowSize.width > 1024 ? '570px' : windowSize.width * 0.9}
      isOpen={isOpen}
      closeModal={() => setIsOpen(false)}
      title={t('Remove Liquidity')}
    >
      <RemoveWeighted pool={pool} onCancel={() => setIsOpen(false)} />
    </Modal>
  )
}

export default RemoveWeightedModal
