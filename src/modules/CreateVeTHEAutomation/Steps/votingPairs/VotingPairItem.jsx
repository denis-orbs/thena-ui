import { useTranslations } from 'next-intl'
import React, { memo, useEffect, useState } from 'react'

import { OutlineIconButton } from '@/components/buttons/IconButton'
import IconGroup from '@/components/icongroup'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import Input from '@/components/input'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { cn } from '@/lib/utils'
import PairModal from '@/modules/PairModal'
import { usePoolsWithGauge } from '@/state/pools/hooks'
import { ChevronDownIcon, LockIcon, TrashIcon, UnlockIcon } from '@/svgs'

function VotingPairItem({ pair, onSelected, onRemovePair }) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(pair.pair)
  const [weight, setWeight] = useState(pair.weight)
  const [lock, setLock] = useState(pair.lock)

  const pairs = usePoolsWithGauge()

  useEffect(() => {
    if (selected) {
      onSelected({
        lock,
        weight,
        pair: selected,
      })
    }
  }, [lock, onSelected, selected, weight])

  useEffect(() => {
    setSelected(prev => (JSON.stringify(pair.pair) !== JSON.stringify(pair) ? pair.pair : prev))
    setWeight(prev => (pair.weight !== prev ? pair.weight : prev))
    setLock(prev => (pair.lock !== prev ? pair.lock : prev))
  }, [pair])
  return (
    <div className='fex-row flex items-center justify-between px-4 py-[14px]'>
      <div
        className='flex cursor-pointer items-center justify-between rounded-full bg-neutral-700 p-2 xl:px-4 xl:py-3'
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected ? (
          <div className='flex items-center gap-1'>
            {selected.type === PAIR_TYPES.WEIGHTED ? (
              <ThreeIconGroup
                className='-space-x-2'
                classNames={{
                  image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                }}
                logo1={selected?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                logo2={selected?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                extendNumber={(selected?.tokens?.length || 2) - 2}
              />
            ) : (
              <IconGroup
                className='-space-x-2'
                classNames={{
                  image: 'outline-2 w-8 h-8',
                }}
                logo1={selected.token0.logoURI}
                logo2={selected.token1.logoURI}
              />
            )}
            <div className='flex items-end gap-[6px]'>
              <TextHeading className='text-sm'>{selected.symbol}</TextHeading>
              <Paragraph className='text-sm'>{selected.title}</Paragraph>
            </div>
          </div>
        ) : (
          <p className='text-neutral-400'>{t('Select Pair')}</p>
        )}
        <ChevronDownIcon
          className={cn('transfrom h-5 w-5 transition-all duration-150 ease-out', isOpen ? 'rotate-180' : 'rotate-0')}
        />
      </div>
      <div className='flex flex-row items-center'>
        <div className='mr-3'>
          <Input
            className='h-11 w-[70px] border-none bg-transparent'
            classNames={{ input: 'bg-transparent p-0 border-none text-right pr-7' }}
            type='number'
            min={0}
            step={1}
            val={weight || ''}
            onChange={event => {
              setWeight(Number(event.target.value))
              setLock(true)
            }}
            placeholder=''
            suffix='%'
          />
        </div>
        <OutlineIconButton
          className='mr-2'
          Icon={lock ? LockIcon : UnlockIcon}
          onClick={() => setLock(prev => !prev)}
        />
        <OutlineIconButton Icon={TrashIcon} onClick={onRemovePair} />
      </div>

      <PairModal popup={isOpen} setPopup={setIsOpen} setSelected={setSelected} pools={pairs} />
    </div>
  )
}
export default memo(VotingPairItem)
