import { useTranslations } from 'next-intl'
import React from 'react'

import { NewTextHeading, NewTextSubHeading } from '@/components/typography'
import { formatAmount } from '@/utils/utils'

function HeaderRewards({ totalUsd, account }) {
  const t = useTranslations()

  return (
    <div className='z-30 py-4 md:pt-7 md:pb-0'>
      <div className='inset-0 flex h-full w-full items-center justify-center'>
        <div className='flex w-fit flex-col gap-2 text-center'>
          <NewTextHeading className='bg-linear-to-b from-[#F199EE] to-[#DC00D4] bg-clip-text text-[60px]! leading-[60px]! text-transparent'>
            {account ? `$ ${formatAmount(totalUsd)}` : '--.--'}
          </NewTextHeading>
          <NewTextSubHeading className='font-archia max-md:text-primary-200 text-sm font-bold uppercase md:text-[30px] md:leading-9 md:font-semibold'>
            {account ? t('total rewards claimable') : t('Connect your wallet')}
          </NewTextSubHeading>
        </div>
      </div>
    </div>
  )
}

export default HeaderRewards
