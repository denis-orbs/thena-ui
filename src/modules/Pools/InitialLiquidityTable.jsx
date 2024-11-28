import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

import { OutlinedButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import { TextHeading } from '@/components/typography'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { formatAmount } from '@/lib/utils'

// TODO value 'reserve' incorrect, just for test UI, replace 'reserve' then
function InitialLiquidityRow({ token }) {
  const { getValueTokenAmountToUSD } = useTokenUSDValue()
  const t = useTranslations()
  return (
    <div className='flex w-full justify-between pt-2'>
      <div className='flex items-center gap-2 lg:gap-3'>
        <CircleImage className='h-7 w-7 lg:h-8 lg:w-8' src={token?.logoURI} alt='thena logo' />
        <div>
          <TextHeading className='text-xs font-medium lg:text-[18px] lg:leading-[26px]'>{token?.symbol}</TextHeading>
          <span className='text-xs font-medium text-neutral-300 lg:text-[18px] lg:leading-[26px]'>
            ({token?.weight}%)
          </span>
          <br />
          <span className='text-[16px] font-normal leading-5 text-neutral-500'>
            {t('Initial weight')}: {token?.weight}%
          </span>
        </div>
      </div>
      <div>
        {/* TODO */}
        <span className='float-end text-[18px] font-medium'>{formatAmount(token?.reserve)}</span>
        <br />
        <span className='text-[16px] font-normal text-neutral-500'>
          ${formatAmount(getValueTokenAmountToUSD(token?.address, token?.reserve))}
        </span>
      </div>
    </div>
  )
}

export function InitialLiquidityTable({ pool }) {
  const t = useTranslations()
  const { getValueTokenAmountToUSD } = useTokenUSDValue()
  // TODO
  const totalValueUsd = useMemo(
    () => (pool.tokens || []).reduce((sum, token) => sum + getValueTokenAmountToUSD(token?.address, token?.reserve), 0),
    [getValueTokenAmountToUSD, pool.tokens],
  )
  return (
    <div className='flex flex-col gap-4 divide-y divide-neutral-700 rounded-lg bg-neutral-900 p-6'>
      {(pool.tokens || []).map(item => (
        <InitialLiquidityRow token={item} key={item?.address} />
      ))}
      <div className='flex flex-row justify-between pt-4'>
        <TextHeading>{t('Total')}</TextHeading>
        <TextHeading>${formatAmount(totalValueUsd)}</TextHeading>
      </div>

      <OutlinedButton>{t('Withdraw Initial Liquidity')}</OutlinedButton>
    </div>
  )
}
