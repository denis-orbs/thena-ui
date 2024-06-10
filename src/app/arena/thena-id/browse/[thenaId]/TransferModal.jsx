import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { TextSubHeading } from '@/components/typography'
import { useTransferThenaId } from '@/hooks/useThenaIdContract'
import { successToast } from '@/lib/notify'
import useWallet from '@/lib/wallets/useWallet'

function TransferModal({ isOpen, onClose, tokenId, mutate }) {
  const t = useTranslations()
  const { account } = useWallet()

  const [toAddress, setToAddress] = useState('')

  const { onTransfer, loading } = useTransferThenaId()

  const handleTransfer = async () => {
    try {
      const isSuccess = await onTransfer(toAddress, tokenId)
      if (isSuccess) {
        await mutate()
        onClose()
        successToast('Transferred successfully')
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title='Transfer THENA ID'
      closeModal={onClose}
      onAfterClose={() => setToAddress('')}
      fontSizeTitle='text-xl'
      width={550}
    >
      <ModalBody>
        <TextSubHeading>{t('Transfer THENA ID description')}</TextSubHeading>
        <Input
          type='text'
          val={toAddress}
          onChange={e => setToAddress(e.target.value)}
          placeholder='Enter to address'
        />
      </ModalBody>
      <ModalFooter>
        <div className='mt-2 flex h-auto w-full flex-row items-center gap-2'>
          <EmphasisButton className='w-full' onClick={onClose}>
            {t('Cancel')}
          </EmphasisButton>
          <PrimaryButton
            className='w-full'
            onClick={handleTransfer}
            disabled={!toAddress.trim() || account.toLowerCase() === toAddress.trim().toLowerCase() || loading}
          >
            {t('Send')}
          </PrimaryButton>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default TransferModal
