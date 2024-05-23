'use client'

import React, { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@/svgs'

import CheckBox from '../checkbox'
import Input from '../input'
import SearchInput from '../input/SearchInput'
import Modal, { ModalBody } from '../modal'

function CreateTcMultiSelect({ className, data, selected, setSelected }) {
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const filterData = useMemo(() => {
    let arr = [...data]
    if (searchText.trim()) {
      arr = arr.filter(item => item.label.toLowerCase().includes(searchText.trim().toLowerCase()))
    }
    return arr
  }, [data, searchText])

  const textInput = useMemo(() => {
    if (selected.find(item => item === 0) !== undefined) {
      return 'ALL'
    }
    return data
      .filter(item => selected.includes(item.key))
      .map(item => item.label)
      .join(', ')
  }, [data, selected])

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

  return (
    <div className={cn('relative w-full', className)}>
      <Input
        classNames={{
          input: cn('cursor-pointer caret-transparent w-full', className),
        }}
        type='text'
        val={textInput}
        onClick={() => setOpen(!open)}
        placeholder='Select Pairs'
        TrailingIcon={
          <ChevronDownIcon
            className={cn('transfrom transition-all duration-150 ease-out', open ? 'rotate-180' : 'rotate-0')}
          />
        }
        readOnly
      />
      <Modal
        isOpen={open}
        closeModal={() => {
          setOpen(false)
          setSearchText('')
        }}
        width={480}
        title='Select Pairs'
      >
        <ModalBody>
          <div>
            <SearchInput className='w-full' val={searchText} setVal={setSearchText} placeholder='Search' autoFocus />
            <div className='my-6 h-px w-full border border-neutral-700' />
            <div className='max-h-[400px] overflow-y-auto'>
              {filterData.map((item, idx) => (
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
        </ModalBody>
      </Modal>
    </div>
  )
}

export default CreateTcMultiSelect
