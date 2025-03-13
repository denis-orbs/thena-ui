'use client'

import BigNumber from 'bignumber.js'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zeroAddress } from 'viem'

import MenuTab from '@/app/arena/MenuTab'
import InputTokenMemo from '@/app/pools/(add-liquidity)/add-liquidity/InputTokenMemo'
import { PairBasicInfo } from '@/app/pools/(add-liquidity)/add-liquidity/PairBasicInfo'
import { PoolAttributesSection } from '@/app/pools/(add-liquidity)/add-liquidity/PoolAttributesSection'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import CustomTooltip from '@/components/tooltip'
import { NewTextSubHeading } from '@/components/typography'
import { useTokenBalance } from '@/hooks/fusion/Tokens'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { useTokenColor } from '@/hooks/useTokenColor'
import { useWeightedPool, useWeightPoolData } from '@/hooks/weightedPool/useWeigtedPool'
import { warnToast } from '@/lib/notify'
import { cn, fromWei, isInvalidAmount, roundIfMoreThanDecimals } from '@/lib/utils'
import { InfoNeutralIcon } from '@/svgs'

import LiquidityPoolInfo from './LiquidityPoolInfo'
import SettingSlippageDropDown from '../Position/SettingSlippageDropDown'

const DEPOSIT_TYPE = {
  SINGLE: 'single',
  ALL: 'all',
}

function AddLiquidityWeighted({ pool }) {
  const t = useTranslations()
  const { getValueTokenAmountToUSD } = useTokenUSDValue()
  const [depositType, setDepositType] = useState(DEPOSIT_TYPE.ALL)
  const [slippage, setSlippage] = useState(0.5)
  const [amountDeposit, setAmountDeposit] = useState('')
  // const { balance: poolBalance, isLoading: loadingPoolBalance } = useWeightPoolData(pool ? pool.address : null)
  // const { gaugeBalance, isLoading: loadingGaugeBalance } = useGaugeBalance(pool ? pool.gauge.address : zeroAddress)

  const router = useRouter()
  const [colors, setColors] = useState([])
  const { renderBackgroundColors } = useTokenColor()

  useEffect(() => {
    renderBackgroundColors(
      (pool?.tokens || []).map(item => item.logoURI.replace('https://cdn.thena.fi/', '/logo-token/')),
    ).then(result => {
      setColors(result)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(pool?.tokens || []).length, renderBackgroundColors])

  const [tokensData, setTokensData] = useState([...(pool?.tokens || [])])

  const [tokenDeposit, setTokenDeposit] = useState(tokensData?.[0])
  const [minBPTAmountOut, setMinBPTAmountOut] = useState('')

  const { mutatePoolBalance } = useWeightPoolData(pool?.address)

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
        minBPT = await calcMinBPTAmountOutSingleToken(pool?.poolId, tokenDeposit, amountDeposit)
      }
    } else if (tokensData?.length && !isInvalidAmount(tokensData[0]?.amount)) {
      minBPT = await calcMinBPTAmountOutAllToken(pool?.poolId, tokensData)
    }
    setMinBPTAmountOut(isInvalidAmount(minBPT) ? '' : fromWei(minBPT))
  }, [
    depositType,
    tokensData,
    amountDeposit,
    calcMinBPTAmountOutSingleToken,
    pool?.poolId,
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
          pool,
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
        await onAddLiquidityAllToken(pool, tokensData, minBPTAmountOut, slippage, amountToWrap, withStake, () => {
          mutatePoolBalance()
        })
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
      pool,
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
      if ((prev || []).length <= 0) return pool?.tokens
      return prev
    })
  }, [pool?.tokens])

  const [showLiquidityInfo, setShowLiquidityInfo] = useState(false)

  return (
    <div className='space-y-4 lg:space-y-8'>
      <div className='flex flex-col gap-1 lg:gap-2'>
        <div className='flex flex-row items-center gap-3.5 lg:gap-4 2xl:gap-8'>
          <GroupIconTokens
            height={60}
            width={60}
            tokens={pool?.tokens || []}
            classNames={{
              images: 'size-6 lg:size-10 2xl:size-[86px]',
            }}
          />
          <NewTextSubHeading>{pool?.symbol}</NewTextSubHeading>
        </div>
        <div className='flex flex-col'>
          <div className='flex flex-row justify-between'>
            <NewTextSubHeading className='text-xl lg:text-2xl 2xl:text-3xl'>{t('Weighted')}</NewTextSubHeading>
            <EmphasisButton
              className={cn(
                'h-8 w-8 p-2 outline-0 hover:bg-neutral-900 lg:hidden',
                showLiquidityInfo ? '!bg-neutral-600' : 'bg-neutral-900',
              )}
              onClick={() => setShowLiquidityInfo(prev => !prev)}
            >
              <InfoNeutralIcon className='size-4' />
            </EmphasisButton>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={showLiquidityInfo ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='overflow-hidden'
          >
            <div className='mt-4 block w-full bg-neutral-900 lg:hidden'>
              <LiquidityPoolInfo pool={pool} colors={colors} isMobile />
            </div>
          </motion.div>
        </div>
      </div>
      <div className='grid gap-4 lg:grid-cols-add-liquidity-layout'>
        <div className='w-full space-y-4 lg:flex-[6] lg:space-y-8'>
          <PairBasicInfo pair={pool} isMobile />

          <div className='space-y-4'>
            <MenuTab className='grid h-8 w-full grid-cols-2 lg:h-11' menuData={toggleDepositType} />
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
          <div className='space-y-8 lg:space-y-16'>
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
                disabled={pool?.gauge?.address === zeroAddress}
                onClick={() => {
                  if (isDisable) {
                    warnToast('Invalid Amount')
                    return false
                  }
                  onAddLiquidity(true)
                }}
                data-tooltip-id={`add-liquidity-stake-${pool?.address}`}
              >
                {t('Deposit & Stake')}
              </PrimaryButton>
              {pool?.gauge?.address === zeroAddress && (
                <CustomTooltip id={`add-liquidity-stake-${pool?.address}`} className='max-w-[500px]'>
                  {t('This pool has no Gauge')}
                </CustomTooltip>
              )}
            </div>
            <EmphasisButton onClick={() => router.back()} className='w-full lg:w-fit'>
              {t('Back')}
            </EmphasisButton>
          </div>
        </div>
        <div className='hidden w-full space-y-4 lg:block lg:flex-[4]'>
          <PoolAttributesSection pair={pool} />
          <LiquidityPoolInfo pool={pool} colors={colors} />
        </div>
      </div>
    </div>
  )
}

export default AddLiquidityWeighted
