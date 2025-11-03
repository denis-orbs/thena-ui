import { useTranslations } from 'next-intl'
import React from 'react'

import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import Highlight from '@/components/highlight'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph } from '@/components/typography'
import InfoIcon from '@/icons/InfoIcon'

function WarningModal({ popup, setPopup, title = '', desc = '', buttonTitle = 'Confirm', onConfirm }) {
  const t = useTranslations()

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup()
      }}
      width={480}
    >
      <ModalBody>
        <div className='flex w-full flex-col items-center justify-center gap-4 px-6'>
          <Highlight className='bg-error-500'>
            <InfoIcon className='stroke-neutral-50' />
          </Highlight>

          <div className='flex flex-col items-center gap-3'>
            <h2>{title}</h2>
            <Paragraph className='mt-3 text-center'>{desc}</Paragraph>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <TextButton
          className='w-full'
          onClick={() => {
            onConfirm()
            setPopup()
          }}
        >
          {buttonTitle}
        </TextButton>

        <PrimaryButton className='w-full' onClick={() => setPopup()}>
          {t('Cancel')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default WarningModal
