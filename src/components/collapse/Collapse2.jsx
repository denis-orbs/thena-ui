import { useEffect, useRef, useState } from 'react'

import ChevronDownIcon from '@/icons/ChevronDownIcon'
import cn from '@/utils/classes'

import Divider from '../divider'

function Collapsible({
  title,
  defaultTitle,
  subtitle,
  defaultSubtitle,
  children,
  previewContent,
  keepPreview = false,
  defaultOpen = false,
  className,
  classNames = {},
  backgroundImage,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [showPreview, setShowPreview] = useState(!defaultOpen && !!previewContent)
  const [isAnimating, setIsAnimating] = useState(false)
  const contentRef = useRef(null)
  const previewRef = useRef(null)

  const toggleCollapse = () => {
    const content = contentRef.current
    if (!content) return

    setIsAnimating(true)

    if (isOpen) {
      // Closing: animate content to 0 and show preview simultaneously
      content.style.height = `${content.scrollHeight}px`
      requestAnimationFrame(() => {
        content.style.height = '0px'
      })

      // Show preview immediately for smooth transition
      if (previewContent) {
        // Small delay to let content start closing first
        setTimeout(() => {
          setShowPreview(true)
        }, 100)
      }
    } else {
      // Opening: hide preview and show content simultaneously
      if (previewContent) {
        setShowPreview(false)
      }

      // Start content animation
      content.style.height = '0px'
      requestAnimationFrame(() => {
        content.style.height = `${content.scrollHeight}px`
      })
    }

    setIsOpen(!isOpen)
  }

  // Handle auto height after animation completes
  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const handleTransitionEnd = () => {
      if (isOpen) {
        content.style.height = 'auto'
      }
      setIsAnimating(false)
    }

    content.addEventListener('transitionend', handleTransitionEnd)
    return () => content.removeEventListener('transitionend', handleTransitionEnd)
  }, [isOpen])

  return (
    <div
      className={cn('bg-chart-gradient relative overflow-hidden rounded-xl border border-neutral-600', className)}
      style={{
        backgroundImage:
          !isOpen && backgroundImage
            ? `url(${backgroundImage}), 
            linear-gradient(87.54deg, #0D090F 19.75%, #422D4C 240.97%),
            linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2))`
            : 'none',
      }}
      {...props}
    >
      {/* Preview content when collapsed */}
      {previewContent && (
        <div
          ref={previewRef}
          className='transform overflow-hidden'
          style={{
            opacity: showPreview && !isOpen ? 1 : 0,
            transform: showPreview && !isOpen ? 'translateY(0)' : 'translateY(-20px)',
            maxHeight: showPreview && !isOpen ? '200px' : '0px',
            transition:
              'opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), max-height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            pointerEvents: showPreview && !isOpen ? 'auto' : 'none',
          }}
        >
          <div className='relative'>
            <div className={cn('px-4 pt-4 pb-1', classNames?.preview)}>{previewContent}</div>
          </div>
        </div>
      )}

      {/* Header - with smooth position transition */}
      <div
        className={cn(
          'relative z-10 flex w-full cursor-pointer items-center justify-between p-4 transition-all duration-400 ease-out',
          showPreview && !isOpen && previewContent ? '-mt-6' : 'mt-0',
          isOpen && 'bg-gradient-to-b from-white/0 to-black/50',
          isAnimating && 'pointer-events-none', // Prevent clicks during animation
          classNames?.header,
          !isOpen && classNames?.headerClosed,
          isOpen && classNames?.headerOpen,
        )}
        onClick={toggleCollapse}
      >
        <div className='flex-1 content-end'>
          {keepPreview && isOpen && (
            <div
              className='relative transform transition-all duration-300 ease-out'
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateY(0)' : 'translateY(-5px)',
              }}
            >
              <div className={cn(classNames?.preview)}>{previewContent}</div>
            </div>
          )}
          {typeof title === 'string' ? (
            <h3 className={cn('text-xl leading-6 font-medium text-neutral-50 transition-all duration-300 ease-out')}>
              {isOpen ? title : defaultTitle ?? title}
            </h3>
          ) : isOpen ? (
            title
          ) : (
            defaultTitle ?? title
          )}
          {subtitle && (
            <p
              className={cn(
                'pt-1 text-sm leading-4! text-neutral-500 transition-all duration-300 ease-out',
                classNames?.subtitle,
              )}
            >
              {isOpen ? subtitle : defaultSubtitle ?? subtitle}
            </p>
          )}
        </div>
        <ChevronDownIcon isRevert={isOpen} className='absolute right-4 bottom-4 text-neutral-50 duration-300' />
      </div>
      {isOpen && (
        <div className='w-full px-2'>
          <Divider className='w-full bg-neutral-700' />
        </div>
      )}
      {/* Content with smooth height animation */}
      <div
        ref={contentRef}
        style={{
          height: defaultOpen ? 'auto' : '0px',
          transition: 'height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smoother and slightly longer easing
          overflow: 'hidden',
        }}
      >
        <div
          className={cn(classNames?.content)}
          style={{
            transform: isOpen ? 'translateY(0)' : 'translateY(-15px)', // Slightly more movement
            opacity: isOpen ? 1 : 0,
            transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease-out',
            transitionDelay: isOpen ? '0.1s' : '0s', // Slight delay when opening for smoother effect
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default Collapsible
