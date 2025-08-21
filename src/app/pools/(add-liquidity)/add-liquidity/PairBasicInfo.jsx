import { useTranslations } from 'next-intl'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'

import Box from '@/components/box'
import { NewTextSubHeading, Paragraph } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn, formatAmount } from '@/lib/utils'

export function PairBasicInfo({ pair, className, classNames, etApr = true, useSolidBg = false }) {
  const t = useTranslations()
  const { isMdDown } = useMediaQuery()
  // const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={cn('flex justify-between gap-2 rounded-xl', className)}>
      {/* Desktop view - single box with all items */}
      <div
        className={cn(
          'w-full items-center justify-between gap-x-4 rounded-lg bg-transparent p-4! outline-1 outline-neutral-600 max-md:hidden md:flex',
          !isMdDown && 'gap-y-4',
          classNames?.box,
        )}
        style={
          useSolidBg
            ? {}
            : {
                background: `linear-gradient(87.54deg, #0D090F 19.75%, #422D4C 240.97%),
                 linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2))`,
              }
        }
      >
        {etApr && (
          <div className={cn('flex flex-col gap-2 md:gap-1', classNames?.container)}>
            <NewTextSubHeading
              className={cn('text-gradient-primary text-lg! leading-9! xl:text-3xl!', classNames?.title)}
            >
              {pair?.apr ?? '0%'}
            </NewTextSubHeading>
            <Paragraph className={cn('text-sm! leading-5! text-neutral-500', classNames?.subtitle)}>
              {pair?.type === PAIR_TYPES.LSD ? t('Estimated APR Range') : t('Estimated APR')}
            </Paragraph>
          </div>
        )}
        <div className={cn('flex flex-col gap-2 md:gap-1', classNames?.container)}>
          <NewTextSubHeading
            className={cn('text-gradient-primary text-lg! leading-9! xl:text-3xl!', classNames?.title)}
          >
            ${formatAmount(pair?.dayVolume)}
          </NewTextSubHeading>
          <Paragraph className={cn('text-sm! leading-5! text-neutral-500', classNames?.subtitle)}>
            {t('Volume (24h)')}
          </Paragraph>
        </div>

        <div className={cn('flex flex-col gap-2 md:gap-1', classNames?.container)}>
          <NewTextSubHeading
            className={cn('text-gradient-primary text-lg! leading-9! xl:text-3xl!', classNames?.title)}
          >
            ${formatAmount(pair?.dayFees)}
          </NewTextSubHeading>
          <Paragraph className={cn('text-sm! leading-5! text-neutral-500', classNames?.subtitle)}>
            {t('Fees (24h)')}
          </Paragraph>
        </div>

        <div className={cn('flex flex-col gap-2 md:gap-1', classNames?.container)}>
          <NewTextSubHeading
            className={cn('text-gradient-primary text-lg! leading-9! xl:text-3xl!', classNames?.title)}
          >
            ${formatAmount(pair?.tvlUSD)}
          </NewTextSubHeading>
          <Paragraph className={cn('text-sm! leading-5! text-neutral-500', classNames?.subtitle)}>{t('TVL')}</Paragraph>
        </div>
      </div>

      {/* Mobile view - Swiper carousel */}
      <div className='my-auto w-full md:hidden'>
        <Swiper slidesPerView={1.1} spaceBetween={8} grabCursor>
          <SwiperSlide>
            <Box
              className={cn(
                'flex h-[84px] w-full items-center justify-between gap-x-4 border border-neutral-600 bg-transparent p-4!',
              )}
              style={{
                background: `linear-gradient(87.54deg, #0D090F 19.75%, #422D4C 240.97%),
                 linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2))`,
              }}
            >
              <div className='flex flex-col gap-2'>
                <NewTextSubHeading className='text-gradient-primary text-lg!'>{pair?.apr ?? '0%'}</NewTextSubHeading>
                <Paragraph className='text-sm! text-nowrap text-neutral-500'>
                  {pair?.type === PAIR_TYPES.LSD ? t('Estimated APR Range') : t('Estimated APR')}
                </Paragraph>
              </div>
              <div className='flex flex-col gap-2'>
                <NewTextSubHeading className='text-gradient-primary text-lg!'>
                  ${formatAmount(pair?.dayVolume)}
                </NewTextSubHeading>
                <Paragraph className='text-sm! leading-5! text-neutral-500'>{t('Volume (24h)')}</Paragraph>
              </div>
            </Box>
          </SwiperSlide>

          <SwiperSlide>
            <Box
              className={cn(
                'flex h-[84px] w-full items-center justify-between gap-x-4 border border-neutral-600 bg-transparent p-4!',
              )}
              style={{
                background: `linear-gradient(87.54deg, #0D090F 19.75%, #422D4C 240.97%),
                 linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2))`,
              }}
            >
              <div className='flex flex-col gap-2'>
                <NewTextSubHeading className='text-gradient-primary text-lg!'>
                  ${formatAmount(pair?.dayFees)}
                </NewTextSubHeading>
                <Paragraph className='text-sm! leading-5! text-neutral-500'>{t('Fees (24h)')}</Paragraph>
              </div>

              <div className='flex flex-col gap-2'>
                <NewTextSubHeading className='text-gradient-primary text-lg!'>
                  ${formatAmount(pair?.tvlUSD)}
                </NewTextSubHeading>
                <Paragraph className='text-sm! leading-5! text-neutral-500'>{t('TVL')}</Paragraph>
              </div>
            </Box>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  )
}
