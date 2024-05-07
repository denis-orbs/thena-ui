'use client'

import { isString } from 'lodash'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { TextHeading } from '@/components/typography'
import { cn, formatAmount, fromWei } from '@/lib/utils'

export function CompetitionCardHeader({ competition, className, banner }) {
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
    <div
      className={cn(
        'relative rounded-xl p-4',
        banner ? '' : competition.owner.isVerified ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-[#100913]',
        className,
      )}
    >
      {banner ? (
        <Image
          alt='background'
          src={isString(banner) ? banner : URL.createObjectURL(banner)}
          layout='fill'
          objectFit='fill'
          className='-z-1 absolute bottom-0 left-0 right-0 top-0 rounded-xl'
        />
      ) : (
        totalPrize && (
          <div className='z-1 absolute bottom-0 left-0 right-0 top-0 flex transform flex-col items-center justify-center gap-2 rounded-xl bg-white/5 p-4 backdrop-invert backdrop-opacity-5'>
            <TextHeading className='text-center text-2xl'>{t('Compete For')}</TextHeading>
            <TextHeading className='flex items-center text-nowrap'>
              {currentPrizePool} {prizeToken?.symbol}
              {prizeToken?.logoURI && (
                <Image
                  alt={name}
                  src={prizeToken?.logoURI}
                  className='ml-1 inline-block flex-shrink-0'
                  width={20}
                  height={20}
                  loading='lazy'
                />
              )}
            </TextHeading>
          </div>
        )
      )}
    </div>
  )
}
