import { useTranslations } from 'next-intl'

import { TextHeading } from '@/components/typography'
import { GaugeItemManual } from '@/modules/Pools/Migration'
import { ArrowRightIcon } from '@/svgs'

export function GaugeManualMigrate({ positionV2 }) {
  const t = useTranslations()

  return (
    <div className='mt-4 grid items-stretch gap-4 lg:grid-cols-[48%_2%_48%]'>
      <article className='flex h-full w-full flex-col'>
        <TextHeading className='mb-2 text-lg'>{t('Your Current Gauge')}</TextHeading>
        <GaugeItemManual pool={positionV2} />
      </article>

      <span className='flex items-center justify-center'>
        <ArrowRightIcon className='mx-auto h-5 w-5 max-lg:rotate-90' />
      </span>

      <article className='flex h-full w-full flex-col'>
        <TextHeading className='mb-2'>{t('Your New V3 Gauge')}</TextHeading>
        <GaugeItemManual showAdjustButton pool={positionV2} />
      </article>
    </div>
  )
}
