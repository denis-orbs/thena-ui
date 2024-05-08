import React from 'react'

import { SearchIcon, XIcon } from '@/svgs'

import Input from '.'

function SearchInput({ val, setVal, placeholder = 'Search', showIconClearText = true, ...rest }) {
  return (
    <Input
      type='text'
      val={val}
      onChange={e => setVal(e.target.value)}
      placeholder={placeholder}
      LeadingIcon={<SearchIcon />}
      TrailingIcon={
        showIconClearText && val ? (
          <XIcon className='stroke-neutral-400 hover:cursor-pointer' onClick={() => setVal('')} />
        ) : null
      }
      {...rest}
    />
  )
}

export default SearchInput
