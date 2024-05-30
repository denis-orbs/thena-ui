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
    prizeUpdate: { token: prizeTokenUpdate, totalPrize: totalPrizeUpdate },
  } = competition

  const t = useTranslations()
  const currentPrizePoolUpdate = useMemo(
    () =>
      totalPrizeUpdate.map((item, index) => {
        const token = prizeTokenUpdate[index]
        return {
          amount: formatAmount(fromWei(item, token?.decimals)),
          symbol: token?.symbol,
          logoURI: token?.logoURI,
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prizeTokenUpdate.length, totalPrizeUpdate.length],
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
        currentPrizePoolUpdate?.length && (
          <div className='z-1 absolute bottom-0 left-0 right-0 top-0 flex transform flex-col items-center justify-center gap-2 rounded-xl bg-white/5 p-4 backdrop-invert backdrop-opacity-5'>
            <TextHeading className='text-center text-2xl'>{t('Compete For')}</TextHeading>
            <TextHeading className='flex items-center gap-1 text-nowrap'>
              {currentPrizePoolUpdate.map((item, index) => (
                <span key={index} className='flex text-nowrap'>
                  <span className='flex items-center text-nowrap'>
                    {item.amount} {item.symbol}
                    {item?.logoURI && (
                      <Image
                        alt={name}
                        src={item?.logoURI}
                        className='ml-1 inline-block flex-shrink-0'
                        width={20}
                        height={20}
                        loading='lazy'
                      />
                    )}
                  </span>
                  {index !== currentPrizePoolUpdate.length - 1 && <span>,</span>}
                </span>
              ))}
            </TextHeading>
          </div>
        )
      )}
    </div>
  )
}
