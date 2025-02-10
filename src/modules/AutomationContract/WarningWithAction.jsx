import React, { useMemo, useState } from 'react'
import { useTranslations } from 'use-intl'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { AUTOMATION_STATUS } from '@/constant'
import { useAutomationStatus, useGetMaxPaymentForGas } from '@/hooks/automationContract/useAutomationContract'
import { InfoIcon } from '@/svgs'

import DepositFundsModal from './Edits/DepositFundsModal'
import ChainlinkModal from './head/ChainlinkModal'

function WarningWithAction({ mutateAutomationData, contractData }) {
  const [chainLINKPopup, setChainLINKPopup] = useState(false)
  const [depositFundsPopup, setDepositFundsPopup] = useState(false)
  const maxPaymentForGas = useGetMaxPaymentForGas()

  const { status, mutateData: mutateDataStatus } = useAutomationStatus(contractData.veTHEId)

  const t = useTranslations()

  const data = useMemo(() => {
    if (status === AUTOMATION_STATUS.PENDING) {
      return {
        message: t('Warning register automation'),
        btnText: t('Register Automation'),
        onClick: () => setChainLINKPopup(true),
      }
    }

    if (maxPaymentForGas.gt(contractData.balance)) {
      return {
        message: (
          <>
            {t('Warning automation underfunded')}{' '}
            <span className='cursor-pointer text-primary-600'>{t('Learn more')}</span>
          </>
        ),
        btnText: t('Fund Contract'),
        onClick: () => setChainLINKPopup(true),
      }
    }
    return undefined
  }, [contractData.balance, maxPaymentForGas, status, t])

  if (!data) return <></>
  return (
    <>
      <Box className='flex w-full flex-row items-center justify-between  gap-3 border border-primary-800 bg-primary-950'>
        <div className='flex items-center gap-3'>
          <InfoIcon className='h-5 w-5 !stroke-primary-600' />
          <TextHeading className='text-neutral-100'>{data?.message}</TextHeading>
        </div>
        <PrimaryButton onClick={data.onClick} className='w-fit'>
          {data?.btnText}
        </PrimaryButton>
      </Box>
      <ChainlinkModal
        tokenId={contractData.veTHEId}
        address={contractData.address}
        mutateAutomationData={() => {
          mutateAutomationData()
          mutateDataStatus()
        }}
        popup={chainLINKPopup}
        setPopup={setChainLINKPopup}
      />
      <DepositFundsModal contract={contractData} popup={depositFundsPopup} setPopup={setDepositFundsPopup} />
    </>
  )
}

export default WarningWithAction
