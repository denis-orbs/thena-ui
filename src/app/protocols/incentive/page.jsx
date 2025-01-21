'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { Neutral } from '@/components/alert'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import IconGroup from '@/components/icongroup'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import BalanceInput from '@/components/input/BalanceInput'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useMutateAssets } from '@/context/assetsContext'
import { useBribeAdd } from '@/hooks/useProtocols'
import useWallet from '@/hooks/useWallet'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, isInvalidAmount } from '@/lib/utils'
import PairModal from '@/modules/PairModal'
import { usePoolsWithGauge } from '@/state/pools/hooks'
import { ArrowLeftIcon, ChevronDownIcon } from '@/svgs'

import { TokenModal } from './TokenModal'

export default function IncentivePage() {
  const [pairOpen, setPairOpen] = useState(false)
  const [tokenOpen, setTokenOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const { push } = useRouter()
  const { account } = useWallet()
  const [pair, setPair] = useState(null)
  const [asset, setAsset] = useState(null)
  const mutateAssets = useMutateAssets()
  const poolsWithGauge = usePoolsWithGauge()
  const { onBribeAdd, pending } = useBribeAdd()
  const t = useTranslations()

  const updatedPoolsWithGauge = useMemo(
    () =>
      poolsWithGauge
        .filter(pool => !(pool.version === 2 && pool.type === PAIR_TYPES.LSD))
        .map(item => ({
          ...item,
          title: item?.title === 'CL_Farming' ? 'Conc. Liquidity' : item?.title,
        })),
    [poolsWithGauge],
  )

  const topPools = useMemo(
    () =>
      updatedPoolsWithGauge.sort((a, b) => a.gauge.bribeUsd.minus(b.gauge.bribeUsd).times(-1).toNumber()).slice(0, 4),
    [updatedPoolsWithGauge],
  )

  const errorMsg = useMemo(() => {
    if (!pair) {
      return 'Select Pair'
    }
    if (!asset) {
      return 'Select Asset'
    }
    if (asset.address === 'BNB') {
      return 'BNB not available'
    }
    if (isInvalidAmount(amount)) {
      return 'Invalid Amount'
    }
    if (asset?.balance?.lt(amount)) {
      return 'Insufficient Balance'
    }
    return null
  }, [pair, asset, amount])

  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col gap-4'>
        <TextButton className='w-fit' LeadingIcon={ArrowLeftIcon} onClick={() => push('/protocols')}>
          {t('Back')}
        </TextButton>
        <h2>{t('Voting Incentive')}</h2>
      </div>
      <div className='flex flex-col gap-4'>
        <TextHeading className='text-xl'>{t('Top Incentives')}</TextHeading>
        <div className='grid grid-cols-1 gap-2 lg:grid-cols-4 lg:gap-8 '>
          {topPools.map(pool => (
            <Box className='flex items-center justify-between' key={`incentive-${pool.address}`}>
              <div className='flex items-center gap-3'>
                {pool.type === PAIR_TYPES.WEIGHTED ? (
                  <ThreeIconGroup
                    className='-space-x-2'
                    classNames={{
                      image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                    }}
                    logo1={pool?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                    logo2={pool?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                    extendNumber={(pool?.tokens?.length || 2) - 2}
                  />
                ) : (
                  <IconGroup
                    className='-space-x-2'
                    classNames={{
                      image: 'outline-2 w-8 h-8',
                    }}
                    logo1={pool.token0.logoURI}
                    logo2={pool.token1.logoURI}
                  />
                )}
                <div className='flex flex-col'>
                  <TextHeading>{pool.symbol}</TextHeading>
                  <Paragraph className='text-sm'>
                    {(pool.type === PAIR_TYPES.LSD ? pool.type : pool.title) ?? pool.type}
                  </Paragraph>
                </div>
              </div>
              <NeutralBadge isFixed>${formatAmount(pool.gauge.bribeUsd)}</NeutralBadge>
            </Box>
          ))}
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        <TextHeading className='text-xl'>{t('Add Incentive')}</TextHeading>
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <TextHeading>{t('Pair')}</TextHeading>
              <div
                className='flex cursor-pointer items-center justify-between rounded-lg bg-neutral-700 px-4 py-3'
                onClick={() => setPairOpen(!pairOpen)}
              >
                {pair ? (
                  <div className='flex items-center gap-3'>
                    {/* <IconGroup
                      className='-space-x-1'
                      classNames={{
                        image: 'outline-2 w-5 h-5',
                      }}
                      logo1={pair.token0.logoURI}
                      logo2={pair.token1.logoURI}
                    /> */}
                    <div className='flex items-end gap-2'>
                      <TextHeading>{pair.symbol}</TextHeading>
                      <Paragraph className='text-sm'>{t(pair.title)}</Paragraph>
                    </div>
                  </div>
                ) : (
                  <p className='text-neutral-400'>{t('Select Pair')}</p>
                )}
                <ChevronDownIcon
                  className={cn(
                    'transfrom h-5 w-5 transition-all duration-150 ease-out',
                    pairOpen ? 'rotate-180' : 'rotate-0',
                  )}
                />
              </div>
            </div>

            <div className={cn('flex flex-col gap-2', !account && 'hidden')}>
              <TextHeading>{t('Reward Asset')}</TextHeading>
              <div
                className='flex cursor-pointer items-center justify-between rounded-lg bg-neutral-700 px-4 py-3'
                onClick={() => setTokenOpen(!tokenOpen)}
              >
                {asset ? (
                  <div className='flex items-center gap-3'>
                    {/* <CircleImage className='h-5 w-5' src={asset.logoURI} alt='' /> */}
                    <TextHeading>{asset.symbol}</TextHeading>
                  </div>
                ) : (
                  <p className='text-neutral-400'>{t('Select Asset')}</p>
                )}
                <ChevronDownIcon
                  className={cn(
                    'transfrom h-5 w-5 transition-all duration-150 ease-out',
                    pairOpen ? 'rotate-180' : 'rotate-0',
                  )}
                />
              </div>
            </div>

            {asset && <BalanceInput title={t('Asset')} asset={asset} amount={amount} onAmountChange={setAmount} />}

            {account ? (
              <PrimaryButton
                disabled={pending}
                onClick={() => {
                  if (errorMsg) {
                    warnToast(errorMsg)
                    return
                  }
                  onBribeAdd(pair, asset, amount, () => {
                    setAmount('')
                    setPair(null)
                    setAsset(null)
                    mutateAssets()
                  })
                }}
              >
                {t('Confirm Voting Incentive')}
              </PrimaryButton>
            ) : (
              <ConnectButton />
            )}
          </div>
          <Neutral className='flex h-fit flex-col items-start justify-start gap-2'>
            <TextHeading className='text-xl'>{t('What is a Voting Incentive')}</TextHeading>
            <Paragraph>{t('Voting Incentive Description')}</Paragraph>
          </Neutral>
        </div>
      </div>

      <PairModal popup={pairOpen} setPopup={setPairOpen} setSelected={setPair} pools={updatedPoolsWithGauge} />

      <TokenModal
        popup={tokenOpen}
        pair={pair}
        setPopup={setTokenOpen}
        selectedAsset={asset}
        setSelectedAsset={setAsset}
      />
    </div>
  )
}
