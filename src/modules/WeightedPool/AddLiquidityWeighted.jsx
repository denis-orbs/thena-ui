'use client'

import BigNumber from 'bignumber.js'
import { AnimatePresence, motion } from 'framer-motion'
import { isEmpty } from 'lodash'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { zeroAddress } from 'viem'

import InputTokenMemo from '@/app/pools/(add-liquidity)/add-liquidity/InputTokenMemo'
import { PairBasicInfo } from '@/app/pools/(add-liquidity)/add-liquidity/PairBasicInfo'
import { PoolAttributesSection } from '@/app/pools/(add-liquidity)/add-liquidity/PoolAttributesSection'
import SlippageContent from '@/app/pools/(add-liquidity)/add-liquidity/SlippageContent'
import RemoveWeightedModal from '@/app/pools/RemoveWeightedModal'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import GroupIconTokens from '@/components/icongroup/GroupIconTokens'
import CircleImage from '@/components/image/CircleImage'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import Selection from '@/components/selection'
import { NewTextHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { useTokenBalance } from '@/hooks/fusion/Tokens'
import { useWeightedPositions } from '@/hooks/position/useWeightedPosition'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { useWindowSize } from '@/hooks/useWindowSize'
import {
  useClaimWeightedPoolFees,
  useGaugeBalance,
  useGaugeHarvestWeighted,
  useGaugeStakeWeighted,
  useGaugeUnstakeWeighted,
  useWeightedPool,
  useWeightedPositionList,
  useWeightPoolData,
} from '@/hooks/weightedPool/useWeigtedPool'
import { warnToast } from '@/lib/notify'
import { cn, formatAmount, fromWei, isInvalidAmount, roundIfMoreThanDecimals } from '@/lib/utils'
import { InfoIcon, SettingsIcon } from '@/svgs'

import LiquidityPoolInfo from './LiquidityPoolInfo'
import GaugeWeightedManageModal from '../Position/GaugeWeightedManageModal'

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

  const weightedPositionList = useWeightedPositionList()
  const userPositions = useWeightedPositions(weightedPositionList)
  const position = useMemo(() => {
    if (userPositions.length === 0) return null
    const findPosition = userPositions.filter(item => item.address.toLowerCase() === pool?.address.toLowerCase())
    if (!findPosition.length) return null
    return findPosition[0]
  }, [pool?.address, userPositions])

  const [depositType, setDepositType] = useState(DEPOSIT_TYPE.ALL)
  const [slippage, setSlippage] = useState(0.5)
  const [amountDeposit, setAmountDeposit] = useState('')
  const [tokensData, setTokensData] = useState([])
  const [tokenDeposit, setTokenDeposit] = useState(null)
  const [minBPTAmountOut, setMinBPTAmountOut] = useState('')
  const [showSlippage, setShowSlippage] = useState(false)
  const [popupStake, setPopupStake] = useState(false)
  const [isOpenRemove, setIsOpenRemove] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const { onGaugeStake, pending: stakePending } = useGaugeStakeWeighted()
  const { onClaimFees, pending: pendingClaimFees } = useClaimWeightedPoolFees()
  const { onGaugeHarvest, pending: pendingHarvest } = useGaugeHarvestWeighted()
  const { gaugeBalance } = useGaugeBalance(position?.gauge?.address)
  const { onGaugeUnstake, pending: unstakePending } = useGaugeUnstakeWeighted(gaugeBalance)

  const { balance, isDouble } = useTokenBalance(tokenDeposit, true)
  const isLaptop = useMemo(() => windowSize.width > 1024, [windowSize.width])
  const { isLgDown } = useMediaQuery()

  const toggleDepositType = useMemo(
    () => [
      {
        label: t('Pool Token Deposit'),
        active: depositType === DEPOSIT_TYPE.ALL,
        onClickHandler: () => setDepositType(DEPOSIT_TYPE.ALL),
      },
      {
        label: t('Single Token Deposit'),
        active: depositType === DEPOSIT_TYPE.SINGLE,
        onClickHandler: () => setDepositType(DEPOSIT_TYPE.SINGLE),
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

  const { claimableFee, depositValue, isStake } = position || {}
  const tokensDeposit = depositValue?.tokens || []
  const getTokenDisplayName = useCallback(
    token => (token?.name === 'Wrapped BNB' ? 'WBNB' : token?.symbol || 'UNKNOWN'),
    [],
  )

  const onClaim = useCallback(
    () =>
      onClaimFees(position, () => {
        // mutatePosition()
      }),
    [onClaimFees, position],
  )

  const ButtonsDisplay = useMemo(() => {
    if (!position) return null

    return (
      <div className='grid w-full grid-cols-3 justify-center gap-2'>
        <EmphasisButton onClick={() => setIsOpenRemove(true)}>{t('Withdraw')}</EmphasisButton>
        {position.isStake ? (
          <>
            <EmphasisButton
              className='flex-1'
              disabled={pendingHarvest || isInvalidAmount(claimableFee?.total)}
              onClick={() => onGaugeHarvest(position)}
            >
              {t('Claim')}
            </EmphasisButton>
            <EmphasisButton disabled={unstakePending} className='flex-1' onClick={() => setPopupStake(true)}>
              {t('Unstake')}
            </EmphasisButton>
          </>
        ) : (
          <>
            <EmphasisButton
              disabled={pendingClaimFees || isInvalidAmount(claimableFee?.total)}
              onClick={onClaim}
              className='h-11 flex-1'
            >
              {t('Claim')}
            </EmphasisButton>

            {position.gauge?.address !== zeroAddress && (
              <PrimaryButton
                disabled={stakePending}
                className='h-11 flex-1'
                onClick={() => setPopupStake(true)}
                data-tooltip-id={`stake-position-${position?.address}`}
              >
                {t('Stake')}
              </PrimaryButton>
            )}
          </>
        )}
      </div>
    )
  }, [
    claimableFee?.total,
    onClaim,
    onGaugeHarvest,
    pendingClaimFees,
    pendingHarvest,
    position,
    stakePending,
    unstakePending,
    t,
  ])

  return (
    <div className='flex flex-col gap-4 xl:gap-8'>
      <div className={cn('grid gap-2 xl:gap-8', position ? 'xl:grid-cols-[483px_1fr]' : 'xl:grid-cols-[1fr_500px]')}>
        <div className='flex flex-col gap-2'>
          <div className='flex flex-row gap-4 xl:gap-8'>
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
          <div className='flex flex-col gap-2'>
            <div className='flex flex-row justify-between'>
              <TextSubHeading className='text-lg font-medium text-neutral-50 lg:text-xl xl:text-2xl'>
                {t('Weighted')}
              </TextSubHeading>
              <div className='flex items-center xl:hidden'>
                <i
                  onClick={() => setShowInfo(!showInfo)}
                  className={cn(
                    'flex cursor-pointer items-center justify-center rounded-lg',
                    'size-8 min-w-8 md:size-11 md:min-w-11',
                    showInfo ? 'bg-neutral-600' : 'bg-neutral-900',
                  )}
                >
                  <InfoIcon className='size-4 stroke-neutral-400 md:size-5' />
                </i>
              </div>
            </div>
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeInOut',
                    height: { duration: 0.4 },
                  }}
                  className='overflow-hidden'
                >
                  <LiquidityPoolInfo pool={pool} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className='mt-auto'>
            <PoolAttributesSection className='w-full' pair={pool} />
          </div>
        </div>

        {position && (
          <div className='flex flex-col'>
            <article
              className={cn(
                'bg-chart-gradient flex flex-col items-start gap-4 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-4 font-medium xl:px-6',
              )}
            >
              <div className='flex w-full flex-col justify-between max-xl:gap-2 xl:flex-row xl:items-center'>
                <div className='flex flex-row justify-between gap-4'>
                  <div className='flex flex-col justify-between gap-2'>
                    <TextHeading className='font-archia !text-xl !leading-6 xl:font-semibold'>
                      {t('Your Position')}
                    </TextHeading>
                    <Paragraph className='text-sm! font-normal! text-neutral-500'>
                      ${formatAmount(depositValue?.depositUsd)}
                    </Paragraph>
                  </div>
                  <div className='flex flex-col justify-between gap-2 xl:hidden'>
                    <Paragraph className='font-archia text-primary-600 text-xl! font-semibold'>
                      {formatAmount(position.apr)}%
                    </Paragraph>
                    <Paragraph className='text-sm! font-medium text-nowrap text-neutral-500'>{t('APR')}</Paragraph>
                  </div>
                </div>
                <div className='flex w-fit gap-2 max-xl:hidden'>{ButtonsDisplay}</div>
              </div>
              <div className='flex w-full flex-row flex-wrap gap-4 xl:gap-6'>
                {tokensDeposit.length > 0 &&
                  tokensDeposit.map(token => (
                    <div key={token.address} className='flex h-12 flex-1 flex-col gap-1 xl:justify-start'>
                      <div className='flex items-center gap-2'>
                        <CircleImage className='size-5' src={token.logoURI ?? UNKNOWN_LOGO} alt='base token' />
                        <Paragraph className='text-primary-50 font-archia text-xl! font-semibold'>
                          {formatAmount(fromWei(token.amount))}
                        </Paragraph>
                      </div>
                      <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 xl:text-sm'>
                        {t('[symbol] deposit [percent]', {
                          symbol: getTokenDisplayName(token),
                          percent: formatAmount(
                            fromWei(token.amount).times(token.price).div(depositValue.depositUsd) * 100,
                          ),
                        })}
                      </Paragraph>
                    </div>
                  ))}
                <div className='flex h-12 flex-1 flex-col gap-1'>
                  {claimableFee.tokenList.length > 0 &&
                    claimableFee.tokenList.map(token => (
                      <div className='flex items-center gap-2'>
                        <CircleImage className='size-5' src={token.logoURI ?? UNKNOWN_LOGO} alt='base token' />
                        <Paragraph className='text-primary-50 font-archia text-xl! font-semibold'>
                          {formatAmount(token.fee)}
                        </Paragraph>
                      </div>
                    ))}
                  <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 xl:text-sm'>
                    {t('Rewards')}
                  </Paragraph>
                </div>
                <div className='flex h-12 flex-1 flex-col gap-1 max-xl:hidden'>
                  <Paragraph className='font-archia text-primary-600 text-xl! font-semibold'>
                    {formatAmount(position.apr)}%
                  </Paragraph>
                  <Paragraph className='text-xs font-medium text-nowrap text-neutral-500 xl:text-sm'>
                    {t('APR')}
                  </Paragraph>
                </div>
              </div>
              <div className='flex w-full gap-2 xl:hidden'>{ButtonsDisplay}</div>
            </article>
          </div>
        )}
      </div>
      <div className='grid grid-cols-1 gap-4 xl:grid-cols-[1fr_500px] xl:gap-8'>
        <div className='flex flex-col gap-4'>
          <div className='flex w-full flex-col gap-4'>
            <div className='flex flex-col gap-2 md:gap-4'>
              <PairBasicInfo pair={pool} isMobile />
            </div>
          </div>
          <div className='hidden w-full flex-col gap-4 xl:flex'>
            <LiquidityPoolInfo pool={pool} />
          </div>
        </div>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col gap-2 md:gap-4'>
            <div className='flex w-full flex-col gap-2'>
              <div className='flex justify-between gap-2'>
                <Selection
                  className='h-8 w-full flex-1 items-stretch lg:h-11'
                  classNames={{
                    items: 'md:text-sm text-xs',
                  }}
                  data={toggleDepositType}
                  isFull
                  isTranslation={false}
                  isSmall={isLgDown}
                />
                <EmphasisIconButton
                  className='size-8 lg:size-11'
                  classNames='size-4 stroke-neutral-400'
                  Icon={SettingsIcon}
                  onClick={() => setShowSlippage(prev => !prev)}
                  disabled={false}
                />
              </div>
              <SlippageContent setSlippage={setSlippage} slippage={slippage} show={showSlippage} />
            </div>
            {depositType === DEPOSIT_TYPE.ALL && (
              <div
                className={cn(
                  'grid grid-cols-1 gap-2 xl:grid-cols-2',
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
      </div>
      <GaugeWeightedManageModal
        title={!isStake ? 'Stake LP' : 'Unstake LP'}
        onGaugeManage={!isStake ? onGaugeStake : onGaugeUnstake}
        pending={false}
        pool={position}
        popup={popupStake}
        setPopup={setPopupStake}
        label={!isStake ? 'Stake' : 'Unstake'}
        isStake={isStake}
      />
      <RemoveWeightedModal isOpen={isOpenRemove} pool={position} setIsOpen={setIsOpenRemove} />
    </div>
  )
}

export default AddLiquidityWeighted
