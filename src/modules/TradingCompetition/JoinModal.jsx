import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { Alert } from '@/components/alert'
import { EmphasisButton, ErrorButton, PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { useTcSpotContractActions } from '@/hooks/useTcSpotContractActions'
import { formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'

export function JoinModal({ competition, open, onClose }) {
  const t = useTranslations()
  const {
    entryFee,
    prize: { token: prizeToken },
    competitionRules: { startingBalance, winningToken },
  } = competition
  const [pending, setPending] = useState(false)

  const { joinTC } = useTcSpotContractActions(competition.tradingCompetitionSpot)

  const showAlertBalance = useMemo(() => {
    if (prizeToken.address === winningToken.address) {
      const totalAmount = fromWei(entryFee, prizeToken.decimals).plus(fromWei(startingBalance, winningToken.decimals))
      const totalBalance = prizeToken.balance.plus(winningToken.balance)
      return totalAmount.gt(totalBalance)
    }
    const notEnoughFee = fromWei(entryFee, prizeToken.decimals).gt(prizeToken.balance)
    const notEnoughDeposit = fromWei(startingBalance, winningToken.decimals).gt(winningToken.balance)

    return notEnoughDeposit || notEnoughFee
  }, [
    entryFee,
    prizeToken.address,
    prizeToken.balance,
    prizeToken.decimals,
    startingBalance,
    winningToken.address,
    winningToken.balance,
    winningToken.decimals,
  ])

  const handleJoin = async () => {
    try {
      setPending(true)
      await joinTC(competition)
    } catch (e) {
      console.error(e)
    } finally {
      setPending(false)
    }
  }

  const addBalance = async () => {}

  const message = useMemo(() => {
    if (isInvalidAmount(entryFee)) {
      /** TODO: message required deposit */
      // if (!isInvalidAmount(startingBalance)) {
      //   return t('Free To Join Message')
      // }
      return t('Free To Join Message')
    }
    if (isInvalidAmount(startingBalance)) {
      return t('Pay Entry Fee To Join Message')
    }
    return t('Pay Entry Fee And Deposit To Join Message')
  }, [entryFee, startingBalance, t])

  return (
    <Modal isOpen={open} closeModal={onClose} width={540} title={t('Join Competition')}>
      <ModalBody>
        <p className='mt-1.5 w-full text-[15px] text-neutral-300  md:text-base md:leading-6'>{message}</p>
        <div className='item-centers mt-3 flex flex-row justify-between gap-4 md:mt-5'>
          {!isInvalidAmount(entryFee) && prizeToken && (
            <div>
              <TextHeading className='text-lg'>{t('Entry Fee')}</TextHeading>
              <div className='mt-2 flex space-x-2'>
                <Image
                  alt={prizeToken.name}
                  src={prizeToken.logoURI}
                  className='flex-shrink-0'
                  width={20}
                  height={20}
                  loading='lazy'
                />
                <Paragraph>
                  {formatAmount(fromWei(entryFee, prizeToken.decimals))} {prizeToken.symbol}
                </Paragraph>
              </div>
            </div>
          )}
          {!isInvalidAmount(startingBalance) && winningToken && (
            <div>
              <TextHeading className='text-lg'>{t('Required Deposit To Join')}</TextHeading>
              <div className='mt-2 flex space-x-2'>
                <Image
                  alt={winningToken.name}
                  src={winningToken.logoURI}
                  className='flex-shrink-0'
                  width={20}
                  height={20}
                  loading='lazy'
                />
                <Paragraph>
                  {formatAmount(fromWei(entryFee, winningToken.decimals))} {winningToken.symbol}
                </Paragraph>
              </div>
            </div>
          )}
        </div>
        {showAlertBalance && (
          <div className='mt-2'>
            <Alert>
              <p>{t('Not Enough Balance To Join Message')}</p>

              <ErrorButton className='text-nowrap p-2 text-xs' onClick={addBalance}>
                {t('Add Balance')}
              </ErrorButton>
            </Alert>
          </div>
        )}
      </ModalBody>
      <ModalFooter className='flex w-full items-center justify-between gap-4'>
        <EmphasisButton className='w-full' onClick={onClose}>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton className='w-full' onClick={handleJoin} disabled={showAlertBalance} isLoading={pending}>
          {t('Join Competition')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}
