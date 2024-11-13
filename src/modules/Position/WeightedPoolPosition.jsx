import { useTranslations } from 'next-intl'

import { mockTokens } from '@/app/pools/[address]/page'
import { EmphasisButton, OutlinedButton, TextButton } from '@/components/buttons/Button'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'

export function WeightedPoolPosition({ pool }) {
  const t = useTranslations()
  return (
    <div className='rounded-xl bg-neutral-900 p-4'>
      <div className='flex space-x-4'>
        <ThreeIconGroup
          classNames={{
            image: 'w-[20px] lg:w-[32px] h-[20px] lg:h-[32px] outline-2 text-xl font-medium leading-5 text-[#1C2027]',
          }}
          className='-space-x-2'
          logo1={pool?.token0?.logoURI ?? mockTokens[0].logoURI}
          logo2={pool?.token1?.logoURI ?? mockTokens[1].logoURI}
          extendNumber={6}
        />
        <div className='flex items-center gap-2 lg:max-w-[90%]'>
          <div className='flex w-full flex-wrap items-center gap-1 '>
            {mockTokens.map((token, index) => (
              <div className='flex items-center gap-1' key={index}>
                <span className='text-[16px] font-medium leading-5'>{token.symbol}</span>
                <span className='text-sm font-medium leading-5 text-neutral-300 '>12.5%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className='mt-4 flex flex-col gap-y-4'>
        <div className='flex justify-between'>
          <span className='text-neutral-300'>{t('APR')}</span>
          <span>20%</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-neutral-300'>{t('Deposit Value in USD')}</span>
          <span>$12,123.45</span>
        </div>
        {mockTokens.map((token, index) => (
          <div className='flex justify-between' key={index}>
            <span className='text-neutral-300'>
              {token.symbol} {t('Deposit')}
            </span>
            <span>
              <span>999</span>
              <span className='text-neutral-300'>(12%)</span>
            </span>
          </div>
        ))}
        <div className='flex justify-between'>
          <span className='text-neutral-300'>{t('Claimable Fees')}</span>
          <span>$291</span>
        </div>
      </div>

      <div className='mt-4 flex w-full gap-3'>
        <TextButton className='w-full' disabled>
          {t('Claim')}
        </TextButton>
        <OutlinedButton className='w-full'>{t('Remove')}</OutlinedButton>

        <EmphasisButton className='w-full'>{t('Add')}</EmphasisButton>
      </div>
    </div>
  )
}
