import React from 'react'

import SearchIcon from '~/svgs/search.svg'
import XIcon from '~/svgs/x-close.svg'

import Input from '.'

function SearchInput({
  val,
  setVal,
  placeholder = 'Search',
  showIconClearText = true,
  showIconClose = false,
  onClear,
  ...rest
}) {
  return (
    <Input
      type='text'
      val={val}
      onChange={e => setVal(e.target.value)}
      placeholder={placeholder}
      LeadingIcon={<SearchIcon />}
      TrailingIcon={
        (showIconClearText && val) || showIconClose ? (
          <XIcon
            className='stroke-neutral-400 hover:cursor-pointer'
            onClick={() => {
              setVal('')
              onClear?.()
            }}
          />
        ) : null
      }
      {...rest}
    />
  )
}

export default SearchInput

export function SearchInput2({ val, setVal, placeholder = 'Search', ...rest }) {
  return (
    <Input
      type='text'
      val={val}
      onChange={e => setVal(e.target.value)}
      placeholder={placeholder}
      TrailingIcon={<SearchIcon />}
      {...rest}
    />
  )
}
