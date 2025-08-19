import { useTranslations } from 'next-intl'

import Divider from '@/components/divider'
import { NewTextSubHeading, Paragraph } from '@/components/typography'
import { cn, formatAmount, unwrappedSymbol } from '@/lib/utils'

export function PoolReserveSection({ pool, className, showMyInfo = true }) {
  const t = useTranslations()

  return (
    <div className={cn('flex flex-col gap-4 rounded-md bg-neutral-900 p-4', className)}>
      <div className='flex flex-col gap-2 lg:gap-4'>
        <NewTextSubHeading className='text-xl!'>{t('Reserve Info')}</NewTextSubHeading>
        <div className='flex flex-col gap-2 text-base lg:gap-3'>
          <div className='flex items-center justify-between'>
            <Paragraph className='font-medium'>
              {unwrappedSymbol(pool.token0)} {t('Amount')}
            </Paragraph>
            <Paragraph>{formatAmount(pool.token0.reserve)}</Paragraph>
          </div>
          <div className='flex items-center justify-between'>
            <Paragraph className='font-medium'>
              {unwrappedSymbol(pool.token1)} {t('Amount')}
            </Paragraph>
            <Paragraph>{formatAmount(pool.token1.reserve)}</Paragraph>
          </div>
        </div>
      </div>

      {showMyInfo && (
        <>
          <Divider className='my-4' />

          <div className='flex flex-col gap-2 lg:gap-4'>
            <NewTextSubHeading className='text-xl!'>{t('My Info')}</NewTextSubHeading>
            <div className='flex flex-col gap-2 text-base lg:gap-3'>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>{t('Pooled Liquidity')}</Paragraph>
                <Paragraph>{formatAmount(pool.account.totalLp)} LP</Paragraph>
              </div>
              <div className='flex items-center justify-between'>
                <Paragraph className='font-medium'>{t('Staked Liquidity')}</Paragraph>
                <Paragraph>{formatAmount(pool.account.gaugeBalance)} LP</Paragraph>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
