import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import Input from '@/components/input'
import Selection from '@/components/selection'
import { Paragraph, TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'

export default function SetPoolFees({ fees, setFees }) {
  const t = useTranslations()
  const poolRange = useMemo(
    () => [
      {
        label: '0,1%',
        active: fees === 0.1,
        onClickHandler: () => setFees(0.1),
      },
      {
        label: '0,3%',
        active: fees === 0.3,
        onClickHandler: () => setFees(0.3),
      },
      {
        label: '1,00%',
        active: fees === 1.0,
        onClickHandler: () => setFees(1.0),
      },
    ],
    [fees, setFees],
  )

  const isCustomFee = useMemo(() => fees !== null && fees !== 0.1 && fees !== 0.3 && fees !== 1, [fees])

  return (
    <div className='spy-4'>
      <TextHeading className='font-archia text-3xl font-semibold'>{t('Set Pool Fees')}</TextHeading>
      <div className='mt-4 flex flex-col gap-4'>
        <div className='flex flex-row items-center justify-between'>
          <Paragraph>{t('Fees')}</Paragraph>
          <Selection className='!h-11 bg-transparent' data={poolRange} isTranslation={false} />
        </div>
        <Input
          onChange={e => {
            setFees(e.target.value)
          }}
          className={cn('h-11 w-full', isCustomFee ? 'bg-neutral-700 font-medium text-neutral-200' : '')}
          placeholder='Set Custom Fee'
          suffix='%'
          classNames={{ input: 'pr-7' }}
        />
      </div>
    </div>
  )
}
