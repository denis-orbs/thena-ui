import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import BalanceInput from '@/components/input/BalanceInput'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { TextSubHeading } from '@/components/typography'
import { TC_MARKET_TYPES } from '@/constant'
import { useDepositToTCPerp } from '@/hooks/useTcPerpetualContract'
import { useDepositToTC } from '@/hooks/useTcSpotContract'
import { warnToast } from '@/lib/notify'
import { fromWei, toWei } from '@/lib/utils'

import { WarningDeposit } from './WarningDeposit'

function DepositModal({ isOpen, closeModal = () => {}, competition = {} }) {
  const t = useTranslations()

  const { deposit: depositPerp, pending: pendingPerp } = useDepositToTCPerp()
  const { deposit: depositSpot, pending: pendingSpot } = useDepositToTC()

  const [amount, setAmount] = useState('')
  const token = useMemo(() => competition.competitionRules.winningToken, [competition.competitionRules.winningToken])

  const handleDeposit = useCallback(async () => {
    if (fromWei(toWei(amount, token?.decimals), token?.decimals).gt(token?.balance)) {
      warnToast('Insufficient [Asset] Balance', { symbol: token?.symbol })
      return false
    }

    const data = {
      amount: toWei(amount, token?.decimals),
      tcAddress: competition?.tcAddress,
      winningToken: token,
    }

    const isSuccess = await (competition?.market === TC_MARKET_TYPES.PERPETUAL ? depositPerp(data) : depositSpot(data))

    if (isSuccess) {
      closeModal()
    }
  }, [amount, closeModal, competition?.market, competition?.tcAddress, depositPerp, depositSpot, token])

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} title='Deposit' onAfterClose={() => setAmount('')}>
      <ModalBody>
        <TextSubHeading>{t('Description Modal Deposit')}</TextSubHeading>

        <BalanceInput
          autoFocus
          asset={competition?.competitionRules?.winningToken}
          amount={amount}
          onAmountChange={setAmount}
        />
        {Boolean(amount) && competition?.market === TC_MARKET_TYPES.PERPETUAL && (
          <WarningDeposit
            asset={competition?.competitionRules?.winningToken}
            amount={amount}
            competition={competition}
          />
        )}
      </ModalBody>
      <ModalFooter>
        <PrimaryButton
          disabled={!amount}
          isLoading={pendingPerp || pendingSpot}
          className='w-full'
          onClick={handleDeposit}
        >
          {t('Deposit')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default DepositModal
