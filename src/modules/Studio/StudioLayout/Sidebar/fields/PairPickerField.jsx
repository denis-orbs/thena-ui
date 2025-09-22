'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import IconGroup from '@/components/icongroup'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { usePairs } from '@/context/pairsContext'
import { cn, isInvalidAmount } from '@/lib/utils'
import PairModal from '@/modules/PairModal'
import { ChevronDownIcon } from '@/svgs'

export default function PairPickerField({ label, value, onChange }) {
  const [open, setOpen] = useState(false)
  const t = useTranslations()
  const { pairs } = usePairs()
  const pairFilteredSubpools = pairs.map(ele => {
    let { subpools } = ele
    if ([PAIR_TYPES.CLASSIC, PAIR_TYPES.STABLE].includes(ele.type)) {
      subpools = ele.subpools.filter(sub => sub.version === 3)
    }
    if (ele.type === PAIR_TYPES.LSD) {
      const hasCLFarming = ele.subpools.some(sub => sub.title === 'CL_Farming')
      if (hasCLFarming) {
        subpools = ele.subpools.filter(sub => sub.title !== 'CL_SwapFee')
      }
    }
    return { ...ele, subpools }
  })

  const final = pairFilteredSubpools.filter(ele => {
    if (ele.type === PAIR_TYPES.WEIGHTED) {
      return !isInvalidAmount(ele.aprNumber)
    }
    return ele.highApr > 0
  })

  return (
    <div>
      <TextHeading className='leading-5! font-medium'>{label}</TextHeading>
      <div
        className='mt-2 flex h-11 cursor-pointer items-center justify-between rounded-lg bg-neutral-700 px-4 py-3'
        onClick={() => setOpen(!open)}
      >
        {value ? (
          <div className='flex items-center gap-3'>
            {value.type === PAIR_TYPES.WEIGHTED ? (
              <ThreeIconGroup
                className='*:not-first:-ml-1'
                classNames={{
                  image: 'w-4 h-4 text-xl font-medium leading-5 text-[#1C2027]',
                }}
                logo1={value?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                logo2={value?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                extendNumber={(value?.tokens?.length || 2) - 2}
              />
            ) : (
              <IconGroup
                className='*:not-first:-ml-1'
                classNames={{
                  image: 'outline-2 w-4 h-4',
                }}
                logo1={value?.token0?.logoURI ?? UNKNOWN_LOGO}
                logo2={value?.token1?.logoURI ?? UNKNOWN_LOGO}
              />
            )}
            <div className='flex items-center gap-2'>
              <TextHeading>{value.symbol}</TextHeading>
              <Paragraph className='text-sm'>{t(value.type)}</Paragraph>
            </div>
          </div>
        ) : (
          <p className='text-neutral-400'>{t('Select Pair')}</p>
        )}
        <ChevronDownIcon
          className={cn('transfrom h-5 w-5 transition-all duration-150 ease-out', open ? 'rotate-180' : 'rotate-0')}
        />
      </div>
      <PairModal popup={open} setPopup={setOpen} pools={final} setSelected={onChange} />
    </div>
  )
}
