import React from 'react'

function Tag({ children }) {
  return (
    <div className='bg-primary-950 text-primary-400 flex w-fit items-center justify-between gap-2 rounded-full px-[10px] py-[6px] text-[11px] uppercase md:text-xs'>
      {children}
    </div>
  )
}

export default Tag
