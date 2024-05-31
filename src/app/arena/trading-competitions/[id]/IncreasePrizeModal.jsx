import { useTranslations } from 'next-intl'
import React, { useCallback, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import CustomTokenInput from '@/components/input/CustomTokenInput'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { useIncreaseTCSpotPrize } from '@/hooks/useTcSpotContract'
import { warnToast } from '@/lib/notify'
import { fromWei, toWei } from '@/lib/utils'

function IncreasePrizeModal({ isOpen, closeModal = () => {}, competition = {} }) {
  const t = useTranslations()

  const [amount, setAmount] = useState('')
  const [token, setToken] = useState(competition.prizeUpdate.token[0])

  const { increasePrize, pending } = useIncreaseTCSpotPrize()

  const handleIncreasePrize = useCallback(async () => {
    if (fromWei(toWei(amount, token?.decimals), token?.decimals).gt(token?.balance)) {
      warnToast('Insufficient [Asset] Balance', { symbol: token?.symbol })
      return false
    }

    const isSuccess = await increasePrize(competition?.tradingCompetitionSpot, token?.address, toWei(amount))

    if (isSuccess) {
      closeModal()
    }
  }, [amount, closeModal, competition?.tradingCompetitionSpot, increasePrize, token])

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} title='Increase Prize' onAfterClose={() => setAmount('')}>
      <ModalBody>
        <CustomTokenInput
          asset={token}
          setAsset={setToken}
          amount={amount}
          setAmount={setAmount}
          assets={competition?.prizeUpdate?.token}
        />
      </ModalBody>
      <ModalFooter>
        <PrimaryButton disabled={!amount} isLoading={pending} className='w-full' onClick={handleIncreasePrize}>
          {t('Increase Prize')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default IncreasePrizeModal
