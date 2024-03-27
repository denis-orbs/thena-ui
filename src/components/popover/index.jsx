'use client'

import { useEffect, useRef, useState } from 'react'

function Popover({ children, triggerElement, trigger = 'click' }) {
  const [show, setShow] = useState(false)
  const wrapperRef = useRef(null)

  const handleMouseOver = () => {
    if (trigger === 'hover') {
      setShow(true)
    }
  }

  const handleMouseLeft = () => {
    if (trigger === 'hover') {
      setShow(false)
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShow(false)
      }
    }

    if (show) {
      // Bind the event listener
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        // Unbind the event listener on clean up
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [show, wrapperRef])

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={handleMouseOver}
      onMouseLeave={handleMouseLeft}
      className='relative flex h-fit w-fit justify-center'
    >
      <div onClick={() => setShow(!show)}>{triggerElement}</div>
      <div
        hidden={!show}
        className='absolute right-0 top-[100%] z-20 mt-1 h-fit w-full min-w-fit flex-col items-start justify-start gap-1 space-y-3 rounded-md border border-neutral-600 bg-neutral-800 p-3 shadow transition-all xl:p-4'
      >
        {children}
      </div>
    </div>
  )
}

export default Popover
