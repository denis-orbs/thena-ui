'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import { Neutral } from '@/components/alert'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import ConnectButton from '@/components/buttons/ConnectButton'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import BalanceInput from '@/components/input/BalanceInput'
import { Paragraph, TextHeading } from '@/components/typography'
import { useMutateAssets } from '@/context/assetsContext'
import { useBribeAdd } from '@/hooks/useProtocols'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, isInvalidAmount } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import PairModal from '@/modules/PairModal'
import TokenModal from '@/modules/TokenModal'
import { usePools } from '@/state/pools/hooks'
import { ArrowLeftIcon, ChevronDownIcon } from '@/svgs'

export default function IncentivePage() {
  const [pairOpen, setPairOpen] = useState(false)
  const [tokenOpen, setTokenOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const { push } = useRouter()
  const { account } = useWallet()
  const [pair, setPair] = useState(null)
  const [asset, setAsset] = useState(null)
  const mutateAssets = useMutateAssets()
  const pools = usePools()
  const poolsWithGauge = useMemo(() => pools.filter(pool => pool && pool.gauge.address !== zeroAddress), [pools])
  const { onBribeAdd, pending } = useBribeAdd()
  const t = useTranslations()

  const topPools = useMemo(
    () => pools.sort((a, b) => a.gauge.bribeUsd.minus(b.gauge.bribeUsd).times(-1).toNumber()).slice(0, 4),
    [pools],
  )

  const errorMsg = useMemo(() => {
    if (!pair) {
      return 'Select pair'
    }
    if (!asset) {
      return 'Select reward token'
    }
    if (asset.address === 'BNB') {
      return 'BNB not available'
    }
    if (isInvalidAmount(amount)) {
      return 'Invalid Amount'
    }
    if (asset.balance.lt(amount)) {
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
                <IconGroup
                  className='-space-x-3'
                  classNames={{
                    image: 'outline-4 w-10 h-10',
                  }}
                  logo1={pool.token0.logoURI}
                  logo2={pool.token1.logoURI}
                />
                <div className='flex flex-col'>
                  <TextHeading>{pool.symbol}</TextHeading>
                  <Paragraph className='text-sm'>{pool.title}</Paragraph>
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
                    <IconGroup
                      className='-space-x-1'
                      classNames={{
                        image: 'outline-2 w-5 h-5',
                      }}
                      logo1={pair.token0.logoURI}
                      logo2={pair.token1.logoURI}
                    />
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
            <div className='flex flex-col gap-2'>
              <TextHeading>{t('Reward Asset')}</TextHeading>
              <div
                className='flex cursor-pointer items-center justify-between rounded-lg bg-neutral-700 px-4 py-3'
                onClick={() => setTokenOpen(!tokenOpen)}
              >
                {asset ? (
                  <div className='flex items-center gap-3'>
                    <CircleImage className='h-5 w-5' src={asset.logoURI} alt='' />
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
      <PairModal popup={pairOpen} setPopup={setPairOpen} setSelected={setPair} pools={poolsWithGauge} />
      <TokenModal popup={tokenOpen} setPopup={setTokenOpen} selectedAsset={asset} setSelectedAsset={setAsset} />
    </div>
  )
}
