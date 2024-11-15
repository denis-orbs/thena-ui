import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import { OutlinedButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { usePairs } from '@/context/pairsContext'
import { cn, formatAmount, getPoolType, wrappedAddress } from '@/lib/utils'
import TokenModal from '@/modules/TokenModal'
import { ChevronDownIcon } from '@/svgs'

import Navigation from './Navigation'

const mockWeightedPool = {
  isFusion: true,
  fee: 0.01,
  tvlUSD: 2,
  dayFees: 4,
  weekFees: 0.2,
  dayVolume: 1,
  weekVolume: 4,
  reserve0: 0.9999999999999997,
  reserve1: 0.0002043617060788,
  token0: {
    address: '0x8fe83aff545f583e0968ce3edd05cd8e1f83b14e',
    symbol: 'ETH',
    derived: '0',
    logoURI: 'https://cdn.thena.fi/assets/ETH.png',
  },
  token0Derived: '0',
  token1: {
    address: '0xec7ef2340ca18d268c3f564af2f24587f7d399ba',
    symbol: 'BNB',
    derived: '0',
    logoURI: 'https://cdn.thena.fi/assets/WBNB.png',
  },
  token1Derived: '0',
  isStable: null,
  type: 'Weighted',
  symbol: 'ETH/BNB',
  apr: '0%',
  lowApr: 0,
  highApr: 0,
  subpools: [],
}

function PoolItem({ pool, onDeposit, isAdd = false }) {
  const t = useTranslations()
  return (
    <div className='flex flex-row items-center justify-between rounded-lg bg-neutral-900 p-3 lg:p-4'>
      <div className='flex flex-col justify-between gap-3 lg:flex-row'>
        <div className='flex flex-col gap-4 lg:flex-row'>
          {pool.type !== 'Weighted' ? (
            <div className='flex flex-row gap-2 lg:min-w-[496px]'>
              <IconGroup
                className='-space-x-3'
                classNames={{
                  image: 'outline-[2.6px] w-6 h-6',
                }}
                logo1={pool?.token0?.logoURI || UNKNOWN_LOGO}
                logo2={pool?.token1?.logoURI || UNKNOWN_LOGO}
              />
              <div className='flex flex-col'>
                <TextHeading className='text-sm lg:text-[16px]'>{pool.symbol}</TextHeading>
                <Paragraph className='text-nowrap text-sm lg:text-[16px]'>{getPoolType(pool?.type)}</Paragraph>
              </div>
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-4 lg:min-w-[496px] lg:grid-cols-2'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='flex flex-row items-center gap-[6px]'>
                  <CircleImage
                    className='z-1 h-6 w-6 rounded-full'
                    src={pool?.token0?.logoURI || UNKNOWN_LOGO}
                    alt='THENA First Logo'
                  />
                  <span>{pool?.token0?.symbol}</span>
                  <Paragraph>50%</Paragraph>
                </div>
                <div className='flex flex-row items-center gap-[6px]'>
                  <CircleImage
                    className='z-1 h-6 w-6 rounded-full'
                    src={pool?.token1?.logoURI || UNKNOWN_LOGO}
                    alt='THENA Second Logo'
                  />
                  <span>{pool?.token1?.symbol}</span>
                  <Paragraph>50%</Paragraph>
                </div>
              </div>
            </div>
          )}
          <div className='grid grid-cols-2'>
            <div className='flex flex-col lg:min-w-[200px]'>
              <TextHeading className='text-xs lg:text-sm'>APR</TextHeading>
              <Paragraph className='text-sm lg:text-[16px]'>{pool?.apr || '0%'}</Paragraph>
            </div>
            <div className='flex flex-col lg:min-w-[200px]'>
              <TextHeading className='text-xs lg:text-sm'>TVL</TextHeading>
              <Paragraph className='text-sm lg:text-[16px]'>${formatAmount(pool?.tlvUSD || 0)}</Paragraph>
            </div>
          </div>
        </div>
      </div>
      {isAdd && pool.type === PAIR_TYPES.WEIGHTED ? (
        <Link
          // eslint-disable-next-line max-len
          href={`/pools/weighted-pool/create?firstAddress=${pool?.token0?.address}&secondAddress=${pool?.token1?.address}`}
        >
          <OutlinedButton className='h-11 border border-primary-600 text-primary-600 hover:border-primary-600 hover:text-primary-600'>
            {t('Deposit')}
          </OutlinedButton>
        </Link>
      ) : (
        <OutlinedButton
          className='h-11 border border-primary-600 text-primary-600 hover:border-primary-600 hover:text-primary-600'
          onClick={() => onDeposit(pool, isAdd)}
        >
          {t('Deposit')}
        </OutlinedButton>
      )}
    </div>
  )
}

export default function Step1({ nextStep, setPoolSelected, poolSelected, setIsAdd }) {
  const { pairs } = usePairs()
  const t = useTranslations()
  const [firstAsset, setFirstAsset] = useState()
  const [secondAsset, setSecondAsset] = useState()
  const [firstAddress, setFirstAddress] = useState(poolSelected?.token0?.address || null)
  const [secondAddress, setSecondAddress] = useState(poolSelected?.token1?.address || null)
  const assets = useAssets()
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false)
  const [isFirstSelected, setIsFirstSelected] = useState(false)

  const [isOpenNavigation, setIsOpenNavigation] = useState(false)

  const toggleDrawer = () => {
    setIsOpenNavigation(!isOpenNavigation)
  }

  useEffect(() => {
    setFirstAsset(assets.find(ele => ele.address === firstAddress))
    setSecondAsset(assets.find(ele => ele.address === secondAddress))
  }, [assets, firstAddress, secondAddress])

  const availablePools = useMemo(() => {
    if (!firstAddress || !secondAddress) return []
    const pools = pairs.filter(
      pool =>
        [pool.token0.address, pool.token1.address].includes(wrappedAddress(firstAsset)) &&
        [pool.token0.address, pool.token1.address].includes(wrappedAddress(secondAsset)),
    )
    mockWeightedPool.token0 = firstAsset
    mockWeightedPool.token1 = secondAsset
    return pools
  }, [firstAddress, firstAsset, pairs, secondAddress, secondAsset])

  const createNewPools = useMemo(() => {
    const result = []
    if (!firstAddress || !secondAddress) return []

    const checkLSD = Boolean(availablePools.find(item => item.type === PAIR_TYPES.LSD))
    if (!checkLSD) {
      result.push({
        ...mockWeightedPool,
        symbol: `${firstAsset.symbol}/${secondAsset.symbol}`,
        token0: firstAsset,
        token1: secondAsset,
        type: PAIR_TYPES.LSD,
      })
    }

    const checkClassic = Boolean(availablePools.find(item => item.type === PAIR_TYPES.CLASSIC))
    if (!checkClassic) {
      result.push({
        ...mockWeightedPool,
        symbol: `${firstAsset.symbol}/${secondAsset.symbol}`,
        token0: firstAsset,
        token1: secondAsset,
        type: PAIR_TYPES.CLASSIC,
      })
    }

    const checkStable = Boolean(availablePools.find(item => item.type === PAIR_TYPES.STABLE))
    if (!checkStable) {
      result.push({
        ...mockWeightedPool,
        symbol: `${firstAsset.symbol}/${secondAsset.symbol}`,
        token0: firstAsset,
        token1: secondAsset,
        type: PAIR_TYPES.STABLE,
      })
    }

    result.push({
      ...mockWeightedPool,
      symbol: `${firstAsset.symbol}/${secondAsset.symbol}`,
      token0: firstAsset,
      token1: secondAsset,
      type: PAIR_TYPES.WEIGHTED,
    })

    return result
  }, [availablePools, firstAddress, firstAsset, secondAddress, secondAsset])

  const onDeposit = useCallback(
    (pool, isAdd = false) => {
      setPoolSelected(pool)
      nextStep(1)
      setIsAdd(isAdd)
    },
    [nextStep, setIsAdd, setPoolSelected],
  )

  return (
    <div className='flex max-w-[1028px] flex-col gap-4 lg:gap-6'>
      {isOpenNavigation && (
        <div className='fixed inset-0 z-30 bg-[#0D090FE5] bg-opacity-50 backdrop-blur-sm transition-opacity duration-1000' />
      )}
      <div className='flex flex-col gap-3'>
        <div>
          <TextSubHeading className='text-sm lg:text-[16px]'>{t('Add liquidity sub')}</TextSubHeading>
          <span>
            <TextButton onClick={toggleDrawer} className='text-sm text-primary-600 hover:bg-transparent lg:text-[16px]'>
              {t('Learn more')}
            </TextButton>
          </span>
        </div>
      </div>
      <Box className='flex max-w-[1028px] flex-col gap-6'>
        <TextHeading className='text-2xl lg:text-3xl'>{t('Select Pair')}</TextHeading>
        <div className='grid grid-cols-2 gap-4'>
          <Input
            classNames={{
              input: 'cursor-pointer caret-transparent',
            }}
            type='text'
            onClick={() => {
              setIsFirstSelected(true)
              setIsTokenModalOpen(true)
            }}
            LeadingIcon={
              firstAsset ? (
                <CircleImage src={firstAsset?.logoURI || UNKNOWN_LOGO} alt='thena token logo' width={20} height={20} />
              ) : null
            }
            TrailingIcon={<ChevronDownIcon className={cn(isTokenModalOpen && 'rotate-180')} />}
            val={firstAsset?.symbol}
            placeholder='Select Asset'
            readOnly
          />
          <Input
            classNames={{
              input: 'cursor-pointer caret-transparent',
            }}
            type='text'
            onClick={() => {
              setIsFirstSelected(false)
              setIsTokenModalOpen(true)
            }}
            LeadingIcon={
              secondAsset ? (
                <CircleImage src={secondAsset?.logoURI || UNKNOWN_LOGO} alt='thena token logo' width={20} height={20} />
              ) : null
            }
            TrailingIcon={<ChevronDownIcon className={cn(isTokenModalOpen && 'rotate-180')} />}
            val={secondAsset?.symbol}
            placeholder='Select Asset'
            readOnly
          />
        </div>
      </Box>
      {availablePools.length > 0 && (
        <div className='flex flex-col gap-2'>
          <TextHeading>{t('Available Pools')}</TextHeading>
          <div className='grid grid-cols-1 items-center gap-3'>
            {availablePools.map(item => (
              <PoolItem key={item.address} pool={item} onDeposit={onDeposit} />
            ))}
          </div>
        </div>
      )}

      {firstAsset && secondAsset && (
        <div className='flex flex-col gap-2'>
          <TextHeading>{t('Create New Pool')}</TextHeading>
          <div className='grid grid-cols-1 gap-3'>
            {createNewPools.map((item, index) => (
              <PoolItem key={`${item.type}_${index}`} pool={item} isAdd onDeposit={onDeposit} />
            ))}
          </div>
        </div>
      )}
      <TokenModal
        popup={isTokenModalOpen}
        setPopup={setIsTokenModalOpen}
        selectedAsset={isFirstSelected ? firstAsset : secondAsset}
        setSelectedAsset={item => {
          if (isFirstSelected) {
            setFirstAddress(item.address)
          } else {
            setSecondAddress(item.address)
          }
        }}
        otherAsset={isFirstSelected ? secondAsset : firstAsset}
        setOtherAsset={item => {
          if (isFirstSelected) {
            setSecondAddress(item.address)
          } else {
            setFirstAddress(item.address)
          }
        }}
      />
      <Navigation isOpen={isOpenNavigation} setIsOpen={setIsOpenNavigation} />
    </div>
  )
}
