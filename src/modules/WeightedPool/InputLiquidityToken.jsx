import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import TokenBadge from '@/components/badges/TokenBadge'
import Skeleton from '@/components/skeleton'
import { Paragraph, TextSubHeading } from '@/components/typography'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { cn, formatAmount, fromWei, roundIfMoreThan18Decimals, toWei } from '@/lib/utils'

export default function InputLiquidityToken({ asset, allocate, amount, setTokenAndWeights, setLastIndexChange }) {
  const t = useTranslations()
  const { getValueTokenAmountToUSD } = useTokenUSDValue()
  const [isError, setIsError] = useState(false)
  const setAmount = useCallback(
    value => {
      setTokenAndWeights(prev => {
        const updatedTokens = [...prev]
        const index = updatedTokens.findIndex(item => item.token.address === asset.address)

        updatedTokens[index] = {
          ...updatedTokens[index],
          amount: roundIfMoreThan18Decimals(value),
        }

        setLastIndexChange(index)

        return updatedTokens
      })
    },
    [asset.address, setLastIndexChange, setTokenAndWeights],
  )

  console.log({ check: asset?.balance.toString(), amount })

  const isInsufficientBalance = useMemo(() => {
    const amountToWei = toWei(amount, asset?.decimals)
    if (fromWei(amountToWei, asset?.decimals).gt(asset?.balance)) {
      return true
    }

    // if (
    //   asset?.address.toLowerCase() === Contracts.mockERC20Token.WBNB.toLowerCase() &&
    //   fromWei(amountToWei, asset?.decimals).gt(asset?.balance.minus(0.05))
    // ) {
    //   return true
    // }
    return false
  }, [amount, asset])

  const renderMessages = useCallback(() => {
    const errorMessages = []

    if (isInsufficientBalance) {
      errorMessages.push(t('Exceeds wallet balance'))
    }

    if (amount <= 0) {
      errorMessages.push(t('Must be greater than 0'))
    }

    return errorMessages.map((message, index) => (
      <Paragraph key={index} className='text-sm text-error-600'>
        {message}
      </Paragraph>
    ))
  }, [amount, isInsufficientBalance, t])

  useEffect(() => {
    const hasErrors = isInsufficientBalance || amount <= 0
    setIsError(hasErrors)
  }, [isInsufficientBalance, amount])

  useEffect(() => {
    setTokenAndWeights(prev => {
      const updatedTokens = [...prev]
      const index = updatedTokens.findIndex(item => item?.token?.address === asset?.address)
      updatedTokens[index] = {
        ...updatedTokens[index],
        isError,
      }
      return updatedTokens
    })
  }, [asset, isError, setTokenAndWeights])

  return (
    <div
      className={cn(
        'flex flex-col gap-3 self-stretch rounded-xl border  p-4',
        isError ? 'border-error-600' : 'border-neutral-700',
      )}
    >
      <div className='flex flex-row items-center justify-between gap-2'>
        {asset ? (
          <TokenBadge showChevronDownIcon={false} asset={asset} prefix={allocate} />
        ) : (
          <Skeleton className='h-[36px] w-[100px]' />
        )}
        <input
          type='number'
          className='w-full border-0 bg-transparent p-0 text-right text-xl text-neutral-50 placeholder-neutral-400'
          placeholder='0.0'
          value={amount || ''}
          onChange={e => setAmount(e.target.value)}
          min={0}
        />
      </div>
      <div className='flex items-center justify-between gap-2'>
        <TextSubHeading>
          {t('Balance')}: {formatAmount(asset?.balance)}{' '}
          {amount?.toString() === asset?.balance.toString() ? (
            <span className='cursor-pointer'>{t('Maxed')}</span>
          ) : (
            <span onClick={() => setAmount(asset?.balance.toString())} className='cursor-pointer text-primary-500'>
              {t('Max')}
            </span>
          )}
        </TextSubHeading>
        <TextSubHeading>${formatAmount(getValueTokenAmountToUSD(asset.address, amount))}</TextSubHeading>
      </div>
      {renderMessages()}
    </div>
  )
}
