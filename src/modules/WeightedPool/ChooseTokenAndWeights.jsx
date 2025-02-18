'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { cn, formatAmount } from '@/lib/utils'
import { InfoIcon, LockIcon, UnlockIcon } from '@/svgs'

const updateWeight = tokens => {
  const weightLocked = tokens.filter(item => item.lock).reduce((sum, cur) => sum + cur.weight, 0)
  const tokenUnlock = tokens.filter(item => !item.lock && item.token != null)
  if (tokenUnlock.length === 0) return tokens

  let newWeight = (100 - weightLocked) / tokenUnlock.length
  newWeight = Math.round(newWeight * 100) / 100

  let totalWeight = 0
  const newData = tokenUnlock.map(i => {
    const roundedWeight = Math.round(newWeight * 100) / 100
    totalWeight += roundedWeight
    return {
      ...i,
      weight: roundedWeight,
    }
  })

  let difference = Math.round((100 - weightLocked - totalWeight) * 100) / 100

  if (difference !== 0) {
    newData.forEach((item, index) => {
      if (difference === 0) return

      const adjustment = difference > 0 ? 0.01 : -0.01
      newData[index].weight = Math.round((item.weight + adjustment) * 100) / 100
      difference -= adjustment
      difference = Math.round(difference * 100) / 100
    })
  }

  return tokens.map(item => {
    if (!item.lock && item.token != null) {
      return newData.find(i => i.token.address === item.token.address) || item
    }
    return item
  })
}
function TokenItem({ token, index, setTokenSelected }) {
  const handleLockToken = useCallback(() => {
    setTokenSelected(prev => {
      const updatedTokens = [...prev]
      updatedTokens[index] = {
        ...updatedTokens[index],
        lock: !updatedTokens[index].lock,
      }
      return updateWeight(updatedTokens)
    })
  }, [index, setTokenSelected])

  const handleUpdateWeightToken = e => {
    setTokenSelected(prev => {
      const updatedTokens = [...prev]
      updatedTokens[index] = {
        ...updatedTokens[index],
        lock: !!updatedTokens[index].token,
        weight: Number(e.target.value),
      }
      return updateWeight(updatedTokens)
    })
  }

  return (
    <div className='flex h-11 w-[280px] items-center gap-2'>
      <div className='fex-row flex w-[220px] items-center justify-between rounded-lg border border-neutral-700 p-1'>
        <div className=' flex w-[40%] items-center gap-1 rounded-lg bg-[#29292980] bg-opacity-50 py-[6px] pl-[6px] pr-2'>
          <CircleImage width={24} height={24} src={token.token.logoURI || UNKNOWN_LOGO} />
          <Paragraph className='text-sm text-neutral-200'>{token.token.symbol}</Paragraph>
        </div>
        <Input
          className='w-[60%] border-none bg-transparent'
          classNames={{ input: 'bg-transparent p-0 border-none text-right pr-7' }}
          type='number'
          min={0}
          step={1}
          val={token.weight || ''}
          onChange={handleUpdateWeightToken}
          placeholder=''
          suffix='%'
        />
      </div>
      <EmphasisIconButton className='h-11 w-11' Icon={token.lock ? LockIcon : UnlockIcon} onClick={handleLockToken} />
    </div>
  )
}

export function ErrorMessage({ message, type = 'error', className, showIcon = true }) {
  return (
    <Box
      className={cn(
        'flex flex-row items-center gap-3 border border-primary-800 bg-primary-950',
        type === 'warn' ? 'border-warn-950 bg-warn-950' : '',
        className,
      )}
    >
      {showIcon && (
        <div className='flex h-10 w-10 items-center'>
          <InfoIcon className={cn('h-5 w-5 !stroke-primary-600', type === 'warn' ? '!stroke-warn-600' : '')} />
        </div>
      )}
      <div>{message}</div>
    </Box>
  )
}

export default function ChooseTokenAndWeights({ setTokenAndWeights, tokensAndWeights, setCurrentStep }) {
  const t = useTranslations()
  const [totalWeight, setTotalWeight] = useState(0)
  const [tokenSelected, setTokenSelected] = useState(tokensAndWeights)
  const { push } = useRouter()

  const { getValueTokenAmountToUSD } = useTokenUSDValue()
  useEffect(() => {
    const tokens = tokenSelected.filter(item => item.token !== null)
    setTotalWeight(tokens.reduce((sum, curr) => sum + curr.weight, 0))
    setTokenAndWeights(tokens)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTokenAndWeights, JSON.stringify(tokenSelected)])

  const totalBalance = useMemo(
    () =>
      tokensAndWeights.reduce((sum, curr) => {
        const { token } = curr
        if (token) {
          const { balance } = token
          const amountToWei = balance.toNumber()
          const usdValue = getValueTokenAmountToUSD(token.address, amountToWei)
          return sum + usdValue
        }
        return sum
      }, 0),
    [getValueTokenAmountToUSD, tokensAndWeights],
  )

  const checkAllWeightingHigherThanZero = useMemo(
    () => tokensAndWeights.every(item => item.weight > 0),
    [tokensAndWeights],
  )
  const renderMessages = useCallback(() => {
    const errorMessages = []

    if (tokensAndWeights.length <= 1 && tokenSelected.length <= 1) {
      errorMessages.push(t('You must add two tokens at least to create a weighted pool'))
    }

    if (!checkAllWeightingHigherThanZero) {
      errorMessages.push(t('All tokens in a pool must have a weighting higher than zero'))
    }

    if (totalWeight > 100) {
      errorMessages.push(t('Warning total weight Weighted Pool'))
    }

    return errorMessages.map((message, index) => <ErrorMessage key={index} message={message} />)
  }, [checkAllWeightingHigherThanZero, totalWeight, t, tokenSelected, tokensAndWeights])

  const isDisable = useMemo(
    () =>
      !checkAllWeightingHigherThanZero ||
      tokensAndWeights.length <= 1 ||
      tokenSelected.length <= 1 ||
      totalWeight > 100,
    [checkAllWeightingHigherThanZero, tokenSelected.length, tokensAndWeights.length, totalWeight],
  )

  return (
    <div className='flex flex-col gap-3'>
      {tokensAndWeights.length > 0 && totalBalance < 20000 ? (
        <ErrorMessage
          type='warn'
          message={t('We recommend you to provide new pools [symbol]', { yourBalance: formatAmount(totalBalance) })}
        />
      ) : (
        <></>
      )}
      {renderMessages()}
      <TextHeading className='font-archia text-2xl xl:text-3xl'>{t('Choose Tokens Weights')}</TextHeading>
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-3'>
        {tokenSelected.map((token, index) => (
          <TokenItem
            key={`${token?.token?.address}_${index}`}
            index={index}
            setTokenSelected={setTokenSelected}
            token={token}
            tokenSelected={tokenSelected}
          />
        ))}
      </div>
      <div className='flex flex-col'>
        <div className='flex flex-row justify-between'>
          <TextHeading>{t('Total Weight')}</TextHeading>
          <span>{totalWeight}%</span>
        </div>
        <div className='mt-3 inline-block h-3 w-full rounded-md bg-neutral-500'>
          <div
            style={{
              width: `${totalWeight > 100 ? 100 : totalWeight}%`,
            }}
            className='block h-full rounded-md bg-gradient-to-r from-[#B386FF] to-[#FF86FA]'
          />
        </div>
      </div>
      <div className='flex flex-col gap-4 lg:flex-row'>
        <EmphasisButton
          onClick={() => push('/pools/add-liquidity?step=2&pairType=Weighted')}
          className='w-full lg:w-fit'
        >
          {t('Back')}
        </EmphasisButton>
        <PrimaryButton
          disabled={isDisable}
          className='w-full lg:w-fit'
          onClick={() => setCurrentStep(prev => prev + 1)}
        >
          {t('Next')}
        </PrimaryButton>
      </div>
    </div>
  )
}
