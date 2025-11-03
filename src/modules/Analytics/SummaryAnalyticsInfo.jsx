import { useTranslations } from 'next-intl'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'

import PercentBadge from '@/components/badges/PercentBadge'
import Box from '@/components/box'
import Skeleton from '@/components/skeleton'
import { Paragraph, TextHeading } from '@/components/typography'
import { cn, formatAmount } from '@/lib/utils'

function SummaryAnalyticsInfo({ totalStats }) {
  const t = useTranslations()
  return (
    <>
      <div
        className={cn(
          'px-8 py-4 outline-[#422D4C] lg:flex lg:justify-between lg:rounded-xl lg:outline',
          'lg:bg-chart-gradient item-center hidden gap-8',
        )}
      >
        <div className='bg-chart-gradient flex flex-col gap-3 rounded-xl py-4 outline-1 outline-[#422D4C] lg:bg-none lg:outline-0'>
          <div className='flex items-start justify-between gap-4'>
            {totalStats ? (
              <>
                <TextHeading className='text-gradient-pink font-archia text-3xl font-semibold'>
                  ${formatAmount(totalStats.tvlUSD)}
                </TextHeading>
                <PercentBadge
                  classNames={{ text: 'text-lg font-medium', icon: 'size-6' }}
                  value={totalStats.tvlChange}
                  isLarge
                />
              </>
            ) : (
              <>
                <Skeleton className='h-[32px] w-[160px]' />
                <Skeleton className='h-[24px] w-[80px]' />
              </>
            )}
          </div>
          <Paragraph className='text-sm! leading-5! text-neutral-500'>{t('TVL')}</Paragraph>
        </div>
        <div className='bg-chart-gradient flex flex-col gap-3 rounded-xl py-4 outline-1 outline-[#422D4C] lg:bg-none lg:outline-0'>
          <div className='flex items-start justify-between gap-4'>
            {totalStats ? (
              <>
                <TextHeading className='text-gradient-pink font-archia text-3xl font-semibold'>
                  ${formatAmount(totalStats.volumeUSD)}
                </TextHeading>
                <PercentBadge value={totalStats.volumeChange} isLarge />
              </>
            ) : (
              <>
                <Skeleton className='h-[32px] w-[160px]' />
                <Skeleton className='h-[24px] w-[80px]' />
              </>
            )}
          </div>
          <Paragraph className='text-sm! leading-5! text-neutral-500'>{t('Volume (24h)')}</Paragraph>
        </div>
        <div className='bg-chart-gradient flex flex-col gap-3 rounded-xl py-4 outline-1 outline-[#422D4C] lg:bg-none lg:outline-0'>
          <div className='flex items-start justify-between gap-4'>
            {totalStats ? (
              <>
                <TextHeading className='text-gradient-pink font-archia text-3xl font-semibold'>
                  ${formatAmount(totalStats.feesUSD)}
                </TextHeading>
                <PercentBadge value={totalStats.feesChange} isLarge />
              </>
            ) : (
              <>
                <Skeleton className='h-[32px] w-[160px]' />
                <Skeleton className='h-[24px] w-[80px]' />
              </>
            )}
          </div>
          <Paragraph className='text-sm! leading-5! text-neutral-500'>{t('Fees (24h)')}</Paragraph>
        </div>
      </div>
      <div className='w-full lg:hidden'>
        <Swiper slidesPerView={1.3} spaceBetween={8} grabCursor>
          <SwiperSlide>
            <Box className={cn('bg-chart-gradient! flex h-[84px] w-full flex-col border border-[#422D4C] p-4!')}>
              <div className='flex items-start justify-between gap-3'>
                {totalStats ? (
                  <>
                    <TextHeading className='text-gradient-pink text-lg'>${formatAmount(totalStats.tvlUSD)}</TextHeading>
                    <PercentBadge value={totalStats.tvlChange} isLarge />
                  </>
                ) : (
                  <>
                    <Skeleton className='h-7 w-[112px]' />
                    <Skeleton className='h-5 w-7' />
                  </>
                )}
              </div>
              <Paragraph className='text-sm! leading-5! text-neutral-500'>{t('TVL')}</Paragraph>
            </Box>
          </SwiperSlide>

          <SwiperSlide>
            <Box className={cn('bg-chart-gradient! flex h-[84px] w-full flex-col border border-[#422D4C] p-4!')}>
              <div className='flex items-start justify-between gap-3'>
                {totalStats ? (
                  <>
                    <TextHeading className='text-gradient-pink text-lg'>
                      ${formatAmount(totalStats.volumeUSD)}
                    </TextHeading>
                    <PercentBadge value={totalStats.volumeChange} isLarge />
                  </>
                ) : (
                  <>
                    <Skeleton className='h-7 w-[112px]' />
                    <Skeleton className='h-5 w-7' />
                  </>
                )}
              </div>
              <Paragraph className='text-sm! leading-5! text-neutral-500'>{t('Volume (24h)')}</Paragraph>
            </Box>
          </SwiperSlide>
          <SwiperSlide>
            <Box className={cn('bg-chart-gradient! flex h-[84px] w-full flex-col border border-[#422D4C] p-4!')}>
              <div className='flex items-start justify-between gap-3'>
                {totalStats ? (
                  <>
                    <TextHeading className='text-gradient-pink text-lg'>
                      ${formatAmount(totalStats.feesUSD)}
                    </TextHeading>
                    <PercentBadge value={totalStats.feesChange} isLarge />
                  </>
                ) : (
                  <>
                    <Skeleton className='h-7 w-[112px]' />
                    <Skeleton className='h-5 w-7' />
                  </>
                )}
              </div>
              <Paragraph className='text-sm! leading-5! text-neutral-500'>{t('Fees (24h)')}</Paragraph>
            </Box>
          </SwiperSlide>
        </Swiper>
      </div>
    </>
  )
}

export default SummaryAnalyticsInfo
