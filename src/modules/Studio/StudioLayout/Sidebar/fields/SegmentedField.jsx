'use client'

import { useTranslations } from 'next-intl'

import { EmphasisButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'

export default function SegmentedField({ label, options = [], value, onChange }) {
  const t = useTranslations()
  return (
    <div className='flex flex-col gap-2'>
      <TextHeading>{t(label)}</TextHeading>
      <div className='flex gap-0.5 rounded-lg bg-neutral-800 p-1'>
        {options.map(opt => (
          <EmphasisButton
            key={opt.replace(' ', '_')}
            className={cn('h-7.5 flex-1 text-nowrap', opt !== value && 'bg-transparent')}
            onClick={() => onChange?.(opt)}
          >
            {opt}
          </EmphasisButton>
        ))}
      </div>
    </div>
  )
}
