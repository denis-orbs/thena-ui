import React, { useEffect, useMemo, useRef, useState } from 'react'

import Input from '@/components/input'
import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@/svgs'

import { Countries } from './Country'

export default function SelectCountry({ className, selected = '', setSelected }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const displaySelectedCountry = useMemo(() => {
    const selectedCountry = Countries.find(country => country.isoCode === selected)
    return selectedCountry ? `${selectedCountry?.emoji} ${selectedCountry?.name}` : ''
  }, [selected])

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [wrapperRef])

  return (
    <div className={cn('relative', className)} ref={wrapperRef}>
      <Input
        classNames={{
          input: cn('cursor-pointer caret-transparent', className),
        }}
        type='text'
        val={displaySelectedCountry}
        onClick={() => setOpen(!open)}
        placeholder='Choose'
        TrailingIcon={
          <ChevronDownIcon
            className={cn('transfrom transition-all duration-150 ease-out', open ? 'rotate-180' : 'rotate-0')}
          />
        }
        readOnly
      />
      <div
        className={cn(
          'visible absolute z-10 mt-2 flex-col items-start justify-start gap-1',
          'rounded-xl border border-neutral-600 bg-neutral-800 p-2 opacity-100 shadow',
          'h-[300px] overflow-x-auto transition-all duration-150 ease-out',
          !open && 'invisible opacity-0',
          className,
        )}
      >
        {Countries.map((item, idx) => (
          <div
            className={cn(
              'inline-flex w-full cursor-pointer flex-col items-start justify-center gap-1',
              'rounded-md p-3 text-neutral-300 transition-all duration-150 ease-out hover:bg-neutral-700 hover:text-neutral-50',
            )}
            key={`dropdown-${idx}`}
            onClick={() => {
              setSelected(item.isoCode)
              setOpen(false)
            }}
          >
            <p>
              <span className='pr-1'>{item.emoji}</span>
              {item.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
