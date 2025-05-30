import { useTranslations } from 'next-intl'
import React from 'react'
import useSWR from 'swr'

import { NewTextHeading, NewTextSubHeading } from '@/components/typography'
import { fetchStats } from '@/lib/subgraph'
import { formatAmount } from '@/lib/utils'

function HeaderRewards({ totalUsd, account }) {
  const t = useTranslations()
  const { data: chartData } = useSWR('thena total stats', () => fetchStats())

  return (
    <div className='z-30 py-4 md:pb-0 md:pt-7'>
      <div className='inset-0 flex h-full w-full items-center justify-center'>
        <div className='flex w-fit flex-col gap-2 text-center'>
          <NewTextHeading className='bg-gradient-to-b from-[#F199EE] to-[#DC00D4] bg-clip-text !text-[60px] !leading-[60px] text-transparent'>
            {account
              ? `$ ${formatAmount(totalUsd)}`
              : chartData
                ? `$ ${formatAmount(chartData?.revenueData, true)}`
                : '--.--'}
          </NewTextHeading>
          <NewTextSubHeading className='font-archia text-sm font-bold uppercase max-md:text-primary-200 md:text-[30px] md:font-semibold md:leading-9'>
            {account ? t('total rewards claimable') : t('Connect your wallet')}
          </NewTextSubHeading>
        </div>
      </div>
    </div>
  )
}

export default HeaderRewards
