import { useTranslations } from 'next-intl'
import React, { memo, useEffect, useMemo, useRef, useState } from 'react'

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
  const [width, setWidth] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.target === ref.current) {
            const newWidth = entry.contentRect.width
            setWidth(newWidth)
          }
        }
      })

      resizeObserver.observe(ref.current)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [])

  const poolsWithGauge = usePoolsWithGauge()

  const pairs = useMemo(
    () =>
      poolsWithGauge.map(item => ({
        ...item,
        title: item?.title === 'CL_Farming' ? 'Conc. Liquidity' : item?.title,
      })),
    [poolsWithGauge],
  )

  useEffect(() => {
    if (selected) {
      onSelected({
        lock,
        weight,
        pair: {
          address: selected.address,
          basePool: selected.basePool,
          lpPrice: selected.lpPrice,
          stable: selected.stable,
          symbol: selected.symbol,
          title: selected.title,
          type: selected.type,
          version: selected.version,
          ...(selected.type === PAIR_TYPES.WEIGHTED
            ? {
                tokens: (selected.tokens || []).map(token => ({
                  ...token,
                  totalValue: token?.totalValue?.toString() || 0,
                  balance: token?.balance?.toString() || 0,
                  reserve: token?.reserve?.toString() || 0,
                })),
              }
            : {
                token0: {
                  ...selected.token0,
                  reserve: selected?.token0?.reserve?.toString() || 0,
                  balance: selected?.token0?.balance?.toString() || 0,
                },
                token1: {
                  ...selected.token1,
                  reserve: selected?.token1?.reserve?.toString() || 0,
                  balance: selected?.token1?.balance?.toString() || 0,
                },
              }),
        },
      })
    }
  }, [lock, onSelected, selected, weight])

  useEffect(() => {
    setSelected(prev => (JSON.stringify(pair.pair) !== JSON.stringify(pair) ? pair.pair : prev))
    setWeight(prev => (pair.weight !== prev ? pair.weight : prev))
    setLock(prev => (pair.lock !== prev ? pair.lock : prev))
  }, [pair])
  return (
    <div
      ref={ref}
      className={cn('fex-row flex justify-between px-4 py-[14px]', width < 450 ? 'flex-col' : 'flex-row items-center')}
    >
      <div
        className='float-left flex w-fit cursor-pointer items-center justify-between rounded-full bg-neutral-700 p-2 xl:px-4 xl:py-3'
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
              {selected.type !== PAIR_TYPES.WEIGHTED && <Paragraph className='text-sm'>{selected.type}</Paragraph>}
            </div>
          </div>
        ) : (
          <p className='text-neutral-400'>{t('Select Pair')}</p>
        )}
        <ChevronDownIcon
          className={cn('transfrom h-5 w-5 transition-all duration-150 ease-out', isOpen ? 'rotate-180' : 'rotate-0')}
        />
      </div>
      <div className={cn('float-right flex flex-row items-center', width < 450 ? 'mt-3 justify-between' : '')}>
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
        <div>
          <OutlineIconButton
            className='mr-2 h-7 w-7'
            Icon={lock ? LockIcon : UnlockIcon}
            onClick={() => setLock(prev => !prev)}
          />
          <OutlineIconButton className='h-7 w-7' Icon={TrashIcon} onClick={onRemovePair} />
        </div>
      </div>

      <PairModal popup={isOpen} setPopup={setIsOpen} setSelected={setSelected} pools={pairs} />
    </div>
  )
}
export default memo(VotingPairItem)
