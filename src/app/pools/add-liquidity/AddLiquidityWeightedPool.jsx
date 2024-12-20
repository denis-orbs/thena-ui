import BigNumber from 'bignumber.js'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import MenuTab from '@/app/arena/rankings/MenuTab'
import SuccessModal from '@/app/arena/thena-id/SuccessModal'
import { NeutralBadge } from '@/components/badges/Badge'
import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import InputManyToken from '@/components/input/InputManyToken'
import TokenInput from '@/components/input/TokenInput'
import Tabs from '@/components/tabs'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { useCustomAssets } from '@/context/customAssetsContext'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { useWeightedPool, useWeightPoolData } from '@/hooks/weightedPool/useWeigtedPool'
import { getTokenInfo } from '@/lib/helper'
import { cn, formatAmount, fromWei, isInvalidAmount, roundIfMoreThanDecimals } from '@/lib/utils'
import SettingSlippageModal from '@/modules/Position/SettingSlippageModal'
import { ArrowLeftIcon, ArrowRightIcon, DownloadSuccessIcon, PercentIcon } from '@/svgs'

import InputTokenMemo from './InputTokenMemo'
import TransactionSettingModal from './TransactionSettingModal'

const DEPOSIT_TYPE = {
  SINGLE: 'single',
  ALL: 'all',
}

function AddLiquidityWeightedPool({
  pool,
  // isFullContent = true,
  showSidebar = true,
  setCurrentStep,
  isModal = false,
  setIsOpen = () => {},
}) {
  const t = useTranslations()
  const assets = useAssets()
  const customAssets = useCustomAssets()

  const [depositType, setDepositType] = useState(DEPOSIT_TYPE.SINGLE)
  const [isSuccess, setIsSuccess] = useState(false)
  const debounceTimeout = useRef(null)

  const [amountDeposit, setAmountDeposit] = useState('')

  const [slippage, setSlippage] = useState(0.5)
  const [openTransactionSetting, setOpenTransactionSetting] = useState()
  const { getValueTokenAmountToUSD } = useTokenUSDValue()

  const {
    onAddLiquiditySingleToken,
    onAddLiquidityAllToken,
    pending,
    calcMinBPTAmountOutSingleToken,
    calcMinBPTAmountOutAllToken,
  } = useWeightedPool()
  const { mutatePoolBalance } = useWeightPoolData(pool.address)

  const tokensAsset = useMemo(
    () =>
      (pool.tokens || []).map(item => {
        const asset = getTokenInfo({ tokenAddress: item?.address, assets, customAssets })
        return {
          ...item,
          ...asset,
          amountDeposit: '',
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(assets), customAssets, pool.tokens],
  )

  const [tokensData, setTokensData] = useState(tokensAsset)
  const [tokenDeposit, setTokenDeposit] = useState()
  const [minBPTAmountOut, setMinBPTAmountOut] = useState('')

  useEffect(() => {
    setTokensData(prev => {
      if (!prev || !prev.length || isInvalidAmount(prev[0]?.amountDeposit)) {
        return tokensAsset
      }

      return prev.map(item => ({
        ...item,
        balance: tokensAsset.find(asset => asset.address === item.address)?.balance || 0,
      }))
    })
    setTokenDeposit(tokensAsset?.[0])
  }, [tokensAsset])

  const calcMinBPT = useCallback(async () => {
    let minBPT = ''
    if (depositType === DEPOSIT_TYPE.SINGLE) {
      if (!isInvalidAmount(amountDeposit)) {
        minBPT = await calcMinBPTAmountOutSingleToken(pool.poolId, tokenDeposit, amountDeposit)
      }
    } else if (tokensData?.length && !isInvalidAmount(tokensData[0]?.amountDeposit)) {
      minBPT = await calcMinBPTAmountOutAllToken(pool.poolId, tokensData)
    }
    setMinBPTAmountOut(isInvalidAmount(minBPT) ? '' : fromWei(minBPT))
  }, [
    pool,
    depositType,
    calcMinBPTAmountOutSingleToken,
    tokenDeposit,
    amountDeposit,
    calcMinBPTAmountOutAllToken,
    tokensData,
  ])

  useEffect(() => {
    clearTimeout(debounceTimeout.current)
    debounceTimeout.current = setTimeout(() => {
      calcMinBPT()
    }, 300)
  }, [calcMinBPT])

  const handleAmountChange = useCallback(
    (address, value) => {
      setTokensData(prev => {
        const updatedTokens = [...prev]
        const changedToken = updatedTokens.find(token => token.address?.toLowerCase() === address?.toLowerCase())
        if (changedToken) {
          changedToken.amountDeposit = roundIfMoreThanDecimals(value, changedToken?.decimals)
          const currentTokenUSDValue = getValueTokenAmountToUSD(changedToken?.address, changedToken.amountDeposit)

          updatedTokens.forEach(token => {
            if (token.address?.toLowerCase() !== address?.toLowerCase()) {
              const otherTokenUSDValue = (currentTokenUSDValue / (changedToken.weight / 100)) * (token.weight / 100)
              token.amountDeposit = new BigNumber(otherTokenUSDValue)
                .div(token.price)
                .decimalPlaces(token.decimals, BigNumber.ROUND_DOWN)
                .toString()
            }
          })
        }
        return updatedTokens
      })
    },
    [getValueTokenAmountToUSD],
  )

  const toggleDepositType = useMemo(
    () => [
      {
        title: t('Deposit Single Token'),
        isActive: depositType === DEPOSIT_TYPE.SINGLE,
        isLink: false,
        onClick: () => setDepositType(DEPOSIT_TYPE.SINGLE),
      },
      {
        title: t('Deposit All Token'),
        isActive: depositType === DEPOSIT_TYPE.ALL,
        isLink: false,
        onClick: () => setDepositType(DEPOSIT_TYPE.ALL),
      },
    ],
    [depositType, t],
  )

  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => setAmountDeposit(tokenDeposit?.balance.times(0.1).toString(10)),
      },
      {
        label: '25%',
        onClickHandler: () => setAmountDeposit(tokenDeposit?.balance.times(0.25).toString(10)),
      },
      {
        label: '50%',
        onClickHandler: () => setAmountDeposit(tokenDeposit?.balance.times(0.5).toString(10)),
      },
      {
        label: 'Max',
        onClickHandler: () => setAmountDeposit(tokenDeposit?.balance.toString(10)),
      },
    ],
    [tokenDeposit?.balance, setAmountDeposit],
  )

  const isDisable = useMemo(() => {
    if (pending) return true

    if (depositType === DEPOSIT_TYPE.SINGLE) {
      if (!tokenDeposit || amountDeposit <= 0) {
        return true
      }
    }

    if (depositType === DEPOSIT_TYPE.ALL) {
      const checkAmountValid = tokensData.every(token => !isInvalidAmount(token.amountDeposit))
      if (!checkAmountValid) return true
    }

    return false
  }, [amountDeposit, depositType, pending, tokenDeposit, tokensData])

  const amountToWrap = useMemo(() => {
    let final
    if (depositType === DEPOSIT_TYPE.SINGLE) {
      console.log({ tokenDeposit })
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

  const onAddLiquidity = useCallback(async () => {
    if (depositType === DEPOSIT_TYPE.SINGLE) {
      await onAddLiquiditySingleToken(
        pool.poolId,
        tokenDeposit,
        amountDeposit,
        minBPTAmountOut,
        slippage,
        amountToWrap,
        () => {
          setIsSuccess(true)
          setAmountDeposit('')
          mutatePoolBalance()
          if (isModal) {
            setIsOpen(false)
          }
        },
      )
    } else {
      await onAddLiquidityAllToken(pool.poolId, tokensData, minBPTAmountOut, slippage, amountToWrap, () => {
        setIsSuccess(true)

        setTokensData(prev =>
          (prev || []).map(item => ({
            ...item,
            amountDeposit: '',
          })),
        )

        mutatePoolBalance()
        if (isModal) {
          setIsOpen(false)
        }
      })
    }
  }, [
    amountDeposit,
    amountToWrap,
    depositType,
    isModal,
    minBPTAmountOut,
    mutatePoolBalance,
    onAddLiquidityAllToken,
    onAddLiquiditySingleToken,
    pool.poolId,
    setIsOpen,
    slippage,
    tokenDeposit,
    tokensData,
  ])

  const isEnteredAmount = useMemo(() => {
    if (depositType === DEPOSIT_TYPE.SINGLE) {
      if (tokenDeposit || amountDeposit > 0) {
        return true
      }
    }

    if (depositType === DEPOSIT_TYPE.ALL) {
      return tokensData.some(token => token.amountDeposit > 0)
    }
    return false
  }, [amountDeposit, depositType, tokenDeposit, tokensData])

  const totalDeposit = useMemo(() => {
    if (depositType === DEPOSIT_TYPE.SINGLE) {
      return amountDeposit * (tokenDeposit?.price || 0)
    }

    if (depositType === DEPOSIT_TYPE.ALL) {
      return tokensData.reduce((sum, token) => {
        const value = (token?.amountDeposit || 0) * (token?.price || 0)
        return sum + value
      }, 0)
    }
  }, [amountDeposit, depositType, tokenDeposit?.price, tokensData])

  return (
    <>
      <Box className={cn('w-full flex-[6] flex-col py-3 lg:py-6', !showSidebar ? 'w-full' : '')}>
        {!isModal && (
          <div className='mb-4 h-11 w-fit'>
            {showSidebar ? (
              <TextHeading className='font-archia text-3xl text-neutral-50'>
                <TextIconButton Icon={ArrowLeftIcon} onClick={() => setCurrentStep(0)} />
                {t('Add Liquidity')}
              </TextHeading>
            ) : (
              <TextHeading className='font-archia text-3xl text-neutral-50'>{t('New Deposit')}</TextHeading>
            )}
          </div>
        )}
        <div className='flex flex-col gap-6'>
          {showSidebar && (
            <div className='flex flex-col gap-3'>
              <TextHeading>{pool?.symbol}</TextHeading>
              <div className='flex flex-row justify-between rounded-lg bg-neutral-800 p-4'>
                <div className='flex items-center gap-2'>
                  <ThreeIconGroup
                    className='-space-x-1'
                    classNames={{
                      image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                    }}
                    logo1={pool?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                    logo2={pool?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                    extendNumber={(pool?.tokens?.length || 2) - 2}
                  />
                  <div className='flex items-center gap-2 lg:max-w-[90%]'>
                    <div className='flex w-full flex-wrap items-center gap-1 '>
                      {(pool?.tokens || []).map(token => (
                        <div className='flex items-center gap-1' key={token?.address}>
                          <span className='text-[16px] font-medium leading-5'>{token?.symbol}</span>
                          <span className='text-sm font-medium leading-5 text-neutral-300 '>{token?.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <NeutralBadge>{t('Weighted')}</NeutralBadge>
              </div>
            </div>
          )}
          <MenuTab className='grid w-full grid-cols-2' menuData={toggleDepositType} />
          {/* TODO: Check BNB/WBNB */}
          <div className='flex flex-col'>
            <div className='flex justify-end'>
              <SettingSlippageModal updateSlippage={setSlippage} slippage={slippage} />
            </div>
            {depositType === DEPOSIT_TYPE.SINGLE && (
              <>
                <div className='flex flex-row justify-between'>
                  <TextHeading>{t('Deposit Token')}</TextHeading> <Tabs data={percents} />
                </div>
                <div className='relative flex w-full flex-col gap-2'>
                  <TokenInput
                    asset={tokenDeposit}
                    setAsset={setTokenDeposit}
                    amount={amountDeposit}
                    setAmount={setAmountDeposit}
                    autoFocus
                    assetData={tokensAsset}
                    assetNull
                    alowDouble
                  />
                </div>
              </>
            )}
            {depositType === DEPOSIT_TYPE.ALL &&
              (tokensData || []).map((token, idx) => (
                <InputTokenMemo
                  key={token?.address}
                  token={token}
                  title={`${t('Deposit Token')} ${idx + 1}`}
                  autoFocus={idx === 0}
                  amount={token.amountDeposit}
                  onAmountChange={value => handleAmountChange(token.address, value)}
                  alowDouble
                />
              ))}
          </div>
          <ArrowRightIcon className='mx-auto h-5 w-5 rotate-90' />
          <div className='relative flex w-full gap-2'>
            <InputManyToken readOnly amount={minBPTAmountOut} balance={0} pair={pool} title='LP' />
          </div>
          <div className='flex flex-row justify-between'>
            <TextHeading>{t('Total Deposit')}</TextHeading>
            <Paragraph>${formatAmount(totalDeposit)}</Paragraph>
          </div>
          <PrimaryButton disabled={isDisable} onClick={onAddLiquidity} className='w-full'>
            {t('Add Liquidity')}
          </PrimaryButton>
          <SuccessModal
            isOpen={isSuccess}
            heading={t('Deposit Successful')}
            message={t('You have successfully deposit to [symbol]', { poolSymbol: pool.symbol })}
            onClose={() => {
              setIsSuccess(false)
            }}
            buttonAction={
              <Link onClick={() => setIsSuccess(false)} href={`/pools/${pool?.address?.toLowerCase()}`}>
                <EmphasisButton className='w-full'>{t('View Pool')}</EmphasisButton>
              </Link>
            }
          />
        </div>
      </Box>
      {showSidebar && (
        <div className='flex-[4]'>
          <Box className='flex flex-col gap-4'>
            <TextHeading className='font-archia text-2xl font-semibold'>{t('New Deposit')}</TextHeading>
            {pool.type === PAIR_TYPES.WEIGHTED && (
              <>
                {!isEnteredAmount ? (
                  <div className='flex flex-col gap-6'>
                    <p>{t('New Deposit description')}</p>
                    <p>{t('You can also choose to stake your liquidity')}</p>
                  </div>
                ) : (
                  <>
                    <div className='flex flex-col gap-6'>
                      <div className='flex flex-row items-center gap-2'>
                        <DownloadSuccessIcon className='h-5 w-5 stroke-success-600' />
                        <div className='flex flex-col'>
                          <div className='flex flex-row gap-1'>
                            <span>{t('Quote for deposit received')}</span>
                            <Link href='/'>{t('Refresh')}</Link>
                          </div>
                          <div>
                            <span>{formatAmount(0)} THE</span>
                          </div>
                        </div>
                      </div>
                      <div className='flex flex-row items-center gap-2'>
                        <PercentIcon className='h-5 w-5 stroke-success-600' />
                        <div className='flex flex-row gap-1'>
                          <span>{t('slippage applied', { percent: '1.0' })}</span>
                          <p className='!cursor-pointer underline'>{t('Adjust')}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </Box>
        </div>
      )}
      <TransactionSettingModal
        isOpen={openTransactionSetting}
        setIsOpen={setOpenTransactionSetting}
        updateSlippage={setSlippage}
        slippage={slippage}
      />
    </>
  )
}

export default AddLiquidityWeightedPool
