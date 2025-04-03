import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React from 'react'

import { ErrorButton } from '@/components/buttons/Button'
import { Paragraph } from '@/components/typography'
import { useGetMinimumFunds } from '@/hooks/automationContract/useAutomationContract'
import { convertBooleansToHex, formatAmount } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

function WarningLINKBalance({ contract, chainLINK }) {
  const t = useTranslations()
  const { minimumFunds: minFunds } = useGetMinimumFunds(
    contract?.veTHEId,
    convertBooleansToHex(
      contract?.votes?.isAutoVote,
      contract?.settings?.isRelockEveryWeek,
      contract?.settings?.isClaimEveryWeek,
    ),
    (contract?.votes?.pairs || []).filter(item => Boolean(item.pair)).length,
  )
  const { push } = useRouter()
  return (
    <>
      {chainLINK && minFunds?.gt(chainLINK?.balance) ? (
        <div className='flex items-center gap-4 rounded-xl border border-error-800 bg-error-950 px-4 py-2 lg:px-5 lg:py-4'>
          <InfoIcon className='h-5 w-5 !stroke-error-800' />
          <div className='flex w-full flex-row items-center justify-between gap-2'>
            <Paragraph className='text-base text-red-100'>
              {t('You have [balance] LINK in your Wallet', { balance: formatAmount(chainLINK.balance) || 0 })}
            </Paragraph>
            <ErrorButton
              onClick={
                () =>
                  push('/swap?inputCurrency=BNB&outputCurrency=0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd&swapType=1')
                // eslint-disable-next-line react/jsx-curly-newline
              }
              className='min-w-fit bg-error-800'
            >
              {t('Get LINK')}
            </ErrorButton>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  )
}

export default WarningLINKBalance
