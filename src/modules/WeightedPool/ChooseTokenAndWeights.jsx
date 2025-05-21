'use client'

import { motion } from 'framer-motion'
import { isEmpty } from 'lodash'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import Box from '@/components/box'
import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { EmphasisIconButton } from '@/components/buttons/IconButton'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import CustomTooltip from '@/components/tooltip'
import { NewTextSubHeading, Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { cn } from '@/lib/utils'
import { InfoIcon, LockIcon, UnlockIcon, WarningTriangleIcon } from '@/svgs'

const updateWeight = tokens => {
  // Calculate the total weight of locked tokens
  const weightLocked = tokens.filter(item => item.lock).reduce((sum, cur) => sum + cur.weight, 0)

  // Filter out unlocked tokens that have a valid token property
  const tokenUnlock = tokens.filter(item => !item.lock && item.token != null)

  // If there are no unlocked tokens, return the original list
  if (tokenUnlock.length === 0) return tokens

  // Calculate the new weight for each unlocked token
  let newWeight = (100 - weightLocked) / tokenUnlock.length
  newWeight = Math.round(newWeight * 100) / 100

  let totalWeight = 0

  // Assign the new weight to each unlocked token
  const newData = tokenUnlock.map(i => {
    const roundedWeight = Math.round(newWeight * 100) / 100
    totalWeight += roundedWeight
    return {
      ...i,
      weight: roundedWeight,
    }
  })

  // Calculate any remaining difference due to rounding
  let difference = Math.round((100 - weightLocked - totalWeight) * 100) / 100

  // Adjust the weight to ensure the total is exactly 100
  if (difference !== 0) {
    newData.forEach((item, index) => {
      if (difference === 0) return

      // Adjust by 0.01 in the appropriate direction
      const adjustment = difference > 0 ? 0.01 : -0.01
      newData[index].weight = Math.round((item.weight + adjustment) * 100) / 100
      difference -= adjustment
      difference = Math.round(difference * 100) / 100
    })
  }

  // Merge the updated weights back into the original token list
  return tokens.map(item => {
    if (item.lock) return item
    if (!item.lock && item.token != null) {
      return newData.find(i => i.token.address === item.token.address) || item
    }
    return item
  })
}

function TokenItem({ token, index, setTokenSelected, max, checkError }) {
  const t = useTranslations()
  const handleLockToken = useCallback(() => {
    setTokenSelected(prev => {
      const updatedTokens = [...prev]
      updatedTokens[index] = {
        ...updatedTokens[index],
        lock: !updatedTokens[index].lock,
      }
      return updatedTokens
    })
  }, [index, setTokenSelected])

  const handleUpdateWeightToken = val => {
    let value = Number(val)
    if (value < 0) value = 0
    if (value > max) value = max
    if (value > 100) value = 100
    setTokenSelected(prev => {
      const updatedTokens = [...prev]
      updatedTokens[index] = {
        ...updatedTokens[index],
        lock: true,
        weight: isEmpty(val) ? null : value,
      }
      return updateWeight(updatedTokens)
    })
  }

  return (
    <div className='flex w-full flex-col gap-2'>
      <div className='flex w-full flex-row items-center gap-2'>
        <div
          className={cn(
            'fex-row flex min-h-11 w-[calc(100%-52px)] items-center rounded-lg border border-neutral-700 hover:bg-neutral-800',
            'focus-within:border-neutral-500 focus-within:hover:!bg-transparent',
            checkError && token.weight < 0.01 && 'border-error-600',
          )}
        >
          <div
            data-tooltip-id={`${token.token.address}-token`}
            className='ml-1 flex items-center gap-1 rounded-lg bg-[#29292980] bg-opacity-50 py-[6px] pl-[6px] pr-2'
          >
            <CircleImage alt='token logo' width={24} height={24} src={token.token.logoURI || UNKNOWN_LOGO} />
            <Paragraph className='text-sm text-neutral-200'>
              {token.token.symbol.length > 4 ? token.token.symbol.slice(0, 4) : token.token.symbol}
            </Paragraph>
            {token.token.symbol.length > 4 && (
              <CustomTooltip id={`${token.token.address}-token`}>{token.token.symbol}</CustomTooltip>
            )}
          </div>
          <Input
            className='h-11 w-full border-none bg-transparent'
            classNames={{ input: 'bg-transparent p-0 border-none text-right pr-8 h-11' }}
            type='number'
            max={max}
            val={`${token.weight}`.replace(/^0+(?=\d)/, '')}
            onChange={e => {
              let { value } = e.target
              if (value === '') {
                handleUpdateWeightToken('')
                return
              }
              if (!isNaN(Number(value))) {
                value = value.replace(/^0+(?=\d)/, '')
              }
              handleUpdateWeightToken(value)
            }}
            placeholder='Enter weight'
            suffix='%'
          />
        </div>
        <EmphasisIconButton className='h-11 w-11' Icon={token.lock ? LockIcon : UnlockIcon} onClick={handleLockToken} />
      </div>
      {Boolean(checkError && token.weight < 0.01) && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className='flex items-center gap-2'
        >
          <WarningTriangleIcon className='h-4 w-4' />
          <Paragraph className='text-sm text-error-600'>{t('Min [value] required', { value: 0.01 })}</Paragraph>
        </motion.div>
      )}
    </div>
  )
}

export function ErrorMessage({ message, type = 'error', className, showIcon = true }) {
  return (
    <Box
      className={cn(
        'flex flex-row items-center gap-3 rounded-lg border border-primary-800 bg-primary-950',
        type === 'warn' ? 'border-warn-950 bg-warn-950' : '',
        className,
      )}
    >
      {showIcon && (
        <div className='items-center'>
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
  const [totalWeightLock, setTotalWeightLock] = useState(0)
  const [tokenSelected, setTokenSelected] = useState(tokensAndWeights)
  const { push } = useRouter()
  const [checkError, setCheckError] = useState(false)

  useEffect(() => {
    const tokens = tokenSelected.filter(item => item.token !== null)
    setTotalWeight(tokens.reduce((sum, curr) => sum + curr.weight, 0))
    setTotalWeightLock(tokens.reduce((sum, curr) => sum + (curr.lock ? curr.weight : 0), 0))
    setTokenAndWeights(tokens)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTokenAndWeights, JSON.stringify(tokenSelected)])

  const checkAllWeightingHigherThanZero = useMemo(
    () => tokensAndWeights.every(item => item.weight > 0),
    [tokensAndWeights],
  )

  const isDisable = useMemo(
    () =>
      !checkAllWeightingHigherThanZero ||
      tokensAndWeights.length <= 1 ||
      tokenSelected.length <= 1 ||
      totalWeight !== 100,
    [checkAllWeightingHigherThanZero, tokenSelected.length, tokensAndWeights.length, totalWeight],
  )

  const renderMessages = useCallback(() => {
    const errorMessages = []
    if (!checkAllWeightingHigherThanZero) {
      errorMessages.push({
        title: 'Total Weights do not higher than 0.01',
        desc: t('All tokens in a pool must have a weighting higher than 0.01'),
      })
    }

    if (totalWeight !== 100) {
      errorMessages.push({
        title: t('Total Weights do not match 100%'),
        desc: t('The total weighting of all tokens must equal exactly 100% before you continue'),
      })
    }

    return errorMessages.map((data, index) => (
      <div
        className='flex items-center gap-2 rounded-lg border border-error-800 bg-error-950 px-4 py-5 lg:gap-4'
        key={index}
      >
        <WarningTriangleIcon className='w-4 min-w-4 lg:w-5 lg:min-w-5' />
        <div className='flex flex-col gap-1'>
          {data.title && <TextHeading className='text-xl text-rose'>{data.title}</TextHeading>}
          {data.desc && <TextSubHeading className='text-base text-rose'>{data.desc}</TextSubHeading>}
        </div>
      </div>
    ))
  }, [checkAllWeightingHigherThanZero, t, totalWeight])

  return (
    <div className='relative flex h-full flex-col gap-2 md:gap-4'>
      <div className='flex flex-col-reverse gap-4'>
        <NewTextSubHeading className='flex-2 lg:flex-1'>{t('Choose Tokens Weights')}</NewTextSubHeading>
        {checkError && <div className='flex flex-1 flex-col gap-2 lg:flex-2'>{checkError && renderMessages()}</div>}
      </div>
      <div
        className={cn(
          'grid grid-cols-1 gap-4 md:grid-cols-2 lg:mb-16 2xl:grid-cols-3',
          tokenSelected.length === 2 && '2xl:grid-cols-2',
          'max-lg:border-b max-lg:border-neutral-700 md:pb-4',
        )}
      >
        {tokenSelected.map((token, index) => (
          <TokenItem
            key={`${token?.token?.address}_${index}`}
            index={index}
            setTokenSelected={setTokenSelected}
            token={token}
            checkError={checkError}
            tokenSelected={tokenSelected}
            max={100 - (totalWeightLock - token.weight)}
            length={tokenSelected.length}
          />
        ))}
      </div>
      <div className='!mt-8 flex flex-col gap-2 md:mt-auto lg:absolute lg:-bottom-[92px] lg:flex-row lg:gap-4'>
        <EmphasisButton onClick={() => push('/pools')} className='w-full lg:w-fit'>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton
          className='w-full lg:w-fit'
          onClick={() => {
            if (isDisable) {
              setCheckError(true)
              return
            }
            setCurrentStep(2)
          }}
        >
          {t('Next')}
        </PrimaryButton>
      </div>
    </div>
  )
}
