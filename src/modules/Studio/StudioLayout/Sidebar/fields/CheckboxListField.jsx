import { useTranslations } from 'next-intl'

import CheckBox from '@/components/checkbox'
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

      <div className='flex flex-col gap-5.5'>
        {options.map(opt => {
          const checked = value.includes(opt)
          const id = `chk-${opt}`

          return (
            <div className='flex items-center gap-3' key={opt}>
              <CheckBox id={id} checked={checked} setChecked={() => toggleValue(opt)} />
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
