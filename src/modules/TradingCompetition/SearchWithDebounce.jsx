import React, { useEffect, useState } from 'react'

import SearchInput from '@/components/input/SearchInput'

function SearchWithDebounce({ searchText, setSearchText }) {
  const [value, setValue] = useState(searchText)
  useEffect(() => {
    clearTimeout(window.searchTimeout)
    window.searchTimeout = setTimeout(() => {
      setSearchText(value)
    }, 600)
  }, [setSearchText, value])
  return <SearchInput autoFocus className='w-full lg:flex-1' val={value} setVal={setValue} />
}

export default React.memo(SearchWithDebounce)
