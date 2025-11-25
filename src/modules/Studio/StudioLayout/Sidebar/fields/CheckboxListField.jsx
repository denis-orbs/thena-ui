import { useTranslations } from 'next-intl'

import Toggle from '@/components/toggle'
import { Paragraph, TextHeading } from '@/components/typography'

function CheckboxListField({ label, value = [], onChange, options = [] }) {
  const t = useTranslations()

  const toggleValue = opt => {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt))
    } else {
      onChange([...value, opt])
    }
  }

  return (
    <div className='space-y-3'>
      {label && <TextHeading className='block text-base leading-7 font-medium'>{t(label)}</TextHeading>}

      <div className='flex flex-col gap-5'>
        {options.map(opt => {
          const checked = value.includes(opt)
          const id = `chk-${opt}`

          return (
            <div className='flex items-center gap-2.5' key={opt}>
              <Toggle id={id} checked={checked} onChange={() => toggleValue(opt)} />
              <label htmlFor={id}>
                <Paragraph className='text-base leading-5 font-normal'>{t(opt)}</Paragraph>
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CheckboxListField
