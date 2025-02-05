'use client'

import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { Neutral } from '@/components/alert'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import CheckBox from '@/components/checkbox'
import IconGroup from '@/components/icongroup'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useMutateAssets } from '@/context/assetsContext'
import { useBribeAdd } from '@/hooks/useProtocols'
import useWallet from '@/hooks/useWallet'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount } from '@/lib/utils'
import PairModal from '@/modules/PairModal'
import { usePoolsWithGauge } from '@/state/pools/hooks'
import { ArrowLeftIcon, ChevronDownIcon, InfoIcon } from '@/svgs'

import { TokenModal } from './TokenModal'

function calculateEpochPeriod(epochNumber) {
  const epoch5 = 1675900800
  const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60

  const epochDifference = epochNumber - 5
  const startTimestamp = epoch5 + epochDifference * ONE_WEEK_IN_SECONDS
  const endTimestamp = startTimestamp + ONE_WEEK_IN_SECONDS

  return {
    startDate: dayjs.unix(startTimestamp),
    endDate: dayjs.unix(endTimestamp),
  }
}

export default function IncentivePage() {
  const curTime = new Date().getTime() / 1000
  const epoch5 = 1675900800
  const currentEpoch = Math.floor((curTime - epoch5) / 604800) + 5

  const [pairOpen, setPairOpen] = useState(false)
  const [tokenOpen, setTokenOpen] = useState(false)
  const [isConfirmState, setIsConfirmState] = useState(false)
  const [amounts, setAmounts] = useState({})
  const total = Object.values(amounts).reduce((sum, curr) => sum + Number(curr), 0)
  const { push } = useRouter()
  const { account } = useWallet()
  const [isFixedAmount, setIsFixedAmount] = useState(false)
  const [pair, setPair] = useState(null)
  const [asset, setAsset] = useState(null)
  const [epochs, setEpochs] = useState(1)
  const mutateAssets = useMutateAssets()
  const poolsWithGauge = usePoolsWithGauge()
  const { onBribeAdd, pending } = useBribeAdd()
  const t = useTranslations()

  const updatedPoolsWithGauge = useMemo(
    () =>
      poolsWithGauge
        .filter(pool => pool.gauge.isAlive && pool.version === 3)
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
    if (asset?.balance?.lt(total)) {
      return 'Insufficient Balance'
    }
    return null
  }, [pair, asset, total])

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

      <Neutral className='hidden h-fit flex-col items-start justify-start gap-2 md:flex'>
        <TextHeading className='text-xl'>{t('What is a Voting Incentive')}</TextHeading>
        <Paragraph>{t('Voting Incentive Description')}</Paragraph>
      </Neutral>

      <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
        <div className={cn('rounded-xl bg-neutral-900 p-5', isConfirmState && 'hidden')}>
          <TextHeading className='text-xl'>{t('Add Incentive')}</TextHeading>

          <div className='flex flex-col gap-4 pt-8'>
            <div className='flex flex-col gap-2'>
              <TextHeading>{t('Pair')}</TextHeading>
              <div
                className='flex cursor-pointer items-center justify-between rounded-lg bg-neutral-700 px-4 py-3'
                onClick={() => setPairOpen(!pairOpen)}
              >
                {pair ? (
                  <div className='flex items-center gap-3'>
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
              <TextHeading className='flex justify-between'>
                {t('Reward Token')}
                <Paragraph className={cn(!asset && 'hidden')}>
                  {t('Balance')}: {formatAmount(asset?.balance)}
                </Paragraph>
              </TextHeading>
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

            <div className={cn('space-y-2', !asset && 'hidden')}>
              <TextHeading className='flex items-center gap-1'>
                {t('Number of Epochs')}{' '}
                <InfoIcon className='ml-1 h-4 w-4 stroke-neutral-400' data-tooltip-id='NUMBER_OF_EPOCHS' />
                <CustomTooltip id='NUMBER_OF_EPOCHS' className='max-w-[320px]'>
                  Number of epochs is the number of times that the bribe is distributed
                </CustomTooltip>
              </TextHeading>
              <Input
                type='number'
                val={epochs}
                onChange={e => {
                  const num = e.target.value
                  if (Number(num >= 52)) return setEpochs(52)
                  setEpochs(num)
                }}
              />
            </div>

            <label className={cn('mb-6 flex items-center gap-2', epochs <= 1 && 'hidden')}>
              <CheckBox
                className={cn(!isFixedAmount && 'bg-neutral-700')}
                checked={isFixedAmount}
                setChecked={setIsFixedAmount}
              />
              <span>{t('Fixed amount per epoch')}</span>
            </label>

            {Array.from({ length: epochs }, (_, i) => {
              const { startDate, endDate } = calculateEpochPeriod(currentEpoch + i)

              return (
                <div className={cn('hidden space-y-2', asset && 'block')} key={`incentive-${i + 1}`}>
                  <TextHeading className='space-x-3'>
                    <span>{`Epoch ${currentEpoch + i} Reward`}</span>
                    <Paragraph>
                      {startDate.format('MMM D')} - {endDate.format('MMM D, YYYY')}
                    </Paragraph>
                  </TextHeading>

                  <div className='relative'>
                    <Input
                      type='number'
                      val={amounts[i]}
                      onChange={e => {
                        if (isFixedAmount) {
                          const newObject = {}
                          for (let index = 0; index < epochs; index++) {
                            newObject[index] = e.target.value
                          }
                          setAmounts(newObject)
                        } else {
                          setAmounts(prev => ({ ...prev, [i]: e.target.value }))
                        }
                      }}
                    />
                    <div
                      className={cn(
                        'flex items-center justify-center gap-2',
                        'absolute right-4 top-1/2 -translate-y-1/2',
                      )}
                    >
                      <Paragraph>${formatAmount(amounts[i] * (asset?.price || 0))}</Paragraph>
                      <CircleImage alt='thena' className='h-6 w-6' src={asset?.logoURI ?? ''} />
                      <TextHeading>{asset?.symbol}</TextHeading>
                    </div>
                  </div>
                </div>
              )
            })}

            <div className={cn('my-3 hidden justify-between', total > 0 && 'flex')}>
              <TextHeading>{t('Total Deposit')}</TextHeading>
              <article className='flex items-center justify-center gap-2'>
                <Paragraph>${formatAmount(total * (asset?.price || 0))}</Paragraph> =
                <TextHeading>
                  {total} {asset?.symbol}
                </TextHeading>{' '}
              </article>
            </div>

            <PrimaryButton className={cn(total <= 0 && 'hidden')} onClick={() => setIsConfirmState(true)}>
              Preview
            </PrimaryButton>
          </div>
        </div>

        <div className={cn('rounded-xl bg-neutral-900 p-5', !isConfirmState && 'hidden')}>
          <TextHeading className='mb-8 flex items-center text-xl'>
            <TextButton className='w-fit' LeadingIcon={ArrowLeftIcon} onClick={() => setIsConfirmState(false)} />
            Confirm Incentive
          </TextHeading>

          {pair && (
            <article className='mb-5 flex items-center justify-between border-b border-neutral-700 pb-5'>
              <TextHeading className='block'>Pair</TextHeading>
              <div className='mt-2 flex items-center gap-3'>
                {pair.type === PAIR_TYPES.WEIGHTED ? (
                  <ThreeIconGroup
                    className='-space-x-2'
                    classNames={{
                      image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                    }}
                    logo1={pair?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                    logo2={pair?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                    extendNumber={(pair?.tokens?.length || 2) - 2}
                  />
                ) : (
                  <IconGroup
                    className='-space-x-2'
                    classNames={{
                      image: 'outline-2 w-5 h-5',
                    }}
                    logo1={pair.token0.logoURI}
                    logo2={pair.token1.logoURI}
                  />
                )}
                <div className='flex items-end gap-2'>
                  <TextHeading>{pair.symbol}</TextHeading>
                  <Paragraph className='text-sm'>{t(pair.title)}</Paragraph>
                </div>
              </div>
            </article>
          )}

          <article className='mb-5 flex items-center justify-between border-b border-neutral-700 pb-5'>
            <TextHeading>Rewards Token</TextHeading>
            <TextHeading className='flex items-center gap-2'>
              <CircleImage alt='thena' className='size-5' src={asset?.logoURI ?? ''} />
              <TextHeading>{asset?.symbol}</TextHeading>
            </TextHeading>
          </article>

          <article className={cn('mb-5 space-y-5 border-b border-neutral-700 pb-5', !asset && 'hidden')}>
            <TextHeading className='font-bold'>Epochs and Rewards</TextHeading>

            {Array.from({ length: epochs }, (_, i) => {
              const { startDate, endDate } = calculateEpochPeriod(currentEpoch + i)
              return (
                <div className='flex flex-col justify-between gap-4 border-b border-neutral-700 pb-5 md:flex-row md:border-none md:pb-0'>
                  <TextHeading className='flex justify-between gap-3 md:justify-start'>
                    <p className='flex flex-col gap-2 md:flex-row'>
                      <TextHeading>Epoch</TextHeading>
                      {currentEpoch + i}
                    </p>
                    <p className='flex flex-col gap-2 md:flex-row'>
                      <TextHeading className='md:hidden'>Duration</TextHeading>
                      <Paragraph>
                        {startDate.format('MMM D')} - {endDate.format('MMM D, YYYY')}
                      </Paragraph>
                    </p>
                  </TextHeading>

                  <TextHeading className='flex flex-col gap-3 md:flex-row'>
                    <TextHeading className='md:hidden'>Your deposit:</TextHeading>
                    <Paragraph>
                      ${formatAmount(amounts[i] * (asset?.price || 0))} -{' '}
                      <span className='text-neutral-50'>
                        {formatAmount(amounts[i])} {asset?.symbol}
                      </span>
                    </Paragraph>
                  </TextHeading>
                </div>
              )
            })}
          </article>

          <article className={cn('my-3 hidden justify-between', total > 0 && 'flex')}>
            <TextHeading>{t('Total Deposit')}</TextHeading>
            <article className='flex items-center justify-center gap-2'>
              <Paragraph>${formatAmount(total * (asset?.price || 0))}</Paragraph> -
              <TextHeading>
                {total} {asset?.symbol}
              </TextHeading>{' '}
            </article>
          </article>

          <article
            className={cn(
              'mt-5 flex flex-row items-center gap-2 rounded-xl border border-primary-800 bg-primary-950 p-4',
            )}
          >
            <InfoIcon className='size-5 stroke-primary-600' />
            <TextHeading>You can’t retrieve or cancel incentives after depositing.</TextHeading>
          </article>

          <PrimaryButton
            className='mt-5 w-full'
            disabled={pending}
            onClick={() => {
              if (errorMsg) {
                warnToast(errorMsg)
                return
              }
              onBribeAdd(pair, asset, amounts, () => {
                setAmounts({})
                setEpochs(1)
                setIsConfirmState(false)
                setPair(null)
                setAsset(null)
                mutateAssets()
              })
            }}
          >
            {t('Confirm Voting Incentive')}
          </PrimaryButton>
        </div>

        <div className='rounded-xl bg-neutral-900 p-5'>
          <TextHeading className='mb-2 block text-xl'>{t('Total Incentives')}</TextHeading>
          <Paragraph className={cn('mb-5 block border-b border-neutral-700 pb-5 text-sm')}>
            Select a pair to view the total rewards deposited.
          </Paragraph>

          {pair && (
            <article className='mb-6 border-b border-neutral-700 pb-5'>
              <TextHeading className='block'>Selected Pair</TextHeading>
              <div className='mt-2 flex items-center gap-3'>
                {pair.type === PAIR_TYPES.WEIGHTED ? (
                  <ThreeIconGroup
                    className='-space-x-2'
                    classNames={{
                      image: 'size-7 text-xl font-medium leading-5 text-[#1C2027]',
                    }}
                    logo1={pair?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                    logo2={pair?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                    extendNumber={(pair?.tokens?.length || 2) - 2}
                  />
                ) : (
                  <IconGroup
                    className='-space-x-2'
                    classNames={{
                      image: 'outline-2 size-6',
                    }}
                    logo1={pair.token0.logoURI}
                    logo2={pair.token1.logoURI}
                  />
                )}
                <div className='flex items-end gap-2'>
                  <TextHeading>{pair.symbol}</TextHeading>
                  <Paragraph className='text-sm'>{t(pair.title)}</Paragraph>
                </div>
              </div>
            </article>
          )}

          <article className={cn('space-y-5', !asset && 'hidden')}>
            <div className='hidden grid-cols-5 md:grid'>
              <TextHeading className='col-span-1'>Epoch</TextHeading>
              <TextHeading className='col-span-2'>Duration</TextHeading>
              <TextHeading className='col-span-2'>Rewards deposited</TextHeading>
            </div>
            {Array.from({ length: epochs }, (_, i) => {
              const { startDate, endDate } = calculateEpochPeriod(currentEpoch + i)
              return (
                <div className='grid grid-cols-5 gap-y-4 border-b border-neutral-700 pb-5 md:flex-row md:border-none md:pb-0'>
                  <Paragraph className='col-span-2 flex flex-col md:col-span-1'>
                    <TextHeading className='mb-1 md:hidden'>Epoch</TextHeading>
                    {currentEpoch + i}
                  </Paragraph>
                  <Paragraph className='col-span-3 flex flex-col md:col-span-2'>
                    <TextHeading className='mb-1 md:hidden'>Duration</TextHeading>
                    {startDate.format('MMM D')} - {endDate.format('MMM D, YYYY')}
                  </Paragraph>
                  <Paragraph className='col-span-5 flex flex-col md:col-span-2'>
                    <TextHeading className='mb-1 md:hidden'>Rewards Deposited</TextHeading>
                    <span>${formatAmount(amounts[i] * (asset?.price || 0))}</span>
                  </Paragraph>
                </div>
              )
            })}
          </article>
        </div>
      </div>

      <Neutral className='flex  h-fit flex-col items-start justify-start gap-2 md:hidden'>
        <TextHeading className='text-xl'>{t('What is a Voting Incentive')}</TextHeading>
        <Paragraph>{t('Voting Incentive Description')}</Paragraph>
      </Neutral>

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
