'use client'

import React, { useMemo, useState } from 'react'

import ChevronDownIcon from '@/icons/ChevronDownIcon'
import cn from '@/utils/classes'

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

  const handleCheckBox = item => {
    let temp = [...selected]
    const isChecked = temp.find(_item => _item === item.key)
    if (isChecked) {
      temp = selected.filter(ele => ele !== item.key)
      setSelected(temp)
    } else {
      temp.push(item.key)
      setSelected(temp)
    }
  }

  return (
    <div className={cn('relative w-full', className)}>
      <Input
        classNames={{
          input: cn('cursor-pointer caret-transparent w-full', className),
        }}
        type='text'
        val={selected.length ? `${selected.length} Selected` : ''}
        onClick={() => setOpen(!open)}
        placeholder='Select Pairs'
        TrailingIcon={<ChevronDownIcon isRevert={open} />}
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
            <div className='mb-4 flex justify-between px-6'>
              <span className='text-gray-400'>{selected.length} Selected</span>
              <span
                className='text-primary-400 cursor-pointer'
                onClick={() => {
                  if (selected.length > 0) {
                    setSelected([])
                  } else {
                    setSelected(data.map(_item => _item.key))
                  }
                }}
              >
                {selected.length > 0 ? 'Clear All' : 'Select All'}
              </span>
            </div>
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
