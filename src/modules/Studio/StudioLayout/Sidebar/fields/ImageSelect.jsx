import Image from 'next/image'
import React, { useState } from 'react'

import { EmphasisButton, TextButton } from '@/components/buttons/Button'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@/svgs'

function ImageSelect({ options, selectedOption, setSelectedOption }) {
  const [isOpen, setIsOpen] = useState(false)
  const { isLgDown } = useMediaQuery()

  const handleSelect = option => {
    setSelectedOption(option)
    setIsOpen(false)
  }

  return (
    <div className='relative lg:w-65'>
      {/* Select Button */}
      {isLgDown ? (
        <TextButton className='size-11 p-0!' onClick={() => setIsOpen(!isOpen)}>
          <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
              d='M13.5 17.5H5.77614C5.2713 17.5 5.01887 17.5 4.90199 17.4002C4.80056 17.3135 4.74674 17.1836 4.75721 17.0506C4.76927 16.8974 4.94776 16.7189 5.30474 16.3619L12.3905 9.27614C12.7205 8.94613 12.8855 8.78112 13.0758 8.7193C13.2432 8.66492 13.4235 8.66492 13.5908 8.7193C13.7811 8.78112 13.9461 8.94613 14.2761 9.27614L17.5 12.5V13.5M13.5 17.5C14.9001 17.5 15.6002 17.5 16.135 17.2275C16.6054 16.9878 16.9878 16.6054 17.2275 16.135C17.5 15.6002 17.5 14.9001 17.5 13.5M13.5 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V6.5C2.5 5.09987 2.5 4.3998 2.77248 3.86502C3.01217 3.39462 3.39462 3.01217 3.86502 2.77248C4.3998 2.5 5.09987 2.5 6.5 2.5H13.5C14.9001 2.5 15.6002 2.5 16.135 2.77248C16.6054 3.01217 16.9878 3.39462 17.2275 3.86502C17.5 4.3998 17.5 5.09987 17.5 6.5V13.5M8.75 7.08333C8.75 8.00381 8.00381 8.75 7.08333 8.75C6.16286 8.75 5.41667 8.00381 5.41667 7.08333C5.41667 6.16286 6.16286 5.41667 7.08333 5.41667C8.00381 5.41667 8.75 6.16286 8.75 7.08333Z'
              stroke='#8E8194'
              strokeWidth='1.67'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </TextButton>
      ) : (
        <EmphasisButton
          onClick={() => setIsOpen(!isOpen)}
          className='flex w-full items-center justify-between rounded-lg bg-neutral-700 p-3 font-normal text-neutral-50 backdrop-blur-sm transition-all duration-200 hover:bg-neutral-700/50'
        >
          <div className='flex items-center space-x-3'>
            <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M13.5 17.5H5.77614C5.2713 17.5 5.01887 17.5 4.90199 17.4002C4.80056 17.3135 4.74674 17.1836 4.75721 17.0506C4.76927 16.8974 4.94776 16.7189 5.30474 16.3619L12.3905 9.27614C12.7205 8.94613 12.8855 8.78112 13.0758 8.7193C13.2432 8.66492 13.4235 8.66492 13.5908 8.7193C13.7811 8.78112 13.9461 8.94613 14.2761 9.27614L17.5 12.5V13.5M13.5 17.5C14.9001 17.5 15.6002 17.5 16.135 17.2275C16.6054 16.9878 16.9878 16.6054 17.2275 16.135C17.5 15.6002 17.5 14.9001 17.5 13.5M13.5 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V6.5C2.5 5.09987 2.5 4.3998 2.77248 3.86502C3.01217 3.39462 3.39462 3.01217 3.86502 2.77248C4.3998 2.5 5.09987 2.5 6.5 2.5H13.5C14.9001 2.5 15.6002 2.5 16.135 2.77248C16.6054 3.01217 16.9878 3.39462 17.2275 3.86502C17.5 4.3998 17.5 5.09987 17.5 6.5V13.5M8.75 7.08333C8.75 8.00381 8.00381 8.75 7.08333 8.75C6.16286 8.75 5.41667 8.00381 5.41667 7.08333C5.41667 6.16286 6.16286 5.41667 7.08333 5.41667C8.00381 5.41667 8.75 6.16286 8.75 7.08333Z'
                stroke='#8E8194'
                strokeWidth='1.67'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            {selectedOption ? (
              <>
                <span className='text-sm'>{selectedOption.name}</span>
              </>
            ) : (
              <span className='text-sm text-gray-300'>Select an option</span>
            )}
          </div>
          <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </EmphasisButton>
      )}

      {/* Dropdown Options */}
      {isOpen && (
        <div className='absolute top-full right-0 z-50 mt-2 w-[388px] space-y-4 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 p-4 shadow-2xl backdrop-blur-md'>
          {(options || []).map(option => (
            <div
              key={option.id}
              onClick={() => handleSelect(option)}
              className={cn(
                'group flex cursor-pointer items-center gap-4 rounded-xl border border-neutral-700 p-4 transition-colors duration-200 hover:bg-neutral-800',
                option.id === selectedOption?.id && 'bg-primary-950/50 border-primary-800',
              )}
            >
              <Image
                alt={option.name}
                className='h-[77px] w-[116px] rounded-lg'
                width={116}
                height={77}
                src={option.image}
              />
              <div className='flex-1'>
                <span className='text-sm font-medium text-white'>{option.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageSelect
