import { useTranslations } from 'next-intl'
import React, { useCallback, useState } from 'react'

import { Warning } from '@/components/alert'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CustomTokenInput from '@/components/input/CustomTokenInput'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph } from '@/components/typography'
import { TC_MARKET_TYPES } from '@/constant/arena'
import { useIncreasePrizeTCPerp } from '@/hooks/useTcPerpetualContract'
import { useIncreaseTCSpotPrize } from '@/hooks/useTcSpotContract'
import { warnToast } from '@/lib/notify'
import { fromWei, toWei } from '@/utils/utils'

function IncreasePrizeModal({ isOpen, closeModal = () => {}, competition = {} }) {
  const t = useTranslations()

  const [amount, setAmount] = useState('')
  const [token, setToken] = useState(competition?.prizeUpdate?.token?.[0])
  const [isOpenConfirm, setIsOpenConfirm] = useState(false)

  const { increasePrize: increasePrizeSpot, pending: pendingSpot } = useIncreaseTCSpotPrize()
  const { increasePrize: increasePrizePerp, pending: pendingPerp } = useIncreasePrizeTCPerp()

  const handleIncreasePrize = useCallback(async () => {
    const amountToWei = toWei(amount, token?.decimals)
    if (fromWei(amountToWei, token?.decimals).gt(token?.balance)) {
      warnToast('Insufficient [Asset] Balance', { symbol: token?.symbol })
      return false
    }

    const isSuccess = await (competition.market === TC_MARKET_TYPES.SPOT
      ? increasePrizeSpot(competition?.tcAddress, token?.address, amountToWei)
      : increasePrizePerp(token?.address, amountToWei, Number(competition?.id?.split('-')[1])))

    if (isSuccess) {
      closeModal()
    }
  }, [
    amount,
    closeModal,
    competition?.id,
    competition?.market,
    competition?.tcAddress,
    increasePrizePerp,
    increasePrizeSpot,
    token?.address,
    token?.balance,
    token?.decimals,
    token?.symbol,
  ])

  return (
    <>
      <Modal isOpen={isOpen} closeModal={closeModal} title='Increase Prize Pool' onAfterClose={() => setAmount('')}>
        <ModalBody>
          <Warning className='text-sm'>{t('Increase Prize Pool warning')}</Warning>
          <CustomTokenInput
            asset={token}
            setAsset={setToken}
            amount={amount}
            setAmount={setAmount}
            assets={competition?.prizeUpdate?.token}
          />
        </ModalBody>
        <ModalFooter>
          <PrimaryButton disabled={!amount} className='w-full' onClick={() => setIsOpenConfirm(true)}>
            {t('Increase Prize Pool')}
          </PrimaryButton>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={isOpenConfirm}
        closeModal={closeModal}
        title='Increase Prize Pool'
        onAfterClose={() => setAmount('')}
      >
        <ModalBody>
          <Warning>{t('Increase Prize Pool warning')}</Warning>
          <Paragraph className='mt-3 text-center text-xl font-bold'>{t('Are you sure you want to continue')}</Paragraph>
        </ModalBody>
        <ModalFooter className='flex justify-between'>
          <EmphasisButton onClick={closeModal}>{t('Cancel')}</EmphasisButton>

          <PrimaryButton disabled={!amount} isLoading={pendingSpot || pendingPerp} onClick={handleIncreasePrize}>
            {t('Increase Prize Pool')}
          </PrimaryButton>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default IncreasePrizeModal
