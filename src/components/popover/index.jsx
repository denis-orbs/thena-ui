'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

function Popover({ children, triggerElement, trigger = 'click', position = 'right' }) {
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

  const positionClass = useMemo(() => {
    switch (position) {
      case 'top-center':
        return 'top-full left-1/2 transform -translate-x-1/2'
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
      case 'left':
        return 'left-0 top-full'
      default:
        return 'right-0 top-full'
    }
  }, [position])

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
      <div
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
          setShow(!show)
        }}
      >
        {triggerElement}
      </div>
      <div
        hidden={!show}
        className={cn(
          'absolute z-20 mt-1 h-fit w-full min-w-fit flex-col items-start justify-start gap-3 rounded-md border border-neutral-600 bg-neutral-800 p-3 shadow-xs transition-all xl:p-4',
          positionClass,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default Popover
