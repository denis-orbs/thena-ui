import React from 'react'

import Dropdown from '@/components/dropdown'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon, ArrowRightIcon, PoolCoinsIcon } from '@/svgs'

function PaginateButton({ children, onClick, disabled, active, className }) {
  return (
    <div
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      className={cn(
        'flex h-8 w-fit min-w-8 items-center justify-center stroke-neutral-300 px-[2px] text-neutral-300',
        'hover:bg-neutral-700 hover:stroke-neutral-200 hover:text-neutral-200',
        'outline outline-2 outline-offset-4 outline-transparent',
        'cursor-pointer rounded transition-all duration-150 ease-out',
        'text-sm',
        active && 'bg-neutral-800',
        className,
      )}
    >
      {children}
    </div>
  )
}

function Pagination({ currentPage, setCurrentPage, totalPages, itemsPerPage, setItemsPerPage }) {
  return (
    <div className='flex flex-row items-center justify-between px-2.5 py-3.5'>
      <Dropdown
        className='h-11 w-full max-w-[128px] text-sm text-neutral-400'
        classNames={{ trailingIcon: 'right-4', input: 'pr-12 text-right' }}
        listClassNames='z-40'
        data={[{ label: 10 }, { label: 20 }, { label: 50 }, { label: 100 }]}
        selected={itemsPerPage}
        setSelected={ele => setItemsPerPage(ele.label)}
        prefix={<PoolCoinsIcon className='h-5 w-5 stroke-neutral-400' />}
        prefixClass='pl-12'
        isLocale={false}
      />

      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-2 md:justify-end'>
          <PaginateButton
            onClick={() => setCurrentPage(prev => Math.min(prev - 1, 1))}
            disabled={currentPage === 1}
            className={cn(
              currentPage === 1 && 'cursor-not-allowed hover:bg-inherit active:outline-none active:outline-transparent',
            )}
          >
            <ArrowLeftIcon className='size-4' />
          </PaginateButton>
          {totalPages < 6 &&
            new Array(totalPages).fill(0).map((item, idx) => (
              <PaginateButton
                key={`paginate-${idx}`}
                active={currentPage === idx + 1}
                onClick={() => {
                  setCurrentPage(idx + 1)
                }}
              >
                {idx + 1}
              </PaginateButton>
            ))}
          {totalPages >= 6 && (
            <>
              <PaginateButton
                active={currentPage === 1}
                onClick={() => {
                  setCurrentPage(1)
                }}
              >
                1
              </PaginateButton>
              <PaginateButton
                active={currentPage === 2}
                onClick={() => {
                  setCurrentPage(2)
                }}
              >
                2
              </PaginateButton>
              {currentPage > 3 && (
                <PaginateButton
                  onClick={() => {
                    setCurrentPage(currentPage > 3 ? currentPage - 1 : currentPage + 1)
                  }}
                >
                  ...
                </PaginateButton>
              )}
              {currentPage > 2 && currentPage < totalPages - 1 && (
                <PaginateButton
                  active
                  onClick={() => {
                    setCurrentPage(currentPage)
                  }}
                >
                  {currentPage}
                </PaginateButton>
              )}
              {currentPage < totalPages - 2 && (
                <PaginateButton
                  onClick={() => {
                    setCurrentPage(currentPage > totalPages - 2 ? currentPage - 1 : currentPage + 1)
                  }}
                >
                  ...
                </PaginateButton>
              )}
              <PaginateButton
                active={currentPage === totalPages - 1}
                onClick={() => {
                  setCurrentPage(totalPages - 1)
                }}
              >
                {totalPages - 1}
              </PaginateButton>
              <PaginateButton
                active={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage(totalPages)
                }}
              >
                {totalPages}
              </PaginateButton>
            </>
          )}
          <PaginateButton
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={cn(
              currentPage === totalPages &&
                'cursor-not-allowed hover:bg-inherit active:outline-none active:outline-transparent',
            )}
          >
            <ArrowRightIcon className='size-4' />
          </PaginateButton>
        </div>
      )}
    </div>
  )
}

export default Pagination
