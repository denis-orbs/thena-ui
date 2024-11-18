import { useTranslations } from 'next-intl'
import React from 'react'

import TokenBadge from '@/components/badges/TokenBadge'
import Skeleton from '@/components/skeleton'
import { TextSubHeading } from '@/components/typography'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { formatAmount } from '@/lib/utils'

export default function InputLiquidityToken({ asset, allocate, amount, setTokenAndWeights }) {
  const t = useTranslations()
  const { getValueTokenAmountToUSD } = useTokenUSDValue()
  const setAmount = value => {
    setTokenAndWeights(prev => {
      const updatedTokens = [...prev]
      const index = updatedTokens.findIndex(item => item.token.address === asset.address)
      updatedTokens[index] = {
        ...updatedTokens[index],
        amount: value,
      }
      return updatedTokens
    })
  }

  return (
    <div className='flex flex-col gap-3 self-stretch rounded-xl border border-neutral-700 p-4'>
      <div className='flex flex-row items-center justify-between gap-2'>
        {asset ? (
          <TokenBadge showChevronDownIcon={false} asset={asset} prefix={allocate} />
        ) : (
          <Skeleton className='h-[36px] w-[100px]' />
        )}
        <input
          type='number'
          className='w-full border-0 bg-transparent p-0 text-right text-xl text-neutral-50 placeholder-neutral-400'
          placeholder='0.0'
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min={0}
        />
      </div>
      <div className='flex items-center justify-between gap-2'>
        <TextSubHeading>
          {t('Balance')}: {formatAmount(asset?.balance)}
        </TextSubHeading>
        <TextSubHeading>${formatAmount(getValueTokenAmountToUSD(asset.address, amount))}</TextSubHeading>
      </div>
    </div>
  )
}
