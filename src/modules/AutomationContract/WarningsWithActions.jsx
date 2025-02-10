import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { AUTOMATION_STATUS } from '@/constant'
import {
  useAutomationStatus,
  useGetMaxPaymentForGas,
  useStatusAndBalanceMultiple,
} from '@/hooks/automationContract/useAutomationContract'
import { fromWei } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

import DepositFundsModal from './Edits/DepositFundsModal'
import ChainlinkModal from './head/ChainlinkModal'

function WarningRegisterItem({ data, mutateStatusAndBalanceMultiple = () => {} }) {
  const t = useTranslations()
  const [chainLINKPopup, setChainLINKPopup] = useState(false)
  const { mutateData: mutateDataStatus } = useAutomationStatus(data.veTHEId)
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
          mutateDataStatus()
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
            <span className='text-primary-600'>{t('Learn more')}</span>
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

function WarningsWithActions({ veTHEs }) {
  const { data, isLoading, mutate: mutateStatusAndBalanceMultiple } = useStatusAndBalanceMultiple(veTHEs)
  const maxPaymentForGas = useGetMaxPaymentForGas()
  if (isLoading && !data && !data?.id) return null

  return (
    <div className='space-y-6'>
      {(data || []).map(item => {
        if (item.statusString === AUTOMATION_STATUS.PENDING) {
          return (
            <React.Fragment key={item.id}>
              <WarningRegisterItem mutateStatusAndBalanceMultiple={mutateStatusAndBalanceMultiple} data={item} />
            </React.Fragment>
          )
        }
        if (
          item.balanceAuto !== null &&
          item.statusString !== AUTOMATION_STATUS.CANCELED &&
          fromWei(item.balanceAuto).lt(maxPaymentForGas)
        ) {
          return (
            <WarningUnderfundedItem
              mutateStatusAndBalanceMultiple={mutateStatusAndBalanceMultiple}
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

export default WarningsWithActions
