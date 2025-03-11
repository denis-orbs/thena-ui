import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import InputTokenMemo from '@/app/pools/(add-liquidity)/add-liquidity/InputTokenMemo'
import { TertiaryButton } from '@/components/buttons/Button'
import { TextHeading } from '@/components/typography'
import { useTokenBalanceFn } from '@/hooks/fusion/Tokens'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { formatAmount, roundIfMoreThanDecimals } from '@/lib/utils'
import { ScalesPrimaryIcon, WarningTriangleIcon } from '@/svgs'

export default function SetInitialLiquidity({ setTokenAndWeights, tokensAndWeights, checkError }) {
  const t = useTranslations()
  // const [lastIndexChange, setLastIndexChange] = useState(0)
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
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-3'>
        <>
          {(tokensAndWeights || []).map((item, index) => (
            <div className='space-y-2' key={item.token.address}>
              <InputTokenMemo
                key={`${item?.token?.address}_${index}`}
                token={item.token}
                isError={item.isError && checkError}
                autoFocus={index === 0}
                amount={item.amount}
                onAmountChange={value => handleAmountChange(value, item.token)}
                alowDouble
                weight={item.weight}
              />
              {item.isError && checkError && (
                <p className='mb-2 mt-1 flex gap-1 text-error-500'>
                  <WarningTriangleIcon className='h-5 w-5' />
                  <span>{t('Insufficient [Asset] Balance', { symbol: item?.symbol })}</span>
                </p>
              )}
            </div>
          ))}
        </>
      </div>
      <div className='flex flex-col gap-2 rounded-xl border border-primary-800 bg-primary-950 p-4'>
        <div className='flex flex-row justify-between'>
          <div className='flex gap-4'>
            <ScalesPrimaryIcon className='h8 w-8' />
            <div className='flex flex-col gap-2'>
              <TextHeading>{t('Auto optimize liquidity')}</TextHeading>
              <span>
                {t('Available')}: ${formatAmount(available)}{' '}
                {available === total ? (
                  <span onClick={handleMaxTotal}>{t('Maxed')}</span>
                ) : (
                  <span className='cursor-pointer text-primary-600 hover:text-primary-500' onClick={handleMaxTotal}>
                    {t('Max')}
                  </span>
                )}
              </span>
            </div>
          </div>
          {totalWhenOptimize !== total && (
            <TertiaryButton
              className='h-8 max-w-fit cursor-pointer text-xs text-primary-600 md:h-11 md:text-base'
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
