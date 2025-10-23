import { useTranslations } from 'next-intl'

import RadioInput from '@/components/radioInput'

function RadioGroupField({ options = [], value, onChange }) {
  const t = useTranslations()

  return (
    <div className='flex gap-9'>
      {options.map(opt => {
        const checked = value === opt
        const id = `radio-${opt}`

        return (
          <RadioInput
            value={opt}
            name={opt}
            key={opt}
            id={id}
            checked={checked}
            className='size-5'
            onChange={() => onChange(opt)}
            label={t(opt)}
          />
        )
      })}
    </div>
  )
}

export default RadioGroupField
