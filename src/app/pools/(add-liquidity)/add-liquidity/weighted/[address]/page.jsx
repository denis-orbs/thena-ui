'use client'

import BigNumber from 'bignumber.js'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zeroAddress } from 'viem'

import MenuTab from '@/app/arena/MenuTab'
import Loading from '@/app/loading'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import Skeleton from '@/components/skeleton'
import CustomTooltip from '@/components/tooltip'
import { NewTextHeading, NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import { usePairs } from '@/context/pairsContext'
import { useTokenBalance } from '@/hooks/fusion/Tokens'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { useTokenColor } from '@/hooks/useTokenColor'
import { useGaugeBalance, useWeightedPool, useWeightPoolData } from '@/hooks/weightedPool/useWeigtedPool'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, fromWei, isInvalidAmount, roundIfMoreThanDecimals, unwrappedSymbol } from '@/lib/utils'
import SettingSlippageDropDown from '@/modules/Position/SettingSlippageDropDown'
import PieChart from '@/modules/WeightedPool/PieChart'

import InputTokenMemo from '../../InputTokenMemo'
import { PairBasicInfo } from '../../PairBasicInfo'
import { PoolAttributesSection } from '../../PoolAttributesSection'

const DEPOSIT_TYPE = {
  SINGLE: 'single',
  ALL: 'all',
}

function AddLiquidityWeightedPoolPage({ params }) {
  const { address } = params
  const router = useRouter()
  const { weightedPools, isLoading } = usePairs()
  const t = useTranslations()
  const { getValueTokenAmountToUSD } = useTokenUSDValue()
  const [depositType, setDepositType] = useState(DEPOSIT_TYPE.ALL)
  const [slippage, setSlippage] = useState(0.5)
  const [amountDeposit, setAmountDeposit] = useState('')

  const toggleDepositType = useMemo(
    () => [
      {
        title: t('Pool Token Deposit'),
        isActive: depositType === DEPOSIT_TYPE.ALL,
        isLink: false,
        onClick: () => setDepositType(DEPOSIT_TYPE.ALL),
      },
      {
        title: t('Single Token Deposit'),
        isActive: depositType === DEPOSIT_TYPE.SINGLE,
        isLink: false,
        onClick: () => setDepositType(DEPOSIT_TYPE.SINGLE),
      },
    ],
    [depositType, t],
  )

  const poolSelected = useMemo(
    () => (weightedPools || []).find(pool => pool.address === address),
    [address, weightedPools],
  )

  const { balance: poolBalance, isLoading: loadingPoolBalance } = useWeightPoolData(
    poolSelected ? poolSelected.address : null,
  )
  const { gaugeBalance, isLoading: loadingGaugeBalance } = useGaugeBalance(
    poolSelected ? poolSelected.gauge.address : zeroAddress,
  )

  const [colors, setColors] = useState([])
  const { renderBackgroundColors } = useTokenColor()

  useEffect(() => {
    renderBackgroundColors(
      (poolSelected?.tokens || []).map(item => item.logoURI.replace('https://cdn.thena.fi/', '/logo-token/')),
    ).then(result => {
      setColors(result)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(poolSelected?.tokens || []).length, renderBackgroundColors])

  const [tokensData, setTokensData] = useState([...(poolSelected?.tokens || [])])

  const [tokenDeposit, setTokenDeposit] = useState(tokensData?.[0])
  const [minBPTAmountOut, setMinBPTAmountOut] = useState('')

  const { mutatePoolBalance } = useWeightPoolData(poolSelected?.address)

  const {
    onAddLiquiditySingleToken,
    onAddLiquidityAllToken,
    calcMinBPTAmountOutSingleToken,
    calcMinBPTAmountOutAllToken,
  } = useWeightedPool()

  const amountToWrap = useMemo(() => {
    let final
    if (depositType === DEPOSIT_TYPE.SINGLE) {
      if (
        tokenDeposit?.balance?.lt(amountDeposit) &&
        (tokenDeposit?.symbol === 'BNB' || tokenDeposit?.symbol === 'WBNB')
      ) {
        final = new BigNumber(amountDeposit).minus(tokenDeposit.balance)
      }
    } else {
      const wBNB = (tokensData || []).find(token => token.symbol === 'BNB' || token.symbol === 'WBNB')
      if (wBNB && wBNB.balance.lt(wBNB.amountDeposit)) {
        final = new BigNumber(wBNB.amountDeposit).minus(wBNB.balance)
      }
    }
    return final
  }, [amountDeposit, depositType, tokenDeposit, tokensData])

  const calcMinBPT = useCallback(async () => {
    let minBPT = ''
    if (depositType === DEPOSIT_TYPE.SINGLE) {
      if (!isInvalidAmount(amountDeposit)) {
        minBPT = await calcMinBPTAmountOutSingleToken(poolSelected?.poolId, tokenDeposit, amountDeposit)
      }
    } else if (tokensData?.length && !isInvalidAmount(tokensData[0]?.amount)) {
      minBPT = await calcMinBPTAmountOutAllToken(poolSelected?.poolId, tokensData)
    }
    setMinBPTAmountOut(isInvalidAmount(minBPT) ? '' : fromWei(minBPT))
  }, [
    depositType,
    tokensData,
    amountDeposit,
    calcMinBPTAmountOutSingleToken,
    poolSelected?.poolId,
    tokenDeposit,
    calcMinBPTAmountOutAllToken,
  ])

  const debounceTimeout = useRef(null)
  useEffect(() => {
    clearTimeout(debounceTimeout.current)
    debounceTimeout.current = setTimeout(() => {
      calcMinBPT()
    }, 300)
  }, [calcMinBPT])

  const onAddLiquidity = useCallback(
    async withStake => {
      if (depositType === DEPOSIT_TYPE.SINGLE) {
        await onAddLiquiditySingleToken(
          poolSelected,
          tokenDeposit,
          amountDeposit,
          minBPTAmountOut,
          slippage,
          amountToWrap,
          withStake,
          () => {
            mutatePoolBalance()
          },
        )
      } else {
        await onAddLiquidityAllToken(
          poolSelected,
          tokensData,
          minBPTAmountOut,
          slippage,
          amountToWrap,
          withStake,
          () => {
            mutatePoolBalance()
          },
        )
      }
    },
    [
      amountDeposit,
      amountToWrap,
      depositType,
      minBPTAmountOut,
      mutatePoolBalance,
      onAddLiquidityAllToken,
      onAddLiquiditySingleToken,
      poolSelected,
      slippage,
      tokenDeposit,
      tokensData,
    ],
  )
  const isDisable = useMemo(() => {
    if (depositType === DEPOSIT_TYPE.SINGLE) {
      if (!tokenDeposit || amountDeposit <= 0) {
        return true
      }
    }

    if (depositType === DEPOSIT_TYPE.ALL) {
      const checkAmountValid = (tokensData || []).every(token => !isInvalidAmount(token.amount))
      if (!checkAmountValid) return true
    }

    return false
  }, [amountDeposit, depositType, tokenDeposit, tokensData])

  const handleAmountChange = useCallback(
    (value, asset) => {
      setTokensData(prev => {
        const updatedTokens = [...prev]
        const changedToken = updatedTokens.find(token => token.address?.toLowerCase() === asset?.address?.toLowerCase())

        if (changedToken) {
          changedToken.amount = roundIfMoreThanDecimals(value, changedToken?.decimals)
          const currentTokenUSDValue = getValueTokenAmountToUSD(changedToken?.address, changedToken?.amount)

          updatedTokens.forEach(item => {
            if (item?.address?.toLowerCase() !== asset?.address?.toLowerCase()) {
              const otherTokenUSDValue = (currentTokenUSDValue / (changedToken.weight / 100)) * (item.weight / 100)
              item.amount = roundIfMoreThanDecimals(otherTokenUSDValue / item.price, item.decimals).toString()
            }
          })
        }

        return updatedTokens
      })
    },
    [getValueTokenAmountToUSD],
  )

  const { balance, isDouble } = useTokenBalance(tokenDeposit, true)

  useEffect(() => {
    setTokensData(prev => {
      if ((prev || []).length <= 0) return poolSelected?.tokens
      return prev
    })
  }, [poolSelected?.tokens])

  if (isLoading) return <Loading />
  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-1 lg:gap-2'>
        <div className='flex flex-row items-center gap-2 lg:gap-4 2xl:gap-8'>
          <GroupIconTokens
            height={60}
            width={60}
            tokens={poolSelected?.tokens || []}
            className={cn('-space-y-5', (poolSelected?.tokens || []).length <= 4 && '-space-y-0')}
            classNames={{
              rows: cn('xl:-space-x-4 2xl:-space-x-5 -space-x-2'),
              images: 'size-6 lg:size-10 2xl:size-[86px]',
            }}
          />
          <NewTextHeading>{poolSelected?.symbol || 'UNKNOWN'}</NewTextHeading>
        </div>
        <NewTextSubHeading className='lg:text-2xl 2xl:text-3xl'>{t('Weighted')}</NewTextSubHeading>
      </div>
      <div className='grid gap-4 lg:grid-cols-add-liquidity-layout'>
        <div className='w-full space-y-8 lg:flex-[6]'>
          <PairBasicInfo pair={poolSelected} />
          <div className='space-y-4'>
            <MenuTab className='grid w-full grid-cols-2' menuData={toggleDepositType} />
            <SettingSlippageDropDown updateSlippage={setSlippage} slippage={slippage} className='mb-0' />
            {depositType === DEPOSIT_TYPE.ALL && (
              <div
                className={cn(
                  'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3',
                  (tokensData || []).length <= 2 && 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-2',
                )}
              >
                {(tokensData || []).map((token, idx) => (
                  <InputTokenMemo
                    key={token?.address}
                    token={token}
                    autoFocus={idx === 0}
                    amount={token.amount}
                    onAmountChange={value => handleAmountChange(value, token)}
                    alowDouble
                    weight={token.weight}
                  />
                ))}
              </div>
            )}
            {depositType === DEPOSIT_TYPE.SINGLE && (
              <div>
                <TokenAmountInput
                  type='number'
                  amount={amountDeposit}
                  setAsset={setTokenDeposit}
                  asset={tokenDeposit}
                  maxBalance={isDouble ? balance : null}
                  autoFocus
                  onAmountChange={setAmountDeposit}
                  assetsSelect={tokensData}
                  showPercent={false}
                />
              </div>
            )}
          </div>
          <div className='space-y-16'>
            <div className='grid gap-4 md:grid-cols-2'>
              <EmphasisButton
                onClick={() => {
                  if (isDisable) {
                    warnToast('Invalid Amount')
                    return false
                  }
                  onAddLiquidity(false)
                }}
              >
                {t('Deposit')}
              </EmphasisButton>
              <PrimaryButton
                disabled={poolSelected?.gauge?.address === zeroAddress}
                onClick={() => {
                  if (isDisable) {
                    warnToast('Invalid Amount')
                    return false
                  }
                  onAddLiquidity(true)
                }}
                data-tooltip-id={`add-liquidity-stake-${poolSelected?.address}`}
              >
                {t('Deposit & Stake')}
              </PrimaryButton>
              {poolSelected?.gauge?.address === zeroAddress && (
                <CustomTooltip id={`add-liquidity-stake-${poolSelected?.address}`} className='max-w-[500px]'>
                  {t('This pool has no Gauge')}
                </CustomTooltip>
              )}
            </div>
            <EmphasisButton onClick={() => router.back()} className='w-full lg:w-fit'>
              {t('Back')}
            </EmphasisButton>
          </div>
        </div>
        <div className='w-full space-y-4 lg:flex-[4]'>
          <PoolAttributesSection pair={poolSelected} />
          <div>
            <PieChart tokens={poolSelected?.tokens || []} colors={colors} />
            <div
              className={cn('mx-auto flex w-fit gap-6', (poolSelected?.tokens || []).length > 4 && 'grid grid-cols-4')}
            >
              {(poolSelected?.tokens || []).map((item, idx) => (
                <div key={`${item?.data?.address}_${idx}`} className='flex flex-row items-center gap-[6px]'>
                  <div className='h-3 w-3 rounded-full' style={{ backgroundColor: colors[idx] }} />
                  <TextHeading>{item?.symbol}</TextHeading>
                </div>
              ))}
            </div>
          </div>
          <Box>
            <div className='flex flex-col gap-4'>
              <TextHeading className='text-lg'>{t('Reserve Info')}</TextHeading>
              <div className='flex flex-col gap-3'>
                {(poolSelected?.tokens || []).map(token => (
                  <div key={token.address} className='flex items-center justify-between'>
                    <Paragraph className='font-medium'>
                      {unwrappedSymbol(token)} {t('Amount')}
                    </Paragraph>
                    <Paragraph>{formatAmount(token.reserve)}</Paragraph>
                  </div>
                ))}
              </div>
            </div>
            <div className='mt-4 flex flex-col gap-4 border-t border-neutral-700 pt-4'>
              <TextHeading className='text-lg'>{t('My Info')}</TextHeading>
              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>{t('Pooled Liquidity')}</Paragraph>
                  {loadingPoolBalance ? (
                    <Skeleton className='h-11 w-20' />
                  ) : (
                    <Paragraph>{formatAmount(poolBalance)} LP</Paragraph>
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <Paragraph className='font-medium'>{t('Staked Liquidity')}</Paragraph>
                  {loadingGaugeBalance ? (
                    <Skeleton className='h-11 w-20' />
                  ) : (
                    <Paragraph>{formatAmount(gaugeBalance)} LP</Paragraph>
                  )}
                </div>
              </div>
            </div>
          </Box>
        </div>
      </div>
    </div>
  )
}

export default AddLiquidityWeightedPoolPage
