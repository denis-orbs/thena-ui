import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import MenuTab from '@/app/arena/MenuTab'
import { NeutralBadge } from '@/components/badges/Badge'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { ThreeIconGroup } from '@/components/icongroup/ThreeIconGroup'
import CircleImage from '@/components/image/CircleImage'
import InputManyToken from '@/components/input/InputManyToken'
import TokenInput from '@/components/input/TokenInput'
import { ModalBody } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { useWeightedPool, useWeightPoolData } from '@/hooks/weightedPool/useWeigtedPool'
import { formatAmount, isInvalidAmount, roundIfMoreThanDecimals, toWei } from '@/lib/utils'

const REMOVE_TYPE = {
  SINGLE: 'single',
  ALL: 'all',
}

function RemoveWeighted({ pool, onCancel }) {
  const t = useTranslations()

  const {
    onRemoveLiquiditySingleToken,
    onRemoveLiquidityAllToken,
    calcMinAmountOutRemoveSingle,
    calcMinAmountOutRemoveAll,
    pending,
  } = useWeightedPool()

  // TODO: re-render
  // TODO: Warning: Each child in a list should have a unique "key" prop.

  const { mutatePoolBalance } = useWeightPoolData(pool.address)
  const { getValueTokenAmountToUSD } = useTokenUSDValue()

  const [removeType, setRemoveType] = useState(REMOVE_TYPE.SINGLE)
  const [amount, setAmount] = useState(0)
  const [tokenReceive, setTokenReceive] = useState(pool?.tokens?.[0])
  const [totalWithdrawal, setTotalWithdrawal] = useState(0)

  const [minAmountsOut, setMinAmountsOut] = useState([])
  const [minAmountOut, setMinAmountOut] = useState('')

  const tokensData = useMemo(() => pool?.tokens || [], [pool?.tokens])

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
      await onRemoveLiquiditySingleToken(pool, tokenReceive, amountToWei, minAmountOut, () => mutatePoolBalance())
    } else {
      await onRemoveLiquidityAllToken(pool, amountToWei, minAmountsOut, tokensData, () => mutatePoolBalance())
    }
  }, [
    amount,
    removeType,
    onRemoveLiquiditySingleToken,
    pool,
    tokenReceive,
    minAmountOut,
    mutatePoolBalance,
    onRemoveLiquidityAllToken,
    minAmountsOut,
    tokensData,
  ])

  const isDisabled = useMemo(() => {
    if (removeType === REMOVE_TYPE.SINGLE && !tokenReceive) return true

    if (!amount || amount <= 0 || pending) return true

    return false
  }, [removeType, amount, tokenReceive, pending])

  return (
    <ModalBody>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-3'>
          <TextHeading>{pool?.symbol}</TextHeading>
          <div className='flex flex-row justify-between rounded-lg bg-neutral-800 p-4'>
            <div className='flex items-center gap-2'>
              <ThreeIconGroup
                classNames={{
                  image: 'w-8 h-8 text-xl font-medium leading-5 text-[#1C2027]',
                }}
                className='-space-x-1'
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
        <MenuTab className='grid w-full grid-cols-2' menuData={toggleRemoveType} />
        <div className='flex flex-col'>
          <InputManyToken pair={pool} amount={amount} onAmountChange={handleAmountChange} title={t('Amount')} />
        </div>
        <div className='relative flex w-full gap-2'>
          <div className='relative flex w-full flex-col gap-2'>
            {removeType === REMOVE_TYPE.SINGLE && (
              <TokenInput
                title={t('You Will Receive')}
                asset={tokenReceive}
                setAsset={setTokenReceive}
                amount={minAmountOut}
                autoFocus
                assetData={tokensData}
                assetNull
                readOnly
              />
            )}
            {removeType === REMOVE_TYPE.ALL && (
              <div className='flex flex-col'>
                <TextHeading className='mb-4'>{t('You Will Receive')}</TextHeading>
                <div className='mb-4 flex flex-col gap-3'>
                  {(pool.tokens || []).map((token, index) => (
                    <div className='flex flex-row justify-between'>
                      <div className='flex gap-1'>
                        <CircleImage alt={token.symbol} src={token?.logoURI || UNKNOWN_LOGO} className='h-5 w-5' />
                        <Paragraph>{token.symbol}</Paragraph>
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
      </div>
      <div className='flex flex-row justify-between gap-4'>
        <EmphasisButton className='w-full flex-[5]' onClick={onCancel}>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton disabled={isDisabled} className='w-full flex-[5]' onClick={onRemove}>
          {t('Remove')}
        </PrimaryButton>
      </div>
    </ModalBody>
  )
}

export default RemoveWeighted
