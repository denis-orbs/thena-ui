import { useTranslations } from 'next-intl'

import CircleImage from '@/components/image/CircleImage'
import { TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { formatAmount } from '@/lib/utils'

function LiquidityFeeRow({ token }) {
  const t = useTranslations()
  const { getValueTokenAmountToUSD } = useTokenUSDValue()

  return (
    <div className='grid grid-cols-2 gap-y-4 rounded-lg bg-neutral-800  px-5 py-4 lg:grid-cols-5 '>
      <div className='flex flex-col items-start lg:col-span-2 lg:flex-row lg:items-center'>
        <div className='mb-1 text-[13px] font-normal leading-5 lg:hidden'>{t('Token and Weight')}</div>
        <div className='flex items-center gap-2 lg:gap-3'>
          <CircleImage className='h-7 w-7 lg:h-8 lg:w-8' src={token?.logoURI || UNKNOWN_LOGO} alt='thena logo' />
          <TextHeading className='text-base font-medium lg:text-[18px] lg:leading-[26px]'>{token?.symbol}</TextHeading>
          <span className='text-xs font-medium text-neutral-300 lg:text-[18px] lg:leading-[26px]'>
            {token?.weight}%
          </span>
        </div>
      </div>
      <div className='flex flex-col items-start'>
        <div className='mb-1 text-[13px] font-normal leading-5 lg:hidden'>{t('Current Liquidity')}</div>
        <p className='text-[18px] font-medium leading-[26px]'>{formatAmount(token.reserve)}</p>
        <p className='text-[14px] font-normal leading-[26px] text-neutral-200'>
          ${formatAmount(getValueTokenAmountToUSD(token.address, token.reserve))}
        </p>
      </div>
      <div className='flex flex-col items-start'>
        <div className='mb-1 text-[13px] font-normal leading-5 lg:hidden'>{t('Unclaimed Fees')}</div>
        <p className='text-[18px] font-medium leading-[26px]'>9,999,999</p>
        <p className='text-[14px] font-normal leading-[26px] text-neutral-200'>$999,999</p>
      </div>
      <div className='flex flex-col items-start'>
        <div className='mb-1 text-[13px] font-normal leading-5 lg:hidden'>{t('Claimed Fees')}</div>
        <p className='text-[18px] font-medium leading-[26px]'>9,999,999</p>
        <p className='text-[14px] font-normal leading-[26px] text-neutral-200'>$999,999</p>
      </div>
    </div>
  )
}

export function LiquidityFeesTable({ pool, isWeighted }) {
  const t = useTranslations()

  return (
    <div className='flex flex-col gap-4 rounded-lg bg-neutral-900 p-6'>
      <div className='hidden grid-cols-5 px-5 text-[14px] font-normal leading-5 lg:grid'>
        <div className='col-span-2'>{t('Token and Weight')}</div>
        <div>{t('Current Liquidity')}</div>
        <div>{t('Unclaimed Fees')}</div>
        <div>{t('Claimed Fees')}</div>
      </div>
      {!isWeighted && (
        <>
          <LiquidityFeeRow token={pool?.token0} />
          <LiquidityFeeRow token={pool?.token1} />
        </>
      )}
      {isWeighted && (pool?.tokens || []).map(token => <LiquidityFeeRow token={token} key={token?.address} />)}
    </div>
  )
}
