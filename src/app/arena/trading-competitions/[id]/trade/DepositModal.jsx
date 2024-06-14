import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'

import { PrimaryButton } from '@/components/buttons/Button'
import BalanceInput from '@/components/input/BalanceInput'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { TextSubHeading } from '@/components/typography'
import { useDepositToTCPerp } from '@/hooks/useTcPerpetualContract'
import { warnToast } from '@/lib/notify'
import { fromWei, toWei } from '@/lib/utils'

function DepositModal({ isOpen, closeModal = () => {}, competition = {} }) {
  const t = useTranslations()

  const { deposit, pending } = useDepositToTCPerp()

  const [amount, setAmount] = useState('')
  const token = useMemo(() => competition.competitionRules.winningToken, [competition.competitionRules.winningToken])

  const handleDeposit = useCallback(async () => {
    if (fromWei(toWei(amount, token?.decimals), token?.decimals).gt(token?.balance)) {
      warnToast('Insufficient [Asset] Balance', { symbol: token?.symbol })
      return false
    }

    const isSuccess = await deposit({
      amount: toWei(amount),
      tcAddress: competition?.tcAddress,
      winningToken: token,
    })

    if (isSuccess) {
      closeModal()
    }
  }, [amount, closeModal, competition?.tcAddress, deposit, token])

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
