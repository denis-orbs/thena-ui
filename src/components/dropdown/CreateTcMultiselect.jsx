'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@/svgs'

import CheckBox from '../checkbox'
import Input from '../input'

function CreateTcMultiSelect({ className, data, selected, setSelected, placeHolder }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  const handleCheckBox = item => {
    const temp = [...selected]
    if (temp.find(_item => _item === item.key) !== undefined) {
      if (item.key !== 0) {
        setSelected(temp.filter(_item => _item !== item.key && _item !== 0))
      } else {
        setSelected([])
      }
    } else if (item.key !== 0) {
      temp.push(item.key)
      if (temp.length === data.length - 1) {
        setSelected(data.map(_item => _item.key))
      } else {
        setSelected([...temp])
      }
    } else {
      setSelected(data.map(_item => _item.key))
    }
  }

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

  const textInput = useMemo(() => {
    if (selected.find(item => item === 0) !== undefined) {
      return 'ALL'
    }
    return data
      .filter(item => selected.includes(item.key))
      .map(item => item.label)
      .join(', ')
  }, [data, selected])

  return (
    <div className={cn('relative w-full', className)} ref={wrapperRef}>
      <Input
        classNames={{
          input: cn('cursor-pointer caret-transparent w-full', className),
        }}
        type='text'
        val={textInput}
        onClick={() => setOpen(!open)}
        placeholder={placeHolder}
        TrailingIcon={
          <ChevronDownIcon
            className={cn('transfrom transition-all duration-150 ease-out', open ? 'rotate-180' : 'rotate-0')}
          />
        }
        readOnly
      />
      <div
        className={cn(
          'visible absolute z-10 mt-2 max-h-[280px] w-full flex-col items-start justify-start gap-1 overflow-auto',
          'rounded-xl border border-neutral-600 bg-neutral-800 p-2 opacity-100 shadow',
          'transition-all duration-150 ease-out',
          !open && 'invisible opacity-0',
          className,
        )}
      >
        {data.map((item, idx) => (
          <div
            className={cn(
              'flex w-full cursor-pointer items-center gap-3',
              'rounded-md p-3 text-neutral-300 transition-all duration-150 ease-out hover:bg-neutral-700 hover:text-neutral-50',
            )}
            key={`dropdown-${idx}`}
            onClick={() => {
              handleCheckBox(item)
            }}
          >
            <CheckBox checked={selected.find(_item => _item === item.key) !== undefined} />
            <p>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CreateTcMultiSelect
