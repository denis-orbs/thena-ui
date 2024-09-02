import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useDeallocateTCPerp } from '@/hooks/useTcPerpetualContract'
import { formatAmount, fromWei } from '@/lib/utils'

import { Countdown } from '../Countdown'

function DeallocateModal({ remainingTime, open, onClose, balance, tcAddress, getWithdrawCooldown, enabledWithdraw }) {
  const t = useTranslations()
  const { deallocate, loading } = useDeallocateTCPerp()

  const assets = useAssets()
  const USDT = useMemo(() => assets?.find(asset => asset?.symbol === 'USDT'), [assets])

  const handleDeallocate = useCallback(async () => {
    try {
      const isSuccess = await deallocate(tcAddress, balance)
      if (isSuccess) {
        onClose()
        await getWithdrawCooldown()
      }
    } catch (error) {
      console.log(error)
    }
  }, [balance, deallocate, getWithdrawCooldown, onClose, tcAddress])

  return (
    <Modal isOpen={open} closeModal={onClose} width={540} title={t('Withdraw')}>
      <ModalBody>
        {enabledWithdraw === undefined ? (
          <div className='flex flex-row items-center justify-between'>
            <TextHeading>{t('Amount')}:</TextHeading>
            <div className='flex flex-row items-center gap-3'>
              <TextHeading>{formatAmount(fromWei(balance))}</TextHeading>
              <div className='flex flex-row items-center gap-1'>
                <CircleImage src={USDT?.logoURI} width={20} height={20} alt='thena token' />
                <TextHeading>{USDT?.symbol}</TextHeading>
              </div>
            </div>
          </div>
        ) : (
          <Countdown timestamp={remainingTime || 0} />
        )}
        <TextHeading className='text-sm'>{t('Deallocate Description')}</TextHeading>
      </ModalBody>
      {enabledWithdraw === undefined && (
        <ModalFooter className='w-full'>
          <PrimaryButton className='w-full' disabled={loading} isLoading={loading} onClick={handleDeallocate}>
            {t('Deallocate')}
          </PrimaryButton>
        </ModalFooter>
      )}
    </Modal>
  )
}

export default DeallocateModal
