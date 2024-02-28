import React from 'react'

import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import Highlight from '@/components/highlight'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph } from '@/components/typography'
import { formatAmount } from '@/lib/utils'
import { InfoCircleWhite } from '@/svgs'

function WarningModal({ popup, setPopup, priceImpact, handleSwap }) {
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
            <h2>High price impact!</h2>
            <Paragraph className='mt-3 text-center'>
              Your order will incur a{' '}
              <span className='font-medium text-error-600'>{formatAmount(priceImpact)}% price impact</span>.
              <br />
              Are you sure you want to continue?
            </Paragraph>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <TextButton
          className='w-full'
          onClick={() => {
            handleSwap()
            setPopup(false)
          }}
        >
          Swap anyway
        </TextButton>
        <PrimaryButton className='w-full' onClick={() => setPopup(false)}>
          Cancel
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default WarningModal
