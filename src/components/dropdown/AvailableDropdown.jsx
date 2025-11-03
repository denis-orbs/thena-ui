'use client'

import React, { useEffect, useRef, useState } from 'react'

import ChevronDownIcon from '@/icons/ChevronDownIcon'
import { cn } from '@/lib/utils'

import Input from '../input'

function AvailableDropdown({ className, listClassNames, data, selected, setSelected, placeHolder }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const [valueInputSelect, setValueInputSelect] = useState('')
  const [dataSelect, setDataSelect] = useState([])

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
        if (selected) {
          setValueInputSelect(selected.label)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selected, wrapperRef])

  useEffect(() => {
    setValueInputSelect(selected.label)
  }, [selected])

  useEffect(() => {
    let arr = [...data]
    if (valueInputSelect) {
      const index = arr.findIndex(item => String(item.label).toLowerCase() === valueInputSelect.toLowerCase())
      if (index === -1) {
        arr = arr.filter(item => String(item.label).toLowerCase().includes(valueInputSelect.toLowerCase()))
      }
    }
    setDataSelect(arr)
  }, [data, valueInputSelect])

  return (
    <div className={cn('relative', className)} ref={wrapperRef}>
      <Input
        classNames={{
          input: cn('cursor-pointer', className),
        }}
        type='text'
        val={valueInputSelect}
        readOnly
        onClick={() => setOpen(!open)}
        placeholder={placeHolder}
        TrailingIcon={<ChevronDownIcon isRevert={open} onClick={() => setOpen(!open)} />}
      />
      <div
        className={cn(
          'visible absolute z-10 mt-2 flex-col items-start justify-start gap-1',
          'rounded-xl border border-neutral-600 bg-neutral-800 p-2 opacity-100 shadow-xs',
          'left-0, right-0 w-full overflow-y-auto transition-all duration-150 ease-out',
          !open && 'invisible opacity-0',
          listClassNames,
        )}
      >
        {dataSelect.length ? (
          dataSelect.map((item, idx) => (
            <div
              className={cn(
                'inline-flex w-full cursor-pointer flex-col items-start justify-center gap-1',
                'rounded-md p-3 text-neutral-300 transition-all duration-150 ease-out hover:bg-neutral-700 hover:text-neutral-50',
                selected.value === item.value ? 'bg-neutral-700 text-neutral-50' : '',
              )}
              key={`dropdown-${idx}`}
              onClick={() => {
                setSelected(item)
                setOpen(false)
              }}
            >
              <p>{item.label}</p>
            </div>
          ))
        ) : (
          <div className={cn('w-full', 'rounded-md p-3 text-neutral-300 transition-all duration-150 ease-out')}>
            <p>Empty</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AvailableDropdown
