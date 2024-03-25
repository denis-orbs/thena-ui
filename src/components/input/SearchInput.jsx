import React from 'react'

import { SearchIcon } from '@/svgs'

import Input from '.'

function SearchInput({ val, setVal, placeholder = 'Search', ...rest }) {
  return (
    <Input
      type='text'
      val={val}
      onChange={e => setVal(e.target.value)}
      placeholder={placeholder}
      LeadingIcon={<SearchIcon />}
      {...rest}
    />
  )
}

export default SearchInput
