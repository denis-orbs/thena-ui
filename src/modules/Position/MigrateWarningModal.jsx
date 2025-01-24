import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Highlight from '@/components/highlight'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph } from '@/components/typography'
import { InfoCircleWhite } from '@/svgs'

function MigrateWarningModal({ popup, setPopup, strategy = 'Gamma', link, handleWithdrawV1 }) {
  const t = useTranslations()

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title={strategy === 'V1' ? 'Gauge Is Not Available' : ''}
    >
      <ModalBody>
        <div className='flex w-full flex-col items-center justify-center gap-4 px-6'>
          <Highlight className='bg-warn-700'>
            <InfoCircleWhite className='h-4 w-4' />
          </Highlight>
          <div className='flex flex-col items-center gap-3'>
            <Paragraph className='mt-3 text-center'>
              {strategy === 'V1'
                ? t('Withdraw From Gauge Desc')
                : `${strategy} ${t('withdraw and deposit manually warning')}`}
            </Paragraph>
            <Paragraph className='mt-3 text-center'>{t('Are you sure you want to continue')}</Paragraph>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <EmphasisButton className='w-full' onClick={() => setPopup(false)}>
          {t('Cancel')}
        </EmphasisButton>
        {strategy === 'V1' ? (
          <PrimaryButton className='w-full' onClick={handleWithdrawV1}>
            {t('Withdraw')}
          </PrimaryButton>
        ) : (
          <Link href={`${link}&withdraw=true`} className='w-full'>
            <PrimaryButton className='w-full'>{t('Migrate')}</PrimaryButton>
          </Link>
        )}
      </ModalFooter>
    </Modal>
  )
}

export default MigrateWarningModal
