'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import { zeroAddress } from 'viem'

import { Neutral } from '@/components/alert'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import BalanceInput from '@/components/input/BalanceInput'
import { Paragraph, TextHeading } from '@/components/typography'
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
  const { open } = useWeb3Modal()
  const pools = usePools()
  const poolsWithGauge = useMemo(() => pools.filter(pool => pool && pool.gauge.address !== zeroAddress), [pools])
  const { onBribeAdd, pending } = useBribeAdd()

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
      return 'Invalid amount'
    }
    if (asset.balance.lt(amount)) {
      return 'Insufficient balance'
    }
    return null
  }, [pair, asset, amount])

  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col gap-4'>
        <TextButton className='w-fit' LeadingIcon={ArrowLeftIcon} onClick={() => push('/protocols')}>
          Back
        </TextButton>
        <h2>Voting Incentive</h2>
      </div>
      <div className='flex flex-col gap-4'>
        <TextHeading className='text-xl'>Top incentives</TextHeading>
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
        <TextHeading className='text-xl'>Add Incentive</TextHeading>
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <TextHeading>Pair</TextHeading>
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
                      <Paragraph className='text-sm'>{pair.title}</Paragraph>
                    </div>
                  </div>
                ) : (
                  <p className='text-neutral-400'>Select Pair</p>
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
              <TextHeading>Reward Asset</TextHeading>
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
                  <p className='text-neutral-400'>Select Asset</p>
                )}
                <ChevronDownIcon
                  className={cn(
                    'transfrom h-5 w-5 transition-all duration-150 ease-out',
                    pairOpen ? 'rotate-180' : 'rotate-0',
                  )}
                />
              </div>
            </div>
            {asset && <BalanceInput title='Asset' asset={asset} amount={amount} onAmountChange={setAmount} />}

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
                  })
                }}
              >
                Confirm Voting Incentive
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => open()}>Connect Wallet</PrimaryButton>
            )}
          </div>
          <Neutral className='flex h-fit flex-col items-start justify-start gap-2'>
            <TextHeading className='text-xl'>What is a voting incentive?</TextHeading>
            <Paragraph>
              To encourage votes towards specific pools, protocols or projects may deposit additional rewards or
              incentives into those pools' gauges. These incentives are designed to attract more voting power by
              offering token holders higher potential returns for their votes. Essentially, the more voting power a
              gauge receives, the more THE emissions are allocated to the liquidity pool.
            </Paragraph>
          </Neutral>
        </div>
      </div>
      <PairModal popup={pairOpen} setPopup={setPairOpen} setSelected={setPair} pools={poolsWithGauge} />
      <TokenModal popup={tokenOpen} setPopup={setTokenOpen} selectedAsset={asset} setSelectedAsset={setAsset} />
    </div>
  )
}
