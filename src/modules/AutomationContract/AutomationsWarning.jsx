import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { Info } from '@/components/alert'
import { PrimaryButton } from '@/components/buttons/Button'
import { AUTOMATION_STATUS } from '@/constant'
import { useVeTheAutomations } from '@/hooks/automationContract/useAutomationContract'
import { InfoCirclePrimary } from '@/svgs'

import DepositFundsModal from './Edits/DepositFundsModal'
import ChainlinkModal from './head/ChainlinkModal'

function WarningRegisterItem({ data, mutateStatusAndBalanceMultiple = () => {} }) {
  const t = useTranslations()
  const [chainLINKPopup, setChainLINKPopup] = useState(false)
  return (
    <>
      <article className='my-4'>
        <Info className='flex-col sm:flex-row lg:p-8'>
          <div className='flex items-center gap-4'>
            <InfoCirclePrimary className='h-4 w-4 min-w-4 lg:h-8 lg:w-8 lg:min-w-8' />
            <p>
              {t(
                'You need to register the automation for your [veTheId] lock and grant the necessary veTHE approvals for it to function properly',
                { veTheId: data.id },
              )}
            </p>
          </div>
          <PrimaryButton
            onClick={() => setChainLINKPopup(true)}
            className='ml-auto max-sm:w-full sm:min-w-fit sm:justify-end'
          >
            {t('Register Automation')}
          </PrimaryButton>
        </Info>
      </article>
      {chainLINKPopup && (
        <ChainlinkModal
          tokenId={data.id}
          address={data.contractAddress}
          mutateAutomationData={() => {
            mutateStatusAndBalanceMultiple()
          }}
          popup={chainLINKPopup}
          setPopup={setChainLINKPopup}
        />
      )}
    </>
  )
}

function WarningUnderfundedItem({ data, mutateStatusAndBalanceMultiple = () => {} }) {
  const t = useTranslations()
  const [depositFundsPopup, setDepositFundsPopup] = useState(false)
  return (
    <>
      <article className='my-4'>
        <Info className='flex-col sm:flex-row lg:p-8'>
          <div className='flex items-center gap-4'>
            <InfoCirclePrimary className='h-4 w-4 min-w-4 lg:h-8 lg:w-8 lg:min-w-8' />
            <p>
              {t('Warning underfunded Automation [veTheId]', { veTheId: data.id })}{' '}
              <Link
                className='text-primary-600'
                href='https://docs.chain.link/chainlink-automation/overview/automation-economics'
                target='_blank'
              >
                {t('Learn more')}
              </Link>
            </p>
          </div>
          <PrimaryButton
            onClick={() => setDepositFundsPopup(true)}
            className='ml-auto max-sm:w-full sm:min-w-fit sm:justify-end'
          >
            {t('Fund Contract')}
          </PrimaryButton>
        </Info>
      </article>
      {depositFundsPopup && (
        <DepositFundsModal
          contract={{ veTHEId: data.id, address: data.contractAddress }}
          popup={depositFundsPopup}
          setPopup={setDepositFundsPopup}
          onSuccess={mutateStatusAndBalanceMultiple}
        />
      )}
    </>
  )
}

function AutomationsWarning() {
  const { data, isLoading, refetch: refetchAutomations } = useVeTheAutomations()
  if (isLoading && !data && !data?.id) return null

  return (
    <div className='flex flex-col gap-6'>
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
