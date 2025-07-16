import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { ChevronDownIcon } from '@/svgs'

function Collapsible({
  title,
  subtitle,
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
    const preview = previewRef.current
    if (!content) return

    setIsAnimating(true)

    if (isOpen) {
      // Closing: animate content to 0, then show preview
      content.style.height = `${content.scrollHeight}px`
      requestAnimationFrame(() => {
        content.style.height = '0px'
      })

      // Show preview with delay to match content animation
      if (previewContent) {
        setTimeout(() => {
          setShowPreview(true)
          // Animate preview in
          if (preview) {
            preview.style.opacity = '0'
            preview.style.transform = 'translateY(-10px)'
            requestAnimationFrame(() => {
              preview.style.opacity = '1'
              preview.style.transform = 'translateY(0)'
            })
          }
        }, 200)
      }
    } else if (previewContent && preview) {
      // Animate preview out
      preview.style.opacity = '0'
      preview.style.transform = 'translateY(-10px)'

      setTimeout(() => {
        setShowPreview(false)
        // Start content animation
        setTimeout(() => {
          content.style.height = '0px'
          requestAnimationFrame(() => {
            content.style.height = `${content.scrollHeight}px`
          })
        }, 50)
      }, 150)
    } else {
      // No preview, animate content directly
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
      className={cn('bg-chart-gradient! relative overflow-hidden rounded-xl border border-neutral-600', className)}
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
      <div
        ref={previewRef}
        className={cn(
          'transform transition-all duration-300 ease-out',
          showPreview && !isOpen && previewContent ? 'block' : 'hidden',
        )}
        style={{
          opacity: showPreview && !isOpen && previewContent ? 1 : 0,
          transform: showPreview && !isOpen && previewContent ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        }}
      >
        <div className='relative'>
          <div className={cn('px-4 pt-4 pb-1', classNames?.preview)}>{previewContent}</div>
        </div>
      </div>

      {/* Header - with smooth position transition */}
      <div
        className={cn(
          'relative z-10 flex w-full cursor-pointer items-center justify-between p-4 transition-all duration-300 ease-out',
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
          <h3 className={cn('text-xl font-medium text-neutral-50 transition-all duration-300 ease-out')}>{title}</h3>
          {subtitle && (
            <p
              className={cn(
                'text-xs text-neutral-500 transition-all duration-300 ease-out',
                isOpen ? 'text-neutral-300' : 'text-neutral-400',
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        <ChevronDownIcon
          className={cn(
            'absolute right-4 bottom-4 size-5 text-neutral-50 transition-all duration-300 ease-out',
            isOpen ? 'rotate-180' : 'rotate-0',
          )}
        />
      </div>

      {/* Content with smooth height animation */}
      <div
        ref={contentRef}
        style={{
          height: defaultOpen ? 'auto' : '0px',
          transition: 'height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smoother easing
          overflow: 'hidden',
        }}
      >
        <div
          className={cn(classNames?.content)}
          style={{
            transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
            opacity: isOpen ? 1 : 0.8,
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease-out',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default Collapsible
