import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton, TextButton } from '@/components/buttons/Button'
import Toggle from '@/components/toggle'
import { Paragraph, TextHeading } from '@/components/typography'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { formatAmount, roundIfMoreThan18Decimals } from '@/lib/utils'
import { ArrowLeftIcon, InfoCirCleDisableIcon } from '@/svgs'

import InputLiquidityToken from './InputLiquidityToken'

export default function SetInitialLiquidity({ setTokenAndWeights, tokensAndWeights, setCurrentStep }) {
  const t = useTranslations()
  const [lastIndexChange, setLastIndexChange] = useState(0)
  const [isAutoOptimize, setIsAutoOptimize] = useState(false)

  const [totalWhenOptimize, setTotalWhenOptimize] = useState(null)

  const { getValueTokenAmountToUSD } = useTokenUSDValue()

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

  useEffect(() => {
    setTokenAndWeights(prev => {
      const updatedTokens = [...prev]
      const lastChange = updatedTokens[lastIndexChange]
      if (isAutoOptimize) {
        const currentTokenUSDValue = getValueTokenAmountToUSD(lastChange?.token?.address, lastChange?.amount)

        updatedTokens.forEach((token, idx) => {
          if (idx !== lastIndexChange) {
            const otherTokenUSDValue =
              (currentTokenUSDValue / (updatedTokens[lastIndexChange].weight / 100)) * (token.weight / 100)
            token.amount = roundIfMoreThan18Decimals(otherTokenUSDValue / token.token.price).toString()
          }
        })
      }

      return updatedTokens
    })
  }, [lastIndexChange, isAutoOptimize, setTokenAndWeights, getValueTokenAmountToUSD, tokensAndWeights])

  const isDisable = useMemo(
    () => (tokensAndWeights || []).some(item => item.isError || !item?.amount),
    [tokensAndWeights],
  )

  const onClearAmount = useCallback(() => {
    setTokenAndWeights(prev =>
      prev.map(item => ({
        ...item,
        amount: null,
      })),
    )
  }, [setTokenAndWeights])

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
            amount: roundIfMoreThan18Decimals(newAmount).toString(),
            usdValue: otherTokenUSDValue,
          })
        } else {
          result.push({
            ...otherToken,
            amount: roundIfMoreThan18Decimals(currentBalance).toString(),
            usdValue: currentTokenUSDValue,
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
  }, [getValueTokenAmountToUSD, setTokenAndWeights, tokensAndWeights])

  return (
    <Box className='flex flex-col gap-3'>
      <div className='flex h-11 flex-row items-center'>
        <TextButton onClick={() => setCurrentStep(prev => prev - 1)} LeadingIcon={ArrowLeftIcon} />
        <TextHeading className='font-archia text-xl xl:text-3xl'>{t('Set Initial Liquidity')}</TextHeading>
      </div>
      <div className='flex flex-col gap-3'>
        <>
          {!isDisable && (
            <div>
              <Paragraph className='text-base'>{t('Optimized amounts have been pre-filled')}</Paragraph>{' '}
              <span className='cursor-pointer text-primary-600' onClick={onClearAmount}>
                {t('Clear all')}
              </span>
            </div>
          )}
          {(tokensAndWeights || []).map(item => (
            <InputLiquidityToken
              key={item?.token?.address}
              asset={item.token}
              weight={`(${item.weight}%)`}
              setTokenAndWeights={setTokenAndWeights}
              amount={item.amount}
              setLastIndexChange={setLastIndexChange}
            />
          ))}
        </>
      </div>
      <div className='flex flex-row items-center gap-2'>
        <Toggle checked={isAutoOptimize} onChange={() => setIsAutoOptimize(prev => !prev)} />
        <label className='text-sm lg:text-base'>{t('Auto optimize liquidity')}</label>{' '}
        <InfoCirCleDisableIcon className='h-4 w-4' />
      </div>
      <div className='flex flex-col gap-2 rounded-xl bg-neutral-800 p-4'>
        <div className='flex flex-row justify-between'>
          <span>{t('Total')}</span>
          <span>${formatAmount(total)}</span>
        </div>
        <div className='flex flex-row justify-between'>
          <span>
            {t('Available')}: ${formatAmount(available)}{' '}
            {available === total ? (
              <span onClick={handleMaxTotal}>{t('Maxed')}</span>
            ) : (
              <span className='cursor-pointer text-primary-400' onClick={handleMaxTotal}>
                {t('Max')}
              </span>
            )}
          </span>
          {totalWhenOptimize !== total && (
            <span className='cursor-pointer text-primary-400' onClick={handleOptimizeTotal}>
              {t('Optimize')}
            </span>
          )}
        </div>
      </div>
      <PrimaryButton
        disabled={isDisable}
        onClick={() => {
          setCurrentStep(prev => prev + 1)
        }}
        className='w-full'
      >
        {t('Preview')}
      </PrimaryButton>
    </Box>
  )
}
