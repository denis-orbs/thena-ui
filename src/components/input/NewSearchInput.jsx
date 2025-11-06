import React from 'react'

import SearchIcon from '~/svgs/search.svg'

import Input from '.'

function NewSearchInput({ val, setVal, placeholder = 'Search', ...rest }) {
  return (
    <Input
      className='h-11'
      classNames={{ trailingIcon: 'right-4', input: 'text-base font-normal' }}
      type='text'
      val={val}
      onChange={e => setVal(e.target.value)}
      placeholder={placeholder}
      TrailingIcon={<SearchIcon />}
      {...rest}
    />
  )
}

export default NewSearchInput
