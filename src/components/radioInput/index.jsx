import { useTranslations } from 'next-intl'

import cn from '@/utils/classes'

function RadioInput({ name, value, onChange, label, checked = false, className }) {
  const t = useTranslations()

  return (
    <label className='flex cursor-pointer items-center gap-3'>
      <input
        type='radio'
        name={name}
        value={value}
        onChange={onChange}
        checked={Boolean(checked)}
        className={cn(
          'checked:bg-primary-600 h-4 w-4 rounded-full border border-neutral-600 bg-transparent focus:ring-0 focus:outline-none',
          className,
        )}
      />
      {label && <span className='text-sm text-nowrap text-neutral-400'>{t(label)}</span>}
    </label>
  )
}

export default RadioInput
