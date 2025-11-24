'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import IconGroup from '@/components/icongroup'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import ChevronDownIcon from '@/icons/ChevronDownIcon'
import { PATH_NAME } from '@/modules/Studio/lib/utils'

import PairModal from './PairModal'

export default function PairPickerField({ label, value, onChange, options = [] }) {
  const [open, setOpen] = useState(false)
  const t = useTranslations()

  const pathname = usePathname()

  return (
    <div>
      <TextHeading className='leading-5! font-medium'>{label}</TextHeading>
      <div
        className='mt-2 flex h-11 cursor-pointer items-center justify-between rounded-lg bg-neutral-700 px-4 py-3'
        onClick={() => setOpen(!open)}
      >
        {value ? (
          <div className='flex items-center gap-3'>
            <IconGroup
              className='*:not-first:-ml-1'
              classNames={{
                image: 'outline-2 w-4 h-4 z-0',
              }}
              logo1={value?.token0?.logoURI ?? UNKNOWN_LOGO}
              logo2={value?.token1?.logoURI ?? UNKNOWN_LOGO}
            />
            <div className='flex items-center gap-2'>
              {/* <TextHeading>{value.symbol}</TextHeading> */}
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
        <ChevronDownIcon isRevert={open} />
      </div>
      <PairModal
        popup={open}
        setPopup={setOpen}
        pools={options}
        setSelected={onChange}
        field={pathname !== PATH_NAME.INCENTIVES ? 'apr' : 'incentives'}
      />
    </div>
  )
}
