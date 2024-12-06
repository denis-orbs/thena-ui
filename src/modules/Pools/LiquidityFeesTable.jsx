import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import CircleImage from '@/components/image/CircleImage'
import { TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { cn } from '@/lib/utils'

function LiquidityFeeRow({ token }) {
  const t = useTranslations()
  // const { getValueTokenAmountToUSD } = useTokenUSDValue()

  return (
    <div className='grid grid-cols-2 gap-y-4 rounded-lg bg-neutral-800  px-5 py-4 lg:grid-cols-3'>
      <div className='flex flex-col items-start lg:col-span-1 lg:flex-row lg:items-center'>
        <div className='mb-1 text-[13px] font-normal leading-5 lg:hidden'>{t('Token and Weight')}</div>
        <div className='flex items-center gap-2 lg:gap-3'>
          <CircleImage className='h-7 w-7 lg:h-8 lg:w-8' src={token?.logoURI || UNKNOWN_LOGO} alt='thena logo' />
          <TextHeading className='text-base font-medium lg:text-[18px] lg:leading-[26px]'>{token?.symbol}</TextHeading>
          <span
            className={cn(
              'text-xs font-medium text-neutral-300 lg:text-[18px] lg:leading-[26px]',
              !token?.weight && 'hidden',
            )}
          >
            {token?.weight}%
          </span>
        </div>
      </div>
      <div className='flex flex-col items-start'>
        <div className='mb-1 text-[13px] font-normal leading-5 lg:hidden'>{t('Current Liquidity')}</div>
        <p className='text-[18px] font-medium leading-[26px]'>TODO (API)</p>
        <p className='text-[14px] font-normal leading-[26px] text-neutral-200'>$TODO</p>
        {/* <p className='text-[18px] font-medium leading-[26px]'>{formatAmount(token?.liquidity)}</p>
        <p className='text-[14px] font-normal leading-[26px] text-neutral-200'>
          ${formatAmount(getValueTokenAmountToUSD(token.address, token.liquidity))}
        </p> */}
      </div>
      <div className='flex flex-col items-start'>
        <div className='mb-1 text-[13px] font-normal leading-5 lg:hidden'>{t('Generated Cumulative Fees')}</div>
        <p className='text-[18px] font-medium leading-[26px]'>TODO (API)</p>
        <p className='text-[14px] font-normal leading-[26px] text-neutral-200'>$TODO</p>
        {/* <p className='text-[18px] font-medium leading-[26px]'>{formatAmount(token?.claimable)}</p>
<p className='text-[14px] font-normal leading-[26px] text-neutral-200'>${formatAmount(token?.claimableUsd)}</p> */}
      </div>
    </div>
  )
}

export function LiquidityFeesTable({ pool }) {
  const t = useTranslations()

  const tokensList = useMemo(() => {
    if (!pool?.tokens) return []

    return pool.tokens.map(token => {
      const liquidity = Number(token?.balance?.toNumber() ?? 0)

      return {
        ...token,
        liquidity,
      }
    })
  }, [pool.tokens])

  return (
    <div className='flex flex-col gap-4 rounded-lg bg-neutral-900 p-6'>
      <div className='hidden grid-cols-3 px-5 text-[14px] font-normal leading-5 lg:grid'>
        <div className='col-span-1'>{t('Token and Weight')}</div>
        <div>{t('Current Liquidity')}</div>
        <div>{t('Generated Cumulative Fees')}</div>
      </div>

      <div className='flex flex-col gap-3'>
        {tokensList.map(token => (
          <LiquidityFeeRow key={token?.address} token={token} />
        ))}
      </div>
    </div>
  )
}
