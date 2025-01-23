import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph } from '@/components/typography'

function NavigateToAddLiquidityModal({ popup, setPopup, link }) {
  const t = useTranslations()

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title='Withdraw Successfully'
    >
      <ModalBody>
        <div className='flex w-full flex-col items-center justify-center gap-4 px-6'>
          <div className='flex flex-col items-center gap-3'>
            {/* TODO: Translate */}
            <Paragraph className='mt-3'>You can add liquidity to V3 pool by clicking the button below.</Paragraph>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Link className='w-full' href='/dashboard'>
          <EmphasisButton className='w-full' onClick={() => setPopup(false)}>
            {t('Cancel')}
          </EmphasisButton>
        </Link>

        <Link href={link} className='w-full'>
          <PrimaryButton className='w-full'>{t('Add Liquidity')}</PrimaryButton>
        </Link>
      </ModalFooter>
    </Modal>
  )
}

export default NavigateToAddLiquidityModal
