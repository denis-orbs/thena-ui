'use client'

import { isString } from 'lodash'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { TextHeading } from '@/components/typography'
import { cn, formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'

export function CompetitionCardHeader({ competition, className, banner }) {
  const {
    name,
    prizeUpdate: { token: prizeTokenUpdate, totalPrize: totalPrizeUpdate },
  } = competition

  const t = useTranslations()
  const currentPrizePoolUpdate = useMemo(() => {
    const isInvalidPrizePool = totalPrizeUpdate.every(item => isInvalidAmount(item))
    let prizePool = totalPrizeUpdate.map((item, index) => {
      const token = prizeTokenUpdate[index]
      return {
        amount: formatAmount(fromWei(item, token?.decimals)),
        symbol: token?.symbol,
        logoURI: token?.logoURI,
      }
    })

    if (!isInvalidPrizePool) {
      prizePool = prizePool.filter(item => !isInvalidAmount(item.amount))
    }

    return prizePool
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(prizeTokenUpdate), totalPrizeUpdate])

  return (
    <div
      className={cn(
        'relative rounded-xl p-3 xl:p-4',
        banner ? '' : competition.owner.isVerified ? 'bg-linear-to-r from-blue-400 to-blue-500' : 'bg-[#100913]',
        className,
      )}
    >
      {banner ? (
        <Image
          alt='background'
          src={isString(banner) ? banner : URL.createObjectURL(banner)}
          fill
          priority
          className='absolute top-0 right-0 bottom-0 left-0 -z-1 rounded-xl object-fill'
        />
      ) : (
        currentPrizePoolUpdate?.length && (
          <div className='absolute top-0 right-0 bottom-0 left-0 z-1 flex transform flex-col items-center justify-center gap-2 rounded-xl bg-white/5 p-4 backdrop-invert backdrop-opacity-5'>
            <TextHeading className='text-center text-2xl'>{t('Compete For')}</TextHeading>
            <TextHeading className='flex flex-wrap items-center justify-center gap-1 text-nowrap'>
              {currentPrizePoolUpdate.map((item, index) => (
                <span key={index} className='flex text-nowrap'>
                  <span className='flex items-center text-nowrap'>
                    {item.amount} {item.symbol}
                    {item?.logoURI && (
                      <Image
                        alt={name}
                        src={item?.logoURI}
                        className='ml-1 inline-block shrink-0'
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
