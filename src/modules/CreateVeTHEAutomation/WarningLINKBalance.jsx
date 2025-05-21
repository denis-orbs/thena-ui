import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { ErrorButton } from '@/components/buttons/Button'
import { Paragraph } from '@/components/typography'
import { useGetMinimumFunds } from '@/hooks/automationContract/useAutomationContract'
import { convertBooleansToHex, formatAmount } from '@/lib/utils'
import SwapModal from '@/modules/SwapModal'
import { InfoIcon } from '@/svgs'

function WarningLINKBalance({ contract, chainLINK }) {
  const t = useTranslations()
  const [openSwapModal, setOpenSwapModal] = useState(false)
  const { minimumFunds: minFunds } = useGetMinimumFunds(
    contract?.veTHEId,
    convertBooleansToHex(
      contract?.votes?.isAutoVote,
      contract?.settings?.isRelockEveryWeek,
      contract?.settings?.isClaimEveryWeek,
    ),
    (contract?.votes?.pairs || []).filter(item => Boolean(item.pair)).length,
  )
  return (
    <>
      {chainLINK && minFunds?.gt(chainLINK?.balance) && (
        <div className='flex items-center gap-4 rounded-xl border border-error-800 bg-error-950 px-4 py-2 lg:px-5 lg:py-4'>
          <InfoIcon className='h-5 w-5 !stroke-error-800' />
          <div className='flex w-full flex-row items-center justify-between gap-2'>
            <Paragraph className='text-base text-red-100'>
              {t('You have [balance] LINK in your Wallet', { balance: formatAmount(chainLINK.balance) || 0 })}
            </Paragraph>
            <ErrorButton onClick={() => setOpenSwapModal(true)} className='min-w-fit bg-error-800'>
              {t('Get LINK')}
            </ErrorButton>
          </div>
          <SwapModal
            open={openSwapModal}
            setOpen={setOpenSwapModal}
            inputCurrency='BNB'
            outputCurrency='0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd'
            disabledChangeOutputCurrency
          />
        </div>
      )}
    </>
  )
}

export default WarningLINKBalance
