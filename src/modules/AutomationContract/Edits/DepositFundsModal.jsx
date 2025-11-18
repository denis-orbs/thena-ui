import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAutomationContractDetail, useDepositFunds } from '@/hooks/automationContract/useAutomationContract'
import useChainLINKData from '@/hooks/useChainLINKData'
import { warnToast } from '@/lib/notify'
import WarningLINKBalance from '@/modules/CreateVeTHEAutomation/WarningLINKBalance'
import { fromWei, isInvalidAmount, toWei } from '@/utils/utils'

function DepositFundsModal({ contract, popup, setPopup, onSuccess = () => {} }) {
  const { veTHEId } = contract
  const t = useTranslations()
  const [amount, setAmount] = useState()
  const { mutateAutomationData } = useAutomationContractDetail(veTHEId)
  const { onDepositFunds, pending } = useDepositFunds()

  const [chainLINK, setChainLINK] = useState()

  useEffect(() => {
    if (veTHEId) {
      mutateAutomationData()
    }
  }, [mutateAutomationData, veTHEId])

  const { chainLinkData } = useChainLINKData()

  useEffect(() => {
    if (!chainLINK && (chainLinkData || []).length > 0) {
      setChainLINK(chainLinkData[0])
    }
  }, [chainLINK, chainLinkData])

  return (
    <Modal
      isOpen={popup}
      closeModal={() => {
        setPopup(false)
      }}
      width={480}
      title='Fund Contract'
    >
      <ModalBody>
        <div className='flex flex-col gap-5'>
          <div className='flex flex-row justify-between'>
            <Paragraph>{t('Contract Name')}</Paragraph>
            <TextHeading>{t('veTHE Contract [veTHEId]', { veTHEId })}</TextHeading>
          </div>
          <div className='flex flex-col gap-[11px]'>
            <div className='flex flex-row justify-between'>
              <TextHeading>{t('Add Funds')}</TextHeading>
            </div>
            <WarningLINKBalance contract={contract} chainLINK={chainLINK} />
            <TokenAmountInput
              type='number'
              amount={amount}
              setAsset={setChainLINK}
              asset={chainLINK}
              autoFocus
              onAmountChange={setAmount}
              showPercent={false}
              assetsSelect={chainLinkData}
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <EmphasisButton className='w-full' onClick={() => setPopup()}>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton
          className='w-full'
          disabled={pending}
          onClick={() => {
            if (!chainLINK) {
              warnToast(t('Please select token'))
              return
            }
            if (
              isInvalidAmount(amount) ||
              fromWei(toWei(amount, chainLINK?.decimals), chainLINK?.decimals).gt(chainLINK?.balance)
            ) {
              warnToast(t('Invalid Amount'))
              return
            }
            onDepositFunds(contract.address, chainLINK.address, amount, () => {
              mutateAutomationData()
              onSuccess()
            })
            setPopup(false)
          }}
        >
          {t('Confirm')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default DepositFundsModal
