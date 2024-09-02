import React from 'react'

function Tag({ children }) {
  return (
    <div className='flex w-fit items-center justify-between space-x-2 rounded-full  bg-primary-950 px-[10px] py-[6px] text-[11px] uppercase text-primary-400 md:text-xs'>
      {children}
    </div>
  )
}

export default Tag
