import BigNumber from 'bignumber.js'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import InputTokenMemo from '@/app/pools/(add-liquidity)/add-liquidity/InputTokenMemo'
import { TertiaryButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { useTokenBalanceFn } from '@/hooks/fusion/Tokens'
import { useTokenUSDValue } from '@/hooks/usePrices'
import WarningIcon from '@/icons/WarningIcon'
import { formatAmount, roundIfMoreThanDecimals } from '@/lib/utils'

export default function SetInitialLiquidity({ setTokenAndWeights, tokensAndWeights, checkError }) {
  const t = useTranslations()
  const [isAutoOptimize, setIsAutoOptimize] = useState(true)

  const [totalWhenOptimize, setTotalWhenOptimize] = useState(null)

  const { getValueTokenAmountToUSD } = useTokenUSDValue()

  const { getBalance } = useTokenBalanceFn()

  const isInsufficientBalance = useCallback(
    (amount, asset) => {
      // const amountToWei = toWei(amount, asset?.decimals)
      const { balance } = getBalance(asset, true)
      if (new BigNumber(amount).gt(balance)) {
        return true
      }
      return false
    },
    [getBalance],
  )

  const available = useMemo(
    () =>
      tokensAndWeights.reduce(
        (sum, item) => (getValueTokenAmountToUSD(item?.token?.address, item?.token?.balance) || 0) + sum,
        0,
      ),
    [getValueTokenAmountToUSD, tokensAndWeights],
  )

  const total = useMemo(
    () => tokensAndWeights.reduce((sum, curr) => sum + getValueTokenAmountToUSD(curr.token.address, curr.amount), 0),
    [getValueTokenAmountToUSD, tokensAndWeights],
  )

  const handleMaxTotal = useCallback(() => {
    setIsAutoOptimize(false)
    setTokenAndWeights(prev => {
      const updatedTokens = [...prev]

      updatedTokens.forEach(token => {
        token.amount = token?.token?.balance || 0
      })

      return updatedTokens
    })
  }, [setTokenAndWeights])

  const handleOptimizeTotal = useCallback(() => {
    const results = []
    tokensAndWeights.forEach(token => {
      const currentToken = token.token
      const currentBalance = token?.token?.balance
      const currentTokenUSDValue = getValueTokenAmountToUSD(currentToken?.address, currentBalance)
      const cpTokenAndWeight = [...tokensAndWeights]
      let result = []
      for (let i = 0; i < cpTokenAndWeight.length; i++) {
        const otherToken = cpTokenAndWeight[i]
        if (otherToken?.token?.address?.toLowerCase() !== currentToken.address.toLowerCase()) {
          const otherTokenUSDValue = (currentTokenUSDValue / (token.weight / 100)) * (otherToken.weight / 100)
          const newAmount = otherTokenUSDValue / (otherToken.token.price || 1)

          if (newAmount > otherToken?.token?.balance) {
            result = null
            break
          }

          result.push({
            ...otherToken,
            amount: roundIfMoreThanDecimals(newAmount, otherToken?.decimals).toString(),
            usdValue: otherTokenUSDValue,
            isError: isInsufficientBalance(newAmount, otherToken.token),
          })
        } else {
          result.push({
            ...otherToken,
            amount: roundIfMoreThanDecimals(currentBalance, otherToken?.decimals).toString(),
            usdValue: currentTokenUSDValue,
            isError: isInsufficientBalance(currentBalance, otherToken.token),
          })
        }
      }

      if (result !== null) results.push(result)
    })

    const maxUsdValueResult = results
      .filter(item => item !== null)
      .reduce((maxResult, currentResult) => {
        const currentUsdValueSum = currentResult.reduce((sum, token) => sum + (token?.usdValue || 0), 0)
        const maxUsdValueSum = maxResult.reduce((sum, token) => sum + (token?.usdValue || 0), 0)

        return currentUsdValueSum > maxUsdValueSum ? currentResult : maxResult
      }, results[0])

    setTotalWhenOptimize(maxUsdValueResult.reduce((sum, token) => sum + (token?.usdValue || 0), 0))

    setTokenAndWeights(maxUsdValueResult)
  }, [getValueTokenAmountToUSD, isInsufficientBalance, setTokenAndWeights, tokensAndWeights])

  const handleAmountChange = useCallback(
    (value, asset) => {
      setTokenAndWeights(prev => {
        const updatedTokens = [...prev]
        const changedToken = updatedTokens.find(
          token => token.token.address?.toLowerCase() === asset?.address?.toLowerCase(),
        )

        if (changedToken) {
          changedToken.amount = roundIfMoreThanDecimals(value, changedToken.token?.decimals)
          changedToken.isError = isInsufficientBalance(value, asset)
          if (isAutoOptimize) {
            const currentTokenUSDValue = getValueTokenAmountToUSD(changedToken.token?.address, changedToken?.amount)

            updatedTokens.forEach(item => {
              if (item.token?.address?.toLowerCase() !== asset?.address?.toLowerCase()) {
                const otherTokenUSDValue = (currentTokenUSDValue / (changedToken.weight / 100)) * (item.weight / 100)
                item.amount = roundIfMoreThanDecimals(
                  otherTokenUSDValue / item.token.price,
                  item.token?.decimals,
                ).toString()
                item.isError = isInsufficientBalance(item?.amount, item?.token)
              }
            })
          }
        }

        return updatedTokens
      })
    },
    [getValueTokenAmountToUSD, isAutoOptimize, isInsufficientBalance, setTokenAndWeights],
  )

  useEffect(() => {
    handleAmountChange(tokensAndWeights[0]?.amount, tokensAndWeights?.[0]?.token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoOptimize])
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-4'>
        {(tokensAndWeights || []).map((item, index) => (
          <div className='flex flex-col gap-2' key={item.token.address}>
            <InputTokenMemo
              key={`${item?.token?.address}_${index}`}
              token={item.token}
              isError={item.isError && checkError}
              amount={item.amount}
              onAmountChange={value => handleAmountChange(value, item.token)}
              alowDouble
              weight={item.weight}
            />
            {item.isError && checkError && (
              <p className='text-error-500 mt-1 mb-2 flex gap-1'>
                <WarningIcon className='size-5' />
                <span>{t('Insufficient [Asset] Balance', { symbol: item?.symbol })}</span>
              </p>
            )}
          </div>
        ))}
      </div>
      <div className='border-primary-800 bg-primary-950 flex flex-col gap-2 rounded-xl border py-2 pr-2 pl-3 lg:p-8'>
        <div className='flex flex-row items-center justify-between'>
          <div className='flex items-center gap-2 lg:gap-4'>
            <Image src='/svgs/scale-primary.svg' className='size-4 lg:size-8' />
            <div className='flex flex-col gap-2'>
              <TextHeading className='max-lg:font-normal'>{t('Auto optimize liquidity')}</TextHeading>
              <span className='max-lg:font-normal'>
                {t('Available')}: ${formatAmount(available)}{' '}
                {available === total ? (
                  <span onClick={handleMaxTotal}>{t('Maxed')}</span>
                ) : (
                  <span className='text-primary-600 hover:text-primary-500 cursor-pointer' onClick={handleMaxTotal}>
                    {t('Max')}
                  </span>
                )}
              </span>
            </div>
          </div>
          {totalWhenOptimize !== total && (
            <TertiaryButton
              className='text-primary-600 h-8 max-w-fit cursor-pointer text-xs md:h-11 md:text-base'
              onClick={handleOptimizeTotal}
            >
              {t('Optimize')}
            </TertiaryButton>
          )}
        </div>
      </div>
    </div>
  )
}
