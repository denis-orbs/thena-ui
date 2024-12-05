import cn from 'classnames'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { ChevronDownIcon } from '@/svgs'

export function Collapse({ children, title, defaultShow = true, onToggle, isOpen, classNames, ...props }) {
  const [show, setShow] = useState(defaultShow)
  const contentRef = useRef(null)
  const [maxHeight, setMaxHeight] = useState('0px')

  const onShow = useCallback(() => {
    setShow(prev => !prev)
    if (typeof onToggle === 'function') {
      onToggle(!show)
    }
  }, [onToggle, show])

  useEffect(() => {
    if (typeof isOpen !== 'undefined') {
      setShow(isOpen)
    }
  }, [isOpen])

  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(show ? `${contentRef.current.scrollHeight}px` : '0px')
    }
  }, [show, children])

  return (
    <div {...props}>
      {/* Title Section */}
      <div
        onClick={onShow}
        className={cn('flex items-center justify-between hover:cursor-pointer', !show ? 'h-full' : '')}
      >
        {title}
        <div
          className={cn(
            'h-4 w-5 transition-transform duration-300',
            show ? 'rotate-180' : 'rotate-0',
            classNames?.chevron,
          )}
        >
          <ChevronDownIcon />
        </div>
      </div>
      {/* Content Section */}
      <div
        ref={contentRef}
        className={cn('overflow-hidden transition-[max-height] duration-300 ease-in-out', classNames?.content)}
        style={{
          maxHeight,
        }}
      >
        {children}
      </div>
    </div>
  )
}
