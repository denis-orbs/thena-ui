'use client'

import BigNumber from 'bignumber.js'
import { motion } from 'framer-motion'
import { isEmpty } from 'lodash'
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
import { NewTextHeading, NewTextSubHeading } from '@/components/typography'
import { useTokenBalance } from '@/hooks/fusion/Tokens'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { useWindowSize } from '@/hooks/useWindowSize'
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
  const router = useRouter()
  const t = useTranslations()
  const debounceTimeout = useRef(null)
  const windowSize = useWindowSize()
  const { getValueTokenAmountToUSD } = useTokenUSDValue()
  const {
    onAddLiquiditySingleToken,
    onAddLiquidityAllToken,
    calcMinBPTAmountOutSingleToken,
    calcMinBPTAmountOutAllToken,
  } = useWeightedPool()
  const { mutatePoolBalance } = useWeightPoolData(pool?.address)

  const [depositType, setDepositType] = useState(DEPOSIT_TYPE.ALL)
  const [slippage, setSlippage] = useState(0.5)
  const [amountDeposit, setAmountDeposit] = useState('')
  const [tokensData, setTokensData] = useState([])
  const [tokenDeposit, setTokenDeposit] = useState(null)
  const [minBPTAmountOut, setMinBPTAmountOut] = useState('')
  const [showLiquidityInfo, setShowLiquidityInfo] = useState(false)

  const { balance, isDouble } = useTokenBalance(tokenDeposit, true)
  const isLaptop = useMemo(() => windowSize.width > 1024, [windowSize.width])

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

  const amountToWrap = useMemo(() => {
    let final
    if (depositType === DEPOSIT_TYPE.SINGLE) {
      if (
        tokenDeposit?.balance?.lt(amountDeposit) &&
        (tokenDeposit?.symbol === 'BNB' || tokenDeposit?.symbol === 'WBNB')
      ) {
        if (isDouble && balance.lt(amountDeposit)) return final
        final = new BigNumber(amountDeposit).minus(tokenDeposit.balance)
      }
    } else {
      const wBNB = (tokensData || []).find(token => token.symbol === 'BNB' || token.symbol === 'WBNB')
      if (wBNB && wBNB.balance.lt(wBNB.amount)) {
        final = new BigNumber(wBNB.amount).minus(wBNB.balance)
      }
    }
    return final
  }, [amountDeposit, balance, depositType, isDouble, tokenDeposit?.balance, tokenDeposit?.symbol, tokensData])

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

  const calcMinBPT = useCallback(async () => {
    if (pool?.tvlUSD) {
      let minBPT = ''
      if (depositType === DEPOSIT_TYPE.SINGLE) {
        if (!isInvalidAmount(amountDeposit)) {
          minBPT = await calcMinBPTAmountOutSingleToken(pool?.poolId, tokenDeposit, amountDeposit)
        }
      } else if (tokensData?.length && !isInvalidAmount(tokensData[0]?.amount)) {
        minBPT = await calcMinBPTAmountOutAllToken(pool?.poolId, tokensData)
      }
      setMinBPTAmountOut(isInvalidAmount(minBPT) ? '' : fromWei(minBPT))
    }
  }, [
    pool?.tvlUSD,
    pool?.poolId,
    depositType,
    tokensData,
    amountDeposit,
    calcMinBPTAmountOutSingleToken,
    tokenDeposit,
    calcMinBPTAmountOutAllToken,
  ])

  const onAddLiquidity = useCallback(
    async withStake => {
      if (depositType === DEPOSIT_TYPE.SINGLE) {
        if (isInvalidAmount(amountDeposit)) {
          warnToast('Invalid Amount')
          return false
        }
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

  useEffect(() => {
    clearTimeout(debounceTimeout.current)
    debounceTimeout.current = setTimeout(() => {
      calcMinBPT()
    }, 300)
  }, [calcMinBPT])

  useEffect(() => {
    const poolTokens = pool?.tokens || []

    setTokensData(tokens => {
      let result = tokens || []
      if (isEmpty(result) && !isEmpty(poolTokens)) {
        result = poolTokens
      }
      result = result.map((tk, idx) => ({
        ...tk,
        balance: poolTokens[idx]?.balance,
      }))
      return result
    })

    setTokenDeposit(prev => {
      if (!prev) return poolTokens[0]
      return prev
    })
  }, [pool?.tokens])

  return (
    <div className='flex flex-col'>
      <div className='flex flex-col gap-2'>
        <div className='flex flex-row gap-4 lg:gap-8'>
          <GroupIconTokens
            height={!isLaptop ? ((pool?.tokens || []).length > 4 ? 16 : 28) : 40}
            width={!isLaptop ? ((pool?.tokens || []).length > 4 ? 16 : 28) : 40}
            tokens={pool?.tokens || []}
            classNames={{
              images: 'size-6 lg:size-10 xl:size-[64px]',
            }}
          />
          <NewTextHeading
            style={{
              lineHeight: `${!isLaptop ? ((pool?.tokens || []).length > 4 ? 16 : 28) : 40}px`,
              fontSize: `${!isLaptop ? ((pool?.tokens || []).length > 4 ? 16 : 28) : 36}px`,
            }}
            className='text-wrap break-all whitespace-normal'
          >
            {pool?.symbol}
          </NewTextHeading>
        </div>
        <div className='flex flex-col xl:hidden'>
          <div className='flex flex-row items-center justify-between'>
            <NewTextSubHeading>{t('Weighted')}</NewTextSubHeading>
            <EmphasisButton
              className={cn(
                'size-8 p-2 outline-0 hover:bg-neutral-900 md:size-11',
                showLiquidityInfo ? 'bg-neutral-600!' : 'bg-neutral-900',
              )}
              onClick={() => setShowLiquidityInfo(prev => !prev)}
            >
              <InfoNeutralIcon className='size-4 md:size-5' />
            </EmphasisButton>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={showLiquidityInfo ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='overflow-hidden'
          >
            <div className='mt-4 block w-full bg-neutral-900 xl:hidden'>
              <LiquidityPoolInfo pool={pool} isMobile />
            </div>
          </motion.div>
        </div>
      </div>
      <div className='xl:grid-cols-add-liquidity-layout grid gap-4 max-xl:grid-cols-1'>
        <div className='flex w-full flex-col gap-4'>
          <div className='flex h-11 flex-col justify-end max-xl:hidden'>
            <NewTextSubHeading className='text-2xl!'>{t('Weighted')}</NewTextSubHeading>
          </div>

          <div className='flex flex-col gap-2 md:gap-4'>
            <PairBasicInfo pair={pool} isMobile />
            <div className='block xl:hidden'>
              <PoolAttributesSection pair={pool} />
            </div>
          </div>

          <div className='flex flex-col gap-2 md:gap-4'>
            <MenuTab className='grid h-8 w-full grid-cols-2 md:h-11' menuData={toggleDepositType} />
            <SettingSlippageDropDown updateSlippage={setSlippage} slippage={slippage} className='mb-0' />
            {depositType === DEPOSIT_TYPE.ALL && (
              <div
                className={cn(
                  'grid grid-cols-1 gap-2 lg:grid-cols-2',
                  (tokensData || []).length <= 2 && 'xl:grid-cols-2',
                )}
              >
                {(tokensData || []).map((token, idx) => (
                  <InputTokenMemo
                    key={`${token?.address}_${idx}`}
                    token={token}
                    autoFocus={idx === 0}
                    amount={token.amount}
                    onAmountChange={value => handleAmountChange(value, token)}
                    alowDouble
                    weight={token.weight}
                    isSmall
                    showTitle={false}
                  />
                ))}
              </div>
            )}
            {depositType === DEPOSIT_TYPE.SINGLE && (
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
                isInvalidAmount={isInvalidAmount(amountDeposit)}
                isSmall
              />
            )}
          </div>

          <div className='flex flex-col gap-2'>
            <EmphasisButton className='hidden w-full max-xl:block' onClick={() => router.push('/pools')}>
              {t('Cancel')}
            </EmphasisButton>
            {pool?.gauge?.address === zeroAddress ? (
              <PrimaryButton
                className='w-full'
                onClick={() => {
                  if (isDisable) {
                    warnToast('Invalid Amount')
                    return false
                  }
                  onAddLiquidity(false)
                }}
              >
                {t('Deposit')}
              </PrimaryButton>
            ) : (
              <PrimaryButton
                className='w-full'
                disabled={pool?.gauge?.address === zeroAddress}
                onClick={() => {
                  if (isDisable) {
                    warnToast('Invalid Amount')
                    return false
                  }
                  onAddLiquidity(true)
                }}
              >
                {t('Deposit & Stake')}
              </PrimaryButton>
            )}
          </div>
        </div>
        <div className='hidden w-full flex-col gap-4 xl:flex'>
          <PoolAttributesSection pair={pool} />
          <LiquidityPoolInfo pool={pool} />
        </div>
      </div>
    </div>
  )
}

export default AddLiquidityWeighted
