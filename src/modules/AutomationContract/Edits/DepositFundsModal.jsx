import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import TokenInput from '@/components/input/TokenInput'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { useAutomationContractDetail, useDepositFunds } from '@/hooks/automationContract/useAutomationContract'
import useWallet from '@/hooks/useWallet'
import { ErrorMessage } from '@/modules/WeightedPool/ChooseTokenAndWeights'

function DepositFundsModal({ contract, popup, setPopup }) {
  const { veTHEId } = contract
  const t = useTranslations()
  const [amount, setAmount] = useState()
  const { mutateAutomationData } = useAutomationContractDetail(veTHEId)
  const { onDepositFunds, pending } = useDepositFunds()
  const assets = useAssets()
  const { chainId } = useWallet()

  const [chainLINK, setChainLINK] = useState()

  useEffect(() => {
    if (veTHEId) {
      mutateAutomationData()
    }
  }, [mutateAutomationData, veTHEId])

  const chainLINKData = useMemo(
    () =>
      (assets || []).filter(asset =>
        [Contracts.chainlinkToken[chainId], Contracts.chainlinkTokenERC677[chainId]].includes(asset.address),
      ),
    [assets, chainId],
  )

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
        <div className='space-y-5'>
          <div className='flex flex-row justify-between'>
            <Paragraph>{t('Contract Name')}</Paragraph>
            <TextHeading>{t('veTHE Contract [veTHEId]', { veTHEId })}</TextHeading>
          </div>
          <div className='flex flex-col gap-[11px]'>
            <div className='flex flex-row justify-between'>
              <TextHeading>{t('Add Funds')}</TextHeading>
            </div>
            <TokenInput
              asset={chainLINK}
              setAsset={setChainLINK}
              amount={amount}
              setAmount={setAmount}
              autoFocus
              assetData={chainLINKData}
              assetNull
            />
            {amount < 0.1 && <ErrorMessage message={t('LINK Amount should be larger')} />}
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
            onDepositFunds(contract.address, chainLINK.address, amount, () => {
              mutateAutomationData()
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
