import { useTranslations } from 'next-intl'
import React from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import Highlight from '@/components/highlight'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph } from '@/components/typography'
import { CheckGradientIcon } from '@/svgs'

function SuccessModal({ isOpen, onClose, heading, message, ref }) {
  const t = useTranslations()
  return (
    <Modal
      isOpen={isOpen}
      closeModal={() => {
        onClose()
      }}
      width={480}
    >
      <ModalBody>
        <div className='flex w-full flex-col items-center justify-center gap-4 px-6'>
          <Highlight className='bg-primary-600'>
            <CheckGradientIcon className='h-4 w-4' />
          </Highlight>
          <div className='flex flex-col items-center gap-3'>
            <h2>{heading}</h2>
            <Paragraph className='mt-3 text-center'>{message}</Paragraph>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='items-center justify-center'>
        <div ref={ref}>
          <EmphasisButton className='w-full' onClick={() => onClose()}>
            {t('Close')}
          </EmphasisButton>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default SuccessModal
