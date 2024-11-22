import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Box from '@/components/box'
import { TextHeading } from '@/components/typography'
import { formatAmount } from '@/lib/utils'

export default function MaxInitialLiquidity({ tokensAndWeights }) {
  const t = useTranslations()
  const data = useMemo(
    () =>
      tokensAndWeights.map(item => ({
        symbol: item?.token?.symbol,
        price: item?.token?.price,
        pool: item?.weight,
      })),
    [tokensAndWeights],
  )
  const totalPrice = data.reduce((sum, curr) => sum + curr.price, 0)
  const totalPool = data.reduce((sum, curr) => sum + curr.pool, 0)
  return (
    <Box>
      <TextHeading className='font-archia text-xl font-semibold xl:text-2xl'>
        {t('Your Max Initial Liquidity')}
      </TextHeading>
      <table className='min-w-full rounded-lg'>
        <thead>
          <tr>
            <th className='px-6 py-3 text-left text-sm text-neutral-400 xl:text-base'>{t('Token')}</th>
            <th className='px-6 py-3 text-right text-sm text-neutral-400 xl:text-base'>{t('USD Value')}</th>
            <th className='px-6 py-3 text-right text-sm text-neutral-400 xl:text-base'>{t('Pool')} %</th>
          </tr>
        </thead>
        <tbody className='text-gray-700'>
          {data.map((row, index) => (
            <tr key={index}>
              <td className='whitespace-nowrap px-6 py-4 text-neutral-200'>{row.symbol}</td>
              <td className='whitespace-nowrap px-6 py-4 text-right text-neutral-200'>{formatAmount(row.price)}</td>
              <td className='whitespace-nowrap px-6 py-4 text-right text-neutral-200'>{row.pool}</td>
            </tr>
          ))}
          <tr className='border-t border-t-neutral-700 font-semibold'>
            <td className='whitespace-nowrap px-6 py-4 text-sm text-neutral-200 xl:text-base'>{t('Total')}</td>
            <td className='whitespace-nowrap px-6 py-4 text-right text-neutral-200'>{formatAmount(totalPrice)}</td>
            <td className='whitespace-nowrap px-6 py-4 text-right text-neutral-200'>{totalPool}</td>
          </tr>
        </tbody>
      </table>
    </Box>
  )
}
