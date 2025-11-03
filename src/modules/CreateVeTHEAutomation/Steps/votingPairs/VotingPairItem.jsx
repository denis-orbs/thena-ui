import { useTranslations } from 'next-intl'
import React, { useEffect, useRef, useState } from 'react'

import { OutlineIconButton } from '@/components/buttons/IconButton'
import IconGroup from '@/components/icongroup'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import Input from '@/components/input'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import ChevronDownIcon from '@/icons/ChevronDownIcon'
import { cn } from '@/lib/utils'
import PairModal from '@/modules/PairModal'
import { useV3PoolsWithGauge } from '@/state/pools/hooks'

import LockIcon from '~/svgs/lock.svg'
import TrashIcon from '~/svgs/trash.svg'
import UnlockIcon from '~/svgs/unlock.svg'

function VotingPairItem({ pair, onSelected, onRemovePair, pairsSelected }) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [pairState, setPairState] = useState({
    selected: pair.pair,
    weight: pair.weight,
    lock: pair.lock,
  })
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

  const poolsWithGauge = useV3PoolsWithGauge()

  const selectedAddresses = new Set(pairsSelected.map(p => p.pair?.address?.toLowerCase()))
  const filteredPairs = poolsWithGauge
    .filter(pool => pool.version === 3 && !selectedAddresses.has(pool.address.toLowerCase()))
    .map(pool => ({
      ...pool,
      title: pool?.title === 'CL_Farming' ? 'Conc. Liquidity' : pool?.title,
    }))

  useEffect(() => {
    if (!pairState.selected) return
    onSelected({
      lock: pairState.lock,
      weight: pairState.weight,
      pair: {
        address: pairState.selected.address,
        basePool: pairState.selected.basePool,
        lpPrice: pairState.selected.lpPrice,
        stable: pairState.selected.stable,
        symbol: pairState.selected.symbol,
        title: pairState.selected.title,
        type: pairState.selected.type,
        version: pairState.selected.version,
        ...(pairState.selected.type === PAIR_TYPES.WEIGHTED
          ? {
              tokens: (pairState.selected.tokens || []).map(token => ({
                ...token,
                totalValue: token?.totalValue?.toString() || 0,
                balance: token?.balance?.toString() || 0,
                reserve: token?.reserve?.toString() || 0,
              })),
            }
          : {
              token0: {
                ...pairState.selected.token0,
                reserve: pairState.selected?.token0?.reserve?.toString() || 0,
                balance: pairState.selected?.token0?.balance?.toString() || 0,
              },
              token1: {
                ...pairState.selected.token1,
                reserve: pairState.selected?.token1?.reserve?.toString() || 0,
                balance: pairState.selected?.token1?.balance?.toString() || 0,
              },
            }),
      },
    })
  }, [pairState, onSelected])

  useEffect(() => {
    setPairState({
      selected: pair.pair,
      weight: pair.weight,
      lock: pair.lock,
    })
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
        {pair.pair ? (
          <div className='flex items-center gap-1'>
            {pair.pair.type === PAIR_TYPES.WEIGHTED ? (
              <ThreeIconGroup
                className='*:not-first:-ml-2'
                classNames={{
                  image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                }}
                logo1={pair.pair?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                logo2={pair.pair?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                extendNumber={(pair.pair?.tokens?.length || 2) - 2}
              />
            ) : (
              <IconGroup
                className='*:not-first:-ml-2'
                classNames={{
                  image: 'outline-2 w-8 h-8',
                }}
                logo1={pair.pair.token0.logoURI ?? UNKNOWN_LOGO}
                logo2={pair.pair.token1.logoURI ?? UNKNOWN_LOGO}
              />
            )}
            <div className='flex items-end gap-[6px]'>
              <TextHeading className='text-sm'>{pair.pair.symbol}</TextHeading>
              {pair.pair.type !== PAIR_TYPES.WEIGHTED && <Paragraph className='text-sm'>{pair.pair.type}</Paragraph>}
            </div>
          </div>
        ) : (
          <p className='text-neutral-400'>{t('Select Pair')}</p>
        )}
        <ChevronDownIcon isRevert={isOpen} />
      </div>
      <div className={cn('float-right flex flex-row items-center', width < 450 ? 'mt-3 justify-between' : '')}>
        <div className='mr-3'>
          <Input
            className='h-11 w-[70px] border-none bg-transparent'
            classNames={{ input: 'bg-transparent p-0 border-none text-right pr-7' }}
            type='number'
            val={pairState.weight || ''}
            onChange={event => setPairState(prev => ({ ...prev, weight: Number(event.target.value), lock: true }))}
            placeholder=''
            suffix='%'
          />
        </div>
        <div>
          <OutlineIconButton
            className='mr-2 h-7 w-7'
            Icon={pairState.lock ? LockIcon : UnlockIcon}
            onClick={() => setPairState(prev => ({ ...prev, lock: !prev.lock }))}
          />
          <OutlineIconButton className='h-7 w-7' Icon={TrashIcon} onClick={onRemovePair} />
        </div>
      </div>

      <PairModal
        popup={isOpen}
        setPopup={setIsOpen}
        setSelected={selected => setPairState(prev => ({ ...prev, selected }))}
        pools={filteredPairs}
      />
    </div>
  )
}
export default VotingPairItem
