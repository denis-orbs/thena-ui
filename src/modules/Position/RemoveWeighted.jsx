import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import MenuTab from '@/app/arena/MenuTab'
import { Alert, Warning } from '@/components/alert'
import { NeutralBadge } from '@/components/badges/Badge'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import CircleImage from '@/components/image/CircleImage'
import InputManyToken from '@/components/input/InputManyToken'
import TokenInput from '@/components/input/TokenInput'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { useWeightedPool, useWeightPoolData } from '@/hooks/weightedPool/useWeigtedPool'
import { cn, formatAmount, isInvalidAmount, roundIfMoreThanDecimals, toWei } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

import SettingSlippageDropDown from './SettingSlippageDropDown'

const REMOVE_TYPE = {
  SINGLE: 'single',
  ALL: 'all',
}

function RemoveWeighted({ pool, onCancel, showTitle = true }) {
  const t = useTranslations()

  const {
    onRemoveLiquiditySingleToken,
    onRemoveLiquidityAllToken,
    calcMinAmountOutRemoveSingle,
    calcMinAmountOutRemoveAll,
  } = useWeightedPool()

  const { mutatePoolBalance } = useWeightPoolData(pool.address)
  const { getValueTokenAmountToUSD } = useTokenUSDValue()

  const [removeType, setRemoveType] = useState(REMOVE_TYPE.SINGLE)
  const [amount, setAmount] = useState('')
  const [tokenReceive, setTokenReceive] = useState(pool?.tokens?.[0])
  const [totalWithdrawal, setTotalWithdrawal] = useState(0)

  const [slippage, setSlippage] = useState(0.5) // default = 0.5

  const [minAmountsOut, setMinAmountsOut] = useState([])
  const [minAmountOut, setMinAmountOut] = useState('')

  const [initialState, setInitialState] = useState(true)
  const [tokensData, setTokensData] = useState(pool?.tokens || [])

  const assets = useAssets()

  useEffect(() => {
    if (pool?.tokens?.length > 0 && initialState) {
      const updatedTokensData = pool.tokens.map(token => ({
        ...token,
        balance: assets.find(asset => asset.address === token.address)?.balance,
      }))
      setTokensData(updatedTokensData)
      setTokenReceive(updatedTokensData[0])
      setInitialState(false)
    }
  }, [assets, pool, initialState])

  const [showConfirm, setShowConfirm] = useState(false)

  const debounceTimeout = useRef(null)

  const toggleRemoveType = useMemo(
    () => [
      {
        title: t('Remove Single Token'),
        isActive: removeType === REMOVE_TYPE.SINGLE,
        isLink: false,
        onClick: () => setRemoveType(REMOVE_TYPE.SINGLE),
      },
      {
        title: t('Remove All Tokens'),
        isActive: removeType === REMOVE_TYPE.ALL,
        isLink: false,
        onClick: () => setRemoveType(REMOVE_TYPE.ALL),
      },
    ],
    [removeType, t],
  )

  const handleAmountChange = useCallback(
    value => {
      setAmount(roundIfMoreThanDecimals(value))
    },
    [setAmount],
  )

  const calcMinAmountsOut = useCallback(async () => {
    if (removeType === REMOVE_TYPE.SINGLE) {
      let amountOut = ''
      if (!isInvalidAmount(amount) && tokenReceive) {
        amountOut = await calcMinAmountOutRemoveSingle(pool, tokenReceive, amount)
      }
      setMinAmountOut(amountOut)
    } else {
      const result = await calcMinAmountOutRemoveAll(pool, amount, tokensData)
      setMinAmountsOut(result)
    }
  }, [amount, calcMinAmountOutRemoveAll, calcMinAmountOutRemoveSingle, pool, removeType, tokenReceive, tokensData])

  useEffect(() => {
    clearTimeout(debounceTimeout.current)
    debounceTimeout.current = setTimeout(() => {
      calcMinAmountsOut()
    }, 300)
  }, [amount, calcMinAmountsOut])

  useEffect(() => {
    if (minAmountsOut.length > 0) {
      const total = (pool.tokens || []).reduce(
        (sum, token, index) => sum + getValueTokenAmountToUSD(token.address, minAmountsOut[index]),
        0,
      )
      setTotalWithdrawal(total)
    }
  }, [getValueTokenAmountToUSD, minAmountsOut, pool.tokens])

  const onRemove = useCallback(async () => {
    const amountToWei = toWei(amount)
    if (removeType === REMOVE_TYPE.SINGLE) {
      await onRemoveLiquiditySingleToken(pool, tokenReceive, amountToWei, minAmountOut, slippage, () =>
        mutatePoolBalance(),
      )
    } else {
      await onRemoveLiquidityAllToken(pool, amountToWei, minAmountsOut, tokensData, slippage, () => mutatePoolBalance())
    }
  }, [
    amount,
    removeType,
    onRemoveLiquiditySingleToken,
    pool,
    tokenReceive,
    minAmountOut,
    slippage,
    mutatePoolBalance,
    onRemoveLiquidityAllToken,
    minAmountsOut,
    tokensData,
  ])

  const impact = useMemo(() => {
    let value = 0
    if (removeType === REMOVE_TYPE.SINGLE) {
      value = ((+minAmountOut * tokenReceive.price) / (pool.lpPrice * amount)) * 100
    } else {
      value = (totalWithdrawal / (pool.lpPrice * amount)) * 100
    }
    return 100 - value
  }, [amount, minAmountOut, pool.lpPrice, removeType, tokenReceive.price, totalWithdrawal])

  const isDisabled = useMemo(() => {
    if (impact >= 50) return true

    if (removeType === REMOVE_TYPE.SINGLE && (!tokenReceive || isInvalidAmount(minAmountOut))) return true

    if (
      removeType === REMOVE_TYPE.ALL &&
      ((minAmountsOut || []).some(item => isInvalidAmount(item)) || minAmountsOut.length === 0)
    ) {
      return true
    }

    if (!amount || amount <= 0) return true

    return false
  }, [removeType, tokenReceive, minAmountOut, minAmountsOut, amount, impact])

  return (
    <>
      <ModalBody>
        <div className='flex flex-col gap-6'>
          <div className={cn('flex flex-col gap-3', !showTitle ? 'hidden' : '')}>
            <TextHeading>{pool?.symbol}</TextHeading>
            <div className='flex flex-row justify-between rounded-lg bg-neutral-800 p-4'>
              <div className='flex items-center gap-2'>
                <ThreeIconGroup
                  classNames={{
                    image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                  }}
                  className='*:not-first:-ml-1'
                  logo1={pool?.tokens?.[0].logoURI ?? UNKNOWN_LOGO}
                  logo2={pool?.tokens?.[1].logoURI ?? UNKNOWN_LOGO}
                  extendNumber={(pool?.tokens?.length || 2) - 2}
                />
                <div className='flex items-center gap-2 lg:max-w-[90%]'>
                  <div className='flex w-full flex-wrap items-center gap-1'>
                    {(pool?.tokens || []).map(token => (
                      <div className='flex items-center gap-1' key={token?.address}>
                        <span className='text-[16px] leading-5 font-medium'>{token?.symbol}</span>
                        <span className='text-sm leading-5 font-medium text-neutral-300'>{token?.weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <NeutralBadge>{t('Weighted')}</NeutralBadge>
            </div>
          </div>
          <MenuTab className='grid w-full grid-cols-2' menuData={toggleRemoveType} />
          <div className='flex flex-col'>
            <div className='flex justify-end'>
              <SettingSlippageDropDown position='end' slippage={slippage} updateSlippage={setSlippage} />
            </div>
            <InputManyToken pair={pool} amount={amount} onAmountChange={handleAmountChange} title='Amount' />
          </div>
          <div className='relative flex w-full gap-2'>
            <div className='relative flex w-full flex-col gap-2'>
              {removeType === REMOVE_TYPE.SINGLE && (
                <TokenInput
                  title={t('You Will Receive')}
                  asset={{ ...tokenReceive, symbol: tokenReceive.symbol === 'BNB' ? 'WBNB' : tokenReceive.symbol }}
                  setAsset={setTokenReceive}
                  amount={minAmountOut}
                  autoFocus
                  assetData={tokensData}
                  assetNull
                  disabled
                />
              )}
              {removeType === REMOVE_TYPE.ALL && (
                <div className='flex flex-col'>
                  <TextHeading className='mb-4'>{t('You Will Receive')}</TextHeading>
                  <div className='mb-4 flex flex-col gap-3'>
                    {(pool.tokens || []).map((token, index) => (
                      <div className='flex flex-row justify-between' key={token.address}>
                        <div className='flex gap-1'>
                          <CircleImage alt={token.symbol} src={token?.logoURI || UNKNOWN_LOGO} className='h-5 w-5' />
                          <Paragraph>{token.symbol === 'BNB' ? 'WBNB' : token.symbol}</Paragraph>
                        </div>
                        <Paragraph>{formatAmount(minAmountsOut?.[index] || 0)}</Paragraph>
                      </div>
                    ))}
                  </div>
                  <div className='flex flex-row justify-between'>
                    <TextHeading>{t('Total Withdrawal')}</TextHeading>
                    <Paragraph>${formatAmount(totalWithdrawal)}</Paragraph>
                  </div>
                </div>
              )}
            </div>
          </div>
          {impact >= 10 && (
            <Alert>
              <InfoIcon className='stroke-error-600 h-4 w-4' />
              <p>{`${t('Price impact too high').replace('!', '')}: ${formatAmount(impact)}%`}</p>
            </Alert>
          )}
        </div>
        <div className='flex flex-row justify-between gap-4'>
          <EmphasisButton className='w-full flex-5' onClick={onCancel}>
            {t('Cancel')}
          </EmphasisButton>
          <PrimaryButton
            disabled={isDisabled}
            className='w-full flex-5'
            onClick={() => {
              if (impact >= 10 && impact < 50) {
                setShowConfirm(true)
              } else {
                onRemove()
              }
            }}
          >
            {t('Remove')}
          </PrimaryButton>
        </div>
      </ModalBody>
      <Modal isOpen={showConfirm} closeModal={() => setShowConfirm(false)} title={<>{t('Warning')}!</>}>
        <ModalBody>
          <Warning>
            <InfoIcon className='stroke-warn-700 h-4 w-4' /> {t('Price impact too high')}
          </Warning>
          <Paragraph className='mb-3 text-xl'>{t('Are you sure you want to continue')}</Paragraph>
        </ModalBody>
        <ModalFooter className='flex justify-between gap-6'>
          <EmphasisButton className='w-1/2' onClick={() => setShowConfirm(false)}>
            {t('Cancel')}
          </EmphasisButton>

          <PrimaryButton
            className='w-1/2'
            onClick={() => {
              setShowConfirm(false)
              onRemove()
            }}
          >
            {t('Continue')}
          </PrimaryButton>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default RemoveWeighted
