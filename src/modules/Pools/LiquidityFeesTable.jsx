import { useTranslations } from 'next-intl'

import { mockTokens } from '@/app/pools/[address]/page'
import CircleImage from '@/components/image/CircleImage'
import { TextHeading } from '@/components/typography'

function LiquidityFeeRow({ token }) {
  const t = useTranslations()

  return (
    <div className='grid grid-cols-2 gap-y-4 rounded-lg bg-neutral-800  px-5 py-4 lg:grid-cols-5 '>
      <div className='flex flex-col items-start lg:col-span-2 lg:flex-row lg:items-center'>
        <div className='mb-1 text-[13px] font-normal leading-5 lg:hidden'>{t('Token and Weight')}</div>
        <div className='flex items-center gap-2 lg:gap-3'>
          <CircleImage className='h-7 w-7 lg:h-8 lg:w-8' src={token?.logoURI} alt='thena logo' />
          <TextHeading className='text-xs font-medium lg:text-[18px] lg:leading-[26px]'>{token?.symbol}</TextHeading>
          <span className='text-xs font-medium text-neutral-300 lg:text-[18px] lg:leading-[26px]'>54%</span>
        </div>
      </div>
      <div className='flex flex-col items-start'>
        <div className='mb-1 text-[13px] font-normal leading-5 lg:hidden'>{t('Current Liquidity')}</div>
        <p className='text-[18px] font-medium leading-[26px]'>9,999,999</p>
        <p className='text-[14px] font-normal leading-[26px] text-neutral-200'>$999,999</p>
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

export function LiquidityFeesTable({ pool, mockIsWeighted }) {
  const t = useTranslations()

  return (
    <div className='flex flex-col gap-4 rounded-lg bg-neutral-900 p-6'>
      <div className='hidden grid-cols-5 px-5 text-[14px] font-normal leading-5 lg:grid'>
        <div className='col-span-2'>{t('Token and Weight')}</div>
        <div>{t('Current Liquidity')}</div>
        <div>{t('Unclaimed Fees')}</div>
        <div>{t('Claimed Fees')}</div>
      </div>
      <LiquidityFeeRow token={pool?.token0 ?? mockTokens[0]} />
      <LiquidityFeeRow token={pool?.token1 ?? mockTokens[1]} />
      {mockIsWeighted && mockTokens.map((token, index) => <LiquidityFeeRow token={token} key={index} />)}
    </div>
  )
}
