import { useEffect, useState } from 'react'

import ChevronRightIcon from '@/icons/ChevronRightIcon'
import cn from '@/utils/classes'

export default function Pagination({ currentPage = 1, totalPages = 1, onPageChange = () => {}, className = '' }) {
  const [visiblePages, setVisiblePages] = useState([])
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.pagination-container')
      if (container) {
        const newWidth = container.offsetWidth
        // Only update if width changed significantly to avoid unnecessary re-renders
        if (Math.abs(newWidth - containerWidth) > 10) {
          setContainerWidth(newWidth)
        }
      }
    }

    // Initial width calculation
    updateWidth()

    // Debounced resize handler for better performance
    let timeoutId
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateWidth, 100)
    }

    window.addEventListener('resize', debouncedResize)

    // Use ResizeObserver for more accurate container size detection
    let resizeObserver
    const container = document.querySelector('.pagination-container')
    if (container && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width
          if (Math.abs(newWidth - containerWidth) > 10) {
            setContainerWidth(newWidth)
          }
        }
      })
      resizeObserver.observe(container)
    }

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', debouncedResize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [containerWidth])

  useEffect(() => {
    // Calculate how many page buttons can fit based on container width
    const buttonWidth = 44 // approximate width of each button
    const navigationWidth = 88 // width of prev/next buttons (44px each)
    const gapWidth = 4 // gap between buttons (1 * 4px)
    const padding = 32 // total padding (16px each side)

    // Calculate available width for page buttons
    const availableWidth = containerWidth - navigationWidth - padding
    const maxButtons = Math.floor((availableWidth + gapWidth) / (buttonWidth + gapWidth))

    // Define responsive breakpoints
    let maxPageButtons
    if (containerWidth < 480) {
      // Mobile: minimum 3 buttons
      maxPageButtons = Math.max(3, Math.min(5, maxButtons))
    } else if (containerWidth < 768) {
      // Tablet: 5-7 buttons
      maxPageButtons = Math.max(5, Math.min(7, maxButtons))
    } else if (containerWidth < 1024) {
      // Desktop small: 7-9 buttons
      maxPageButtons = Math.max(7, Math.min(9, maxButtons))
    } else {
      // Desktop large: 9-12 buttons
      maxPageButtons = Math.max(9, Math.min(12, maxButtons))
    }

    // Ensure we don't exceed total pages
    maxPageButtons = Math.min(maxPageButtons, totalPages)

    // Always maintain at least 3 buttons for usability
    maxPageButtons = Math.max(3, maxPageButtons)

    const generateVisiblePages = (current, total, maxVisible) => {
      // Always maintain exactly maxVisible slots for consistent width
      const pages = new Array(maxVisible).fill(null)

      if (total <= maxVisible) {
        // If total pages fit in available slots, just show all pages
        for (let i = 0; i < total; i++) {
          pages[i] = i + 1
        }
        return pages
      }

      // For many pages, we need to use ellipsis strategically
      // We must always use exactly maxVisible slots

      // Always show first page
      pages[0] = 1

      // Always show last page
      pages[maxVisible - 1] = total

      // Calculate available slots for middle content (excluding first and last)
      const middleSlots = maxVisible - 2

      if (middleSlots <= 0) {
        return pages
      }

      // Determine if we need ellipsis and where to place them
      const needLeftEllipsis = current > 4 // Show ... if current page is far from start
      const needRightEllipsis = current < total - 3 // Show ... if current page is far from end

      if (!needLeftEllipsis && !needRightEllipsis) {
        // No ellipsis needed - show consecutive pages from start
        // Pattern: [1][2][3][4][5][6][7][...][last]
        let pageIndex = 1
        for (let page = 2; page < total && pageIndex < maxVisible - 1; page++) {
          pages[pageIndex] = page
          pageIndex++
        }
      } else if (!needLeftEllipsis && needRightEllipsis) {
        // Only right ellipsis: [1][2][3][4][5][...][last]
        // Fill all middle slots with consecutive pages, then add ellipsis
        let pageIndex = 1
        for (let page = 2; pageIndex < maxVisible - 2; page++) {
          pages[pageIndex] = page
          pageIndex++
        }
        pages[maxVisible - 2] = '...'
      } else if (needLeftEllipsis && !needRightEllipsis) {
        // Only left ellipsis: [1][...][n-4][n-3][n-2][n-1][last]
        pages[1] = '...'
        let pageIndex = 2
        const startPage = Math.max(2, total - (maxVisible - 3))
        for (let page = startPage; page < total && pageIndex < maxVisible - 1; page++) {
          pages[pageIndex] = page
          pageIndex++
        }
      } else {
        // Both ellipsis: [1][...][current-1][current][current+1][...][last]
        // Need to distribute the remaining slots wisely
        pages[1] = '...'
        pages[maxVisible - 2] = '...'

        // Calculate how many page numbers we can show in the middle
        const availableMiddleSlots = maxVisible - 4 // excluding [1], [...], [...], [last]

        if (availableMiddleSlots >= 3) {
          // Show current page and neighbors
          const middleStart = Math.floor((maxVisible - availableMiddleSlots) / 2)
          pages[middleStart] = current - 1
          pages[middleStart + 1] = current
          pages[middleStart + 2] = current + 1

          // Fill remaining slots if any
          const leftSlots = middleStart - 2
          const rightSlots = maxVisible - middleStart - 3 - 1

          if (leftSlots > 0) {
            pages[2] = current - 2
          }
          if (rightSlots > 0) {
            pages[maxVisible - 3] = current + 2
          }
        } else if (availableMiddleSlots >= 1) {
          // Just show current page
          const currentIndex = Math.floor(maxVisible / 2)
          pages[currentIndex] = current

          // Add neighbors if space allows
          if (availableMiddleSlots >= 2 && currentIndex > 2) {
            pages[currentIndex - 1] = current - 1
          }
          if (availableMiddleSlots >= 3 && currentIndex < maxVisible - 3) {
            pages[currentIndex + 1] = current + 1
          }
        }
      }

      return pages
    }

    const pages = generateVisiblePages(currentPage, totalPages, maxPageButtons)
    setVisiblePages(pages)
  }, [currentPage, totalPages, containerWidth])

  const handlePageClick = page => {
    if (page !== '...' && page !== currentPage) {
      onPageChange(page)
    }
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div className={`pagination-container w-full ${className}`}>
      <div className='flex w-full items-center justify-center rounded-lg bg-gray-800 p-2'>
        {/* Previous Button */}
        <button
          type='button'
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label='Go to previous page'
          className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
            currentPage === 1 ? 'cursor-not-allowed text-gray-500' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <ChevronRightIcon className='rotate-180' />
        </button>

        {/* Page Numbers */}
        <div className='mx-2 flex flex-1 items-center justify-center gap-1'>
          {visiblePages.map((page, index) =>
            page === null ? (
              // Empty placeholder to maintain consistent width
              <div
                key={`placeholder-${index}`}
                className='flex h-10 items-center justify-center px-3'
                style={{
                  minWidth: '40px',
                  flex: '1 1 0',
                }}
              />
            ) : (
              <button
                type='button'
                key={`${page}-${index}`}
                onClick={() => handlePageClick(page)}
                disabled={page === '...'}
                className={cn(
                  'flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors',
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : page === '...'
                      ? 'cursor-default text-gray-500'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                )}
                style={{
                  minWidth: page === '...' ? '32px' : '40px',
                  flex: page === '...' ? '0 0 auto' : '1 1 0',
                }}
              >
                {page}
              </button>
            ),
          )}
        </div>

        {/* Next Button */}
        <button
          type='button'
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label='Go to next page'
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-md transition-colors',
            currentPage === totalPages
              ? 'cursor-not-allowed text-gray-500'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white',
          )}
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  )
}
