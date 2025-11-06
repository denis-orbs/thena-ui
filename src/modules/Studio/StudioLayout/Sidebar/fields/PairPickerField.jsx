'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

import { EmphasisIconButton } from '@/components/buttons/IconButton'
import IconGroup from '@/components/icongroup'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { PATH_NAME } from '@/modules/Studio/lib/utils'

import ChevronDownIcon from '~/svgs/chevron-down.svg'
import TrashIcon from '~/svgs/trash.svg'

import PairModal from './PairModal'
import PairPopover from './PairPopover'

export default function PairPickerField({ value, onChange, options = [], onRemove = () => {} }) {
  const [open, setOpen] = useState(false)
  const t = useTranslations()
  const { isXlDown } = useMediaQuery()
  const wrapperRef = useRef(null)

  const pathname = usePathname()

  return (
    <div ref={wrapperRef} className='relative flex items-center gap-2'>
      <div
        className='flex h-11 flex-1 cursor-pointer items-center justify-between rounded-lg bg-neutral-700 px-4 py-3'
        onClick={() => setOpen(!open)}
      >
        {value ? (
          <div className='flex items-center gap-3'>
            {value.type === PAIR_TYPES.WEIGHTED ? (
              <ThreeIconGroup
                className='*:not-first:-ml-1'
                classNames={{
                  image: 'w-4 h-4 text-xl font-medium leading-5 text-[#1C2027] z-0',
                }}
                logo1={value?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                logo2={value?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                extendNumber={(value?.tokens?.length || 2) - 2}
              />
            ) : (
              <IconGroup
                className='*:not-first:-ml-1'
                classNames={{
                  image: 'outline-2 w-4 h-4 z-0',
                }}
                logo1={value?.token0?.logoURI ?? UNKNOWN_LOGO}
                logo2={value?.token1?.logoURI ?? UNKNOWN_LOGO}
              />
            )}
            <div className='flex items-center gap-2'>
              <div className='flex min-w-0 items-center gap-2' title={value.symbol}>
                <TextHeading className='block max-w-[120px] truncate text-base! leading-5! uppercase'>
                  {value.symbol}
                </TextHeading>
              </div>
              <Paragraph className='text-sm! leading-5!'>{t(value.type)}</Paragraph>
            </div>
          </div>
        ) : (
          <p className='text-neutral-400'>{t('Select Pair')}</p>
        )}
        <ChevronDownIcon className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} />
      </div>
      <EmphasisIconButton className='size-11 xl:hidden' onClick={onRemove} Icon={TrashIcon} />

      {/* Use popover for large screens, modal for small screens */}
      {isXlDown ? (
        <PairModal
          popup={open}
          setPopup={setOpen}
          pools={options}
          setSelected={onChange}
          field={pathname !== PATH_NAME.INCENTIVES ? 'apr' : 'incentives'}
        />
      ) : (
        <PairPopover
          popup={open}
          setPopup={setOpen}
          pools={options}
          setSelected={onChange}
          field={pathname !== PATH_NAME.INCENTIVES ? 'apr' : 'incentives'}
          wrapperRef={wrapperRef}
        />
      )}
    </div>
  )
}
