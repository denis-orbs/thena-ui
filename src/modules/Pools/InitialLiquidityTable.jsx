import { useTranslations } from 'next-intl'

import { mockTokens } from '@/app/pools/[address]/page'
import { OutlinedButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import { TextHeading } from '@/components/typography'

function InitialLiquidityRow({ token }) {
  const t = useTranslations()
  return (
    <div className='flex w-full justify-between'>
      <div className='flex items-center gap-2 lg:gap-3'>
        <CircleImage className='h-7 w-7 lg:h-8 lg:w-8' src={token?.logoURI} alt='thena logo' />
        <div>
          <TextHeading className='text-xs font-medium lg:text-[18px] lg:leading-[26px]'>{token?.symbol}</TextHeading>
          <span className='text-xs font-medium text-neutral-300 lg:text-[18px] lg:leading-[26px]'>54%</span>
          <br />
          <span className='text-[16px] font-normal leading-5 text-neutral-500'>{t('Initial weight')}: 25%</span>
        </div>
      </div>
      <div>
        <span className='text-[18px] font-medium'>999</span>
        <br />
        <span className='text-[16px] font-normal text-neutral-500'>$9,999</span>
      </div>
    </div>
  )
}

export function InitialLiquidityTable({ pool }) {
  const t = useTranslations()
  return (
    <div className='flex flex-col gap-4 rounded-lg bg-neutral-900 p-6'>
      <InitialLiquidityRow token={pool?.token0 ?? mockTokens[0]} />
      <hr className='border-neutral-700' />
      <InitialLiquidityRow token={pool?.token1 ?? mockTokens[1]} />
      <hr className='border-neutral-700' />
      <div className='flex w-full justify-between'>
        <span className='text-[18px] font-medium'>{t('Total')}</span>
        <span className='text-[18px] font-medium'>$20,000</span>
      </div>

      <OutlinedButton>{t('Withdraw Initial Liquidity')}</OutlinedButton>
    </div>
  )
}
