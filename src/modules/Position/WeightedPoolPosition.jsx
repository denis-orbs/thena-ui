import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import RemoveWeightedModal from '@/app/pools/RemoveWeightedModal'
import { EmphasisButton, OutlinedButton, TextButton } from '@/components/buttons/Button'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import { UNKNOWN_LOGO } from '@/constant'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { formatAmount } from '@/lib/utils'

export function WeightedPoolPosition({ pool }) {
  const t = useTranslations()

  const [isOpenRemove, setIsOpenRemove] = useState(false)

  const { getValueTokenAmountToUSD } = useTokenUSDValue()

  const depositValueInUsd = useMemo(
    () => (pool.tokens || []).reduce((sum, token) => sum + getValueTokenAmountToUSD(token?.address, token?.reserve), 0),
    [getValueTokenAmountToUSD, pool.tokens],
  )

  return (
    <div className='rounded-xl bg-neutral-900 p-4'>
      <div className='flex space-x-4'>
        <ThreeIconGroup
          classNames={{
            image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
          }}
          logo1={pool?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
          logo2={pool?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
          extendNumber={(pool?.tokens?.length || 2) - 2}
        />
        <div className='flex items-center gap-2 lg:max-w-[90%]'>
          <div className='flex w-full flex-wrap items-center gap-1 '>
            {(pool?.tokens || []).map(token => (
              <div className='flex items-center gap-1' key={token?.address}>
                <span className='text-[16px] font-medium leading-5'>{token?.symbol}</span>
                <span className='text-sm font-medium leading-5 text-neutral-300 '>{token?.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className='mt-4 flex flex-col gap-y-4'>
        <div className='flex justify-between'>
          <span className='text-neutral-300'>{t('APR')}</span>
          {/* TODO: mock value */}
          <span>0%</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-neutral-300'>{t('Deposit Value in USD')}</span>
          <span>${formatAmount(depositValueInUsd)}</span>
        </div>
        {(pool.tokens || []).map((token, index) => (
          <div className='flex justify-between' key={index}>
            <span className='text-neutral-300'>
              {token.symbol} {t('Deposit')}
            </span>
            <span>
              <span>{formatAmount(token?.reserve)}</span>
              <span className='text-neutral-300'>({token?.weight}%)</span>
            </span>
          </div>
        ))}
        <div className='flex justify-between'>
          <span className='text-neutral-300'>{t('Claimable Fees')}</span>
          {/* TODO: mock value */}
          <span>$0</span>
        </div>
      </div>

      <div className='mt-4 flex w-full gap-3'>
        <TextButton className='w-full' disabled>
          {t('Claim')}
        </TextButton>
        <OutlinedButton onClick={() => setIsOpenRemove(true)} className='w-full'>
          {t('Remove')}
        </OutlinedButton>

        <EmphasisButton className='w-full'>{t('Add')}</EmphasisButton>
      </div>
      <RemoveWeightedModal isOpen={isOpenRemove} pool={pool} setIsOpen={setIsOpenRemove} />
    </div>
  )
}
