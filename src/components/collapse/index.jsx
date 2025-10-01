import cn from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useCallback, useEffect, useState } from 'react'

import { ChevronDownIcon } from '@/svgs'

import Divider from '../divider'

export function Collapse({ children, title, defaultShow = true, onToggle, isOpen, classNames, ...props }) {
  const [show, setShow] = useState(defaultShow)

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
    if (typeof isOpen !== 'undefined') {
      setShow(isOpen)
    }
  }, [isOpen])
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
      <AnimatePresence initial={false}>
        {show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='overflow-hidden'
          >
            <div className={cn(classNames?.content)}>
              <Divider className={cn('mx-4 mt-4', classNames?.divider ? classNames.divider : 'hidden')} />
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
