import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { useTranslations } from 'use-intl'

import { Info } from '@/components/alert'
import { PrimaryButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { AUTOMATION_STATUS } from '@/constant'
import { useVeTheAutomations } from '@/hooks/automationContract/useAutomationContract'
import { fromWei } from '@/lib/utils'
import { InfoCirclePrimary } from '@/svgs'

import DepositFundsModal from './Edits/DepositFundsModal'
import ChainlinkModal from './head/ChainlinkModal'

function WarningWithAction({ mutateAutomationData, contractData }) {
  const [chainLINKPopup, setChainLINKPopup] = useState(false)
  const [depositFundsPopup, setDepositFundsPopup] = useState(false)

  const { data: veTHEs, refetch: refetchAutomations } = useVeTheAutomations()
  const veTHE = veTHEs?.find(item => item.id === contractData.veTHEId)
  const status = veTHE?.statusString || AUTOMATION_STATUS.NO

  const t = useTranslations()

  const data = useMemo(() => {
    if (status === AUTOMATION_STATUS.PENDING) {
      return {
        message: t('Warning register automation'),
        btnText: t('Register Automation'),
        onClick: () => setChainLINKPopup(true),
      }
    }

    if (fromWei(contractData.minBalance).gt(fromWei(contractData.balance))) {
      return {
        message: (
          <>
            {t('Warning automation underfunded')}{' '}
            <Link
              className='text-primary-600'
              href='https://docs.chain.link/chainlink-automation/overview/automation-economics'
              target='_blank'
            >
              {t('Learn more')}
            </Link>
          </>
        ),
        btnText: t('Fund Contract'),
        onClick: () => setDepositFundsPopup(true),
      }
    }
    return undefined
  }, [contractData.balance, contractData.minBalance, status, t])

  if (!data) return <></>
  return (
    <>
      <article className='my-4'>
        <Info className='flex-col sm:flex-row lg:p-8'>
          <div className='flex items-center gap-4'>
            <InfoCirclePrimary className='h-4 w-4 min-w-4 lg:h-8 lg:w-8 lg:min-w-8' />
            <TextHeading className='text-neutral-100'>{data?.message}</TextHeading>
          </div>
          <PrimaryButton onClick={data.onClick} className='ml-auto max-sm:w-full sm:min-w-fit sm:justify-end'>
            {data?.btnText}
          </PrimaryButton>
        </Info>
      </article>
      <ChainlinkModal
        tokenId={contractData.veTHEId}
        address={contractData.address}
        mutateAutomationData={() => {
          mutateAutomationData()
          refetchAutomations()
        }}
        popup={chainLINKPopup}
        setPopup={setChainLINKPopup}
      />
      <DepositFundsModal contract={contractData} popup={depositFundsPopup} setPopup={setDepositFundsPopup} />
    </>
  )
}

export default WarningWithAction
