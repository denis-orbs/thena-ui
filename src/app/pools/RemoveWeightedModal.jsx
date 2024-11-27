import { useTranslations } from 'next-intl'
import React from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import RemoveWeighted from '@/modules/Position/RemoveWeighted'

function RemoveWeightedModal({ pool, isOpen, setIsOpen }) {
  const t = useTranslations()
  return (
    <Modal isOpen={isOpen} closeModal={() => setIsOpen(false)} title={t('Remove Liquidity')}>
      <ModalBody>
        <RemoveWeighted pool={pool} />
      </ModalBody>
      <ModalFooter>
        <div className='flex flex-row justify-between gap-4'>
          <EmphasisButton className='w-full flex-[5]' onClick={() => setIsOpen(false)}>
            {t('Cancel')}
          </EmphasisButton>
          <PrimaryButton className='w-full flex-[5]'>{t('Remove')}</PrimaryButton>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default RemoveWeightedModal
