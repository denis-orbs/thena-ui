import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Box from '@/components/box'
import { TextHeading } from '@/components/typography'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { formatAmount } from '@/lib/utils'

export default function MaxInitialLiquidity({ tokensAndWeights }) {
  const t = useTranslations()
  const data = useMemo(
    () =>
      tokensAndWeights.map(item => ({
        address: item?.token?.address,
        symbol: item?.token?.symbol,
        price: item?.token?.price,
        pool: item?.weight,
        balance: item?.token?.balance || 0,
      })),
    [tokensAndWeights],
  )

  const { getValueTokenAmountToUSD } = useTokenUSDValue()

  const totalPrice = useMemo(
    () =>
      tokensAndWeights.reduce(
        (sum, item) => (getValueTokenAmountToUSD(item?.token?.address, item?.token?.balance) || 0) + sum,
        0,
      ),
    [getValueTokenAmountToUSD, tokensAndWeights],
  )

  // const totalPrice = data.reduce((sum, curr) => sum + curr.price, 0)
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
              <td className='px-6 py-4 whitespace-nowrap text-neutral-200'>{row.symbol}</td>
              <td className='px-6 py-4 text-right whitespace-nowrap text-neutral-200'>
                {formatAmount(getValueTokenAmountToUSD(row?.address, row?.balance))}
              </td>
              <td className='px-6 py-4 text-right whitespace-nowrap text-neutral-200'>{row.pool}</td>
            </tr>
          ))}
          <tr className='border-t border-t-neutral-700 font-semibold'>
            <td className='px-6 py-4 text-sm whitespace-nowrap text-neutral-200 xl:text-base'>{t('Total')}</td>
            <td className='px-6 py-4 text-right whitespace-nowrap text-neutral-200'>{formatAmount(totalPrice)}</td>
            <td className='px-6 py-4 text-right whitespace-nowrap text-neutral-200'>{totalPool}</td>
          </tr>
        </tbody>
      </table>
    </Box>
  )
}
