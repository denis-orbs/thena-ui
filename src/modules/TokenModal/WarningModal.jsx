import { useTranslations } from 'next-intl'
import React from 'react'

import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import Highlight from '@/components/highlight'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph } from '@/components/typography'
import { InfoCircleWhite } from '@/svgs'

function WarningModal({ popup, setPopup, onConfirm }) {
  const t = useTranslations()

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title=''
    >
      <ModalBody>
        <div className='flex w-full flex-col items-center justify-center gap-4 px-6'>
          <Highlight className='bg-error-500'>
            <InfoCircleWhite className='h-4 w-4' />
          </Highlight>
          <div className='flex flex-col items-center gap-3'>
            <h2>{t('BeCareful')}</h2>
            <Paragraph className='mt-3 text-center'>{t('BeCarefulDescription')}</Paragraph>
          </div>

          {/* {popup && ( */}
          {/*   <a href={goScan(networkId, item.address)} target='_blank' rel='noreferrer'> */}
          {/*     {item.name} */}
          {/*     <ExternalIcon className='h-3 w-3 stroke-neutral-400 hover:stroke-neutral-50' /> */}
          {/*   </a> */}
          {/* )} */}
        </div>
      </ModalBody>

      <ModalFooter className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <TextButton
          className='w-full'
          onClick={() => {
            onConfirm()
            setPopup(false)
          }}
        >
          {t('Import Anyway')}
        </TextButton>
        <PrimaryButton className='w-full' onClick={() => setPopup(false)}>
          {t('Cancel')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default WarningModal
