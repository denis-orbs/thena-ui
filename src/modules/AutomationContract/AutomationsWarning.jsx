import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { AUTOMATION_STATUS } from '@/constant'
import { useVeTheAutomations } from '@/hooks/automationContract/useAutomationContract'
import { InfoIcon } from '@/svgs'

import DepositFundsModal from './Edits/DepositFundsModal'
import ChainlinkModal from './head/ChainlinkModal'

function WarningRegisterItem({ data, mutateStatusAndBalanceMultiple = () => {} }) {
  const t = useTranslations()
  const [chainLINKPopup, setChainLINKPopup] = useState(false)
  return (
    <>
      <Box className='flex w-full flex-row items-center justify-between gap-3 border border-primary-800 bg-primary-950'>
        <div className='flex items-center gap-3'>
          <InfoIcon className='h-5 w-5 !stroke-primary-600' />
          <TextHeading className='text-neutral-100'>
            {t(
              'You need to register the automation for your [veTheId] lock and grant the necessary veTHE approvals for it to function properly',
              { veTheId: data.id },
            )}
          </TextHeading>
        </div>
        <PrimaryButton onClick={() => setChainLINKPopup(true)} className='w-fit'>
          {t('Register Automation')}
        </PrimaryButton>
      </Box>
      <ChainlinkModal
        tokenId={data.id}
        address={data.contractAddress}
        mutateAutomationData={() => {
          mutateStatusAndBalanceMultiple()
        }}
        popup={chainLINKPopup}
        setPopup={setChainLINKPopup}
      />
    </>
  )
}

function WarningUnderfundedItem({ data, mutateStatusAndBalanceMultiple = () => {} }) {
  const t = useTranslations()
  const [depositFundsPopup, setDepositFundsPopup] = useState(false)
  return (
    <>
      <Box className='flex w-full flex-row items-center justify-between gap-3 border border-primary-800 bg-primary-950'>
        <div className='flex items-center gap-3'>
          <InfoIcon className='h-5 w-5 !stroke-primary-600' />
          <TextHeading className='text-neutral-100'>
            {t('Warning underfunded Automation [veTheId]', { veTheId: data.id })}{' '}
            <Link
              className='text-primary-600'
              href='https://docs.chain.link/chainlink-automation/overview/automation-economics'
              target='_blank'
            >
              {t('Learn more')}
            </Link>
          </TextHeading>
        </div>
        <PrimaryButton onClick={() => setDepositFundsPopup(true)} className='w-fit'>
          {t('Fund Contract')}
        </PrimaryButton>
      </Box>
      <DepositFundsModal
        contract={{ veTHEId: data.id, address: data.contractAddress }}
        popup={depositFundsPopup}
        setPopup={setDepositFundsPopup}
        onSuccess={mutateStatusAndBalanceMultiple}
      />
    </>
  )
}

function AutomationsWarning() {
  const { data, isLoading, refetch: refetchAutomations } = useVeTheAutomations()
  if (isLoading && !data && !data?.id) return null

  return (
    <div className='space-y-6'>
      {(data || []).map(item => {
        if (item.statusString === AUTOMATION_STATUS.PENDING) {
          return (
            <React.Fragment key={item.id}>
              <WarningRegisterItem
                mutateStatusAndBalanceMultiple={() => {
                  refetchAutomations()
                }}
                data={item}
              />
            </React.Fragment>
          )
        }
        if (item.statusString !== AUTOMATION_STATUS.CANCELED && item.minBalanceAuto.gt(item.balanceAuto)) {
          return (
            <WarningUnderfundedItem
              mutateStatusAndBalanceMultiple={() => {
                refetchAutomations()
              }}
              key={item.id}
              data={item}
            />
          )
        }
        return null
      })}
    </div>
  )
}

export default AutomationsWarning
