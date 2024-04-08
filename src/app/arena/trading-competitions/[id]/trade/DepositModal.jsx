import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import BalanceInput from '@/components/input/BalanceInput'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { TextSubHeading } from '@/components/typography'
import { useDepositToTC } from '@/hooks/useTcSpotContract'
import { warnToast } from '@/lib/notify'
import { fromWei, toWei } from '@/lib/utils'

function DepositModal({ isOpen, closeModal = () => {}, competition = {} }) {
  const t = useTranslations()
  const [amount, setAmount] = useState('')
  const { deposit, pending } = useDepositToTC()

  const handleDeposit = useCallback(async () => {
    if (
      fromWei(
        toWei(amount, competition?.competitionRules?.winningToken?.decimals),
        competition?.competitionRules?.winningToken?.decimals,
      ).gt(competition?.competitionRules?.winningToken?.balance)
    ) {
      warnToast(`Insufficient ${competition.competitionRules?.winningToken?.symbol} Balance `)
      return false
    }

    const isSuccess = await deposit({
      amount: toWei(amount),
      token: competition?.competitionRules?.winningToken,
      tcAddress: competition?.tradingCompetitionSpot,
    })

    if (isSuccess) {
      closeModal()
    }
  }, [amount, closeModal, competition?.competitionRules?.winningToken, competition?.tradingCompetitionSpot, deposit])

  const winningToken = useMemo(
    () => competition?.competitionRules?.winningToken,
    [competition?.competitionRules?.winningToken],
  )

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} title='Deposit' onAfterClose={() => setAmount('')}>
      <ModalBody>
        <TextSubHeading>{t('Description Modal Deposit')}</TextSubHeading>
        <BalanceInput autoFocus asset={winningToken} amount={amount} onAmountChange={setAmount} />
      </ModalBody>
      <ModalFooter>
        <PrimaryButton disabled={!amount} isLoading={pending} className='w-full' onClick={handleDeposit}>
          {t('Deposit')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default DepositModal
