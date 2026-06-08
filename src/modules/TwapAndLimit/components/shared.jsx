/* THENA Dev */
/* eslint-disable simple-import-sort/imports */
import { useTranslations } from 'next-intl'

import Dropdown from '@/components/dropdown'
import LabelTooltip from '@/components/label/LabelTooltip'
import cn from '@/utils/classes'

import { formatDecimals } from '../utils'

export function SelectMenu({ items, selected, onSelect, className }) {
  return (
    <Dropdown
      className={cn('twap-select-menu', className)}
      listClassNames='twap-select-menu-portal'
      data={items.map(item => ({
        label: item.text,
        value: item.value,
        text: item.text,
      }))}
      selected={selected?.text || ''}
      setSelected={onSelect}
      placeHolder=''
    />
  )
}

export function InputContainer({ children, error, className }) {
  return (
    <div
      className={cn(
        'twap-input-container flex items-center justify-between gap-2 rounded-lg border border-transparent bg-neutral-600 px-3 py-2',
        error && 'border-error-600',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Label({ tooltip, text }) {
  return (
    <LabelTooltip
      tooltip={tooltip}
      label={text}
      id={text}
      showInfoIcon
      className='text-[14px] font-medium'
      translate={false}
    />
  )
}

export function DefaultButton({ onClick, className }) {
  const t = useTranslations()
  return (
    <div className={cn('text-primary-600 ml-auto w-fit cursor-pointer text-sm', className)} onClick={onClick}>
      {t('setToDefault')}
    </div>
  )
}

export function Input({ onChange, value, max, placeholder = '0.0', className }) {
  return (
    <input
      type='number'
      className={cn(
        'w-full border-1 border-transparent bg-transparent p-0 text-lg text-neutral-50 placeholder-neutral-400',
        className,
      )}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      max={max}
      min={0}
      inputMode='decimal'
    />
  )
}

export function PercentageInput({ onChange, value, className }) {
  return <Input value={value} onChange={onChange} max={100} className={`${className} text-[20px]`} />
}

export function PriceContainer({ error, symbol, onChange, price, usd, className }) {
  return (
    <InputContainer error={Boolean(error)} className={cn('flex-1', className)}>
      <p className='text-[16px] font-bold'>{symbol}</p>
      <div className='flex flex-1 flex-col items-end gap-0'>
        <Input onChange={onChange} value={price} className='w-full text-right text-[19px]' error={Boolean(error)} />
        <p className='text-[11px] opacity-50'>{usd ? `$${formatDecimals(usd, 2)}` : '-'}</p>
      </div>
    </InputContainer>
  )
}

export function PercentageContainer({ error, onChange, value, className }) {
  return (
    <InputContainer error={Boolean(error)} className={cn('w-[100px] gap-0', className)}>
      <PercentageInput onChange={onChange} value={value} className='flex-1 text-center' />
      <p className='text-[18px]'>%</p>
    </InputContainer>
  )
}
