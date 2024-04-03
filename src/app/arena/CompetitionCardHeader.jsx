'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { TextHeading } from '@/components/typography'
import { cn, formatAmount, fromWei } from '@/lib/utils'

export function CompetitionCardHeader({ competition, className }) {
  const {
    name,
    prize: { token: prizeToken, totalPrize },
  } = competition
  const t = useTranslations()
  const currentPrizePool = useMemo(
    () => formatAmount(fromWei(totalPrize, prizeToken?.decimals)),
    [prizeToken?.decimals, totalPrize],
  )

  return (
    <div className={cn('flex items-center justify-center gap-2 rounded-xl bg-[#100913] p-4', className)}>
      <TextHeading className='text-center text-2xl'>
        {t('Compete For')}{' '}
        <TextHeading className='text-nowrap'>
          {currentPrizePool} {prizeToken?.symbol}
          <Image
            alt={name}
            src={`https://cdn.thena.fi/assets/${prizeToken?.symbol}.png`}
            className='ml-1 inline-block flex-shrink-0'
            width={20}
            height={20}
            loading='lazy'
          />
        </TextHeading>
      </TextHeading>
    </div>
  )
}
