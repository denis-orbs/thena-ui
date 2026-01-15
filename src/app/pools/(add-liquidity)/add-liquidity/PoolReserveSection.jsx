import { useTranslations } from 'next-intl'

import { NewTextSubHeading, Paragraph } from '@/components/typography'
import cn from '@/utils/classes'
import { formatAmount, unwrappedSymbol } from '@/utils/utils'

export function PoolReserveSection({ pool, className, showMyInfo = true }) {
  const t = useTranslations()

  return (
    <div className={cn('flex flex-col gap-4 rounded-md bg-neutral-900 p-4', className)}>
      <div className='flex flex-col gap-2 lg:gap-4'>
        <NewTextSubHeading className='text-[18px]! leading-7! text-neutral-50'>{t('Reserve Info')}</NewTextSubHeading>
        <div className='flex flex-col gap-2 text-base lg:gap-3'>
          <div className='flex items-center justify-between'>
            <Paragraph className='text-base leading-5! font-normal text-neutral-300'>
              {unwrappedSymbol(pool?.token0)} {t('Amount')}
            </Paragraph>
            <Paragraph className='text-base leading-5! font-normal text-neutral-300'>
              {formatAmount(pool?.token0?.reserve)}
            </Paragraph>
          </div>
          <div className='flex items-center justify-between'>
            <Paragraph className='text-base leading-5! font-normal text-neutral-300'>
              {unwrappedSymbol(pool?.token1)} {t('Amount')}
            </Paragraph>
            <Paragraph className='text-base leading-5! font-normal text-neutral-300'>
              {formatAmount(pool?.token1?.reserve)}
            </Paragraph>
          </div>
        </div>
      </div>

      {showMyInfo && (
        <>
          <div className='mt-4 flex flex-col gap-2 pt-4 shadow-[0_-1px_0_0_theme(colors.neutral.600)] lg:gap-4'>
            <NewTextSubHeading className='text-xl! leading-7!'>{t('My Info')}</NewTextSubHeading>
            <div className='flex flex-col gap-2 text-base lg:gap-3'>
              <div className='flex items-center justify-between'>
                <Paragraph className='leading-5! font-medium'>{t('Pooled Liquidity')}</Paragraph>
                <Paragraph className='leading-5!'>{formatAmount(pool.account.totalLp)} LP</Paragraph>
              </div>
              <div className='flex items-center justify-between'>
                <Paragraph className='leading-5! font-medium'>{t('Staked Liquidity')}</Paragraph>
                <Paragraph className='leading-5!'>{formatAmount(pool.account.gaugeBalance)} LP</Paragraph>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
