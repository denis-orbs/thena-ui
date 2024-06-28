import { useTranslations } from 'next-intl'
import React from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { TextHeading } from '@/components/typography'

function WarningModal({ open, onClose, onClickNext }) {
  const t = useTranslations()

  return (
    <Modal isOpen={open} closeModal={onClose} title='Warning'>
      <ModalBody>
        <TextHeading className='text-sm'>{t('Description Modal Warning Create Trading Competition')}</TextHeading>
        <TextHeading className='text-sm'>{t('Question Confirm')}</TextHeading>
      </ModalBody>
      <ModalFooter>
        <ModalFooter className='flex flex-row justify-center gap-4'>
          <EmphasisButton onClick={onClose} className='w-full py-3.5 text-white lg:w-auto lg:px-16 lg:py-3'>
            {t('No')}
          </EmphasisButton>
          <PrimaryButton onClick={onClickNext} className='w-full py-3.5 text-white lg:w-auto lg:px-16 lg:py-3'>
            {t('Yes')}
          </PrimaryButton>
        </ModalFooter>
      </ModalFooter>
    </Modal>
  )
}

export default WarningModal
