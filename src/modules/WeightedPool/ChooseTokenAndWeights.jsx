'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'

import TokenBadge from '@/components/badges/TokenBadge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import { OutlineIconButton } from '@/components/buttons/IconButton'
import Input from '@/components/input'
import { TextHeading } from '@/components/typography'
import { useTokenUSDValue } from '@/hooks/usePrices'
import { cn, formatAmount, wrappedAddress } from '@/lib/utils'
import { ChevronDownIcon, InfoIcon, LockIcon, PlusIcon, TrashIcon, UnlockIcon } from '@/svgs'

import TokenModal from '../TokenModal'

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

function SelectTokenButton({ token, setTokenSelected, tokenSelected }) {
  const t = useTranslations()
  const [tokenPopup, setTokenPopup] = useState(false)
  const hiddenTokens = useMemo(() => tokenSelected.map(item => item?.token?.address), [tokenSelected])
  return (
    <>
      {token.token ? (
        <TokenBadge asset={token.token} onClick={() => setTokenPopup(true)} />
      ) : (
        <EmphasisButton
          className='h-10 w-[130px] !gap-1 rounded-full pl-[6px] pr-1 text-sm font-semibold text-neutral-200 transition-all duration-150 ease-out'
          onClick={() => setTokenPopup(true)}
        >
          {t('Select Token')} <ChevronDownIcon className='h-4 w-4 !stroke-neutral-200 text-neutral-200' />
        </EmphasisButton>
      )}
      <TokenModal
        popup={tokenPopup}
        setPopup={setTokenPopup}
        selectedAsset={token}
        setSelectedAsset={setTokenSelected}
        hiddenTokens={[...hiddenTokens]}
        showTrendingToken={false}
      />
    </>
  )
}

function TokenItem({ token, index, setTokenSelected, tokenSelected }) {
  const handleSelectedToken = useCallback(
    data => {
      setTokenSelected(prev => {
        const updatedTokens = [...prev]
        updatedTokens[index] = {
          ...updatedTokens[index],
          token: {
            ...data,
            address: wrappedAddress(data),
          },
        }
        return updateWeight(updatedTokens)
      })
    },
    [index, setTokenSelected],
  )

  const handleRemoveToken = useCallback(() => {
    setTokenSelected(prev => {
      const updatedTokens = [...prev]
      if (index > -1) {
        updatedTokens.splice(index, 1)
      }

      return updateWeight(updatedTokens)
    })
  }, [index, setTokenSelected])

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
    // const newVal = isNaN(Number(e.target.value)) || Number(e.target.value) < 0 ? 0 : Math.floor(Number(e.target.value))
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
    <div className='fex-row flex items-center justify-between px-4 py-[14px]'>
      <SelectTokenButton token={token} setTokenSelected={handleSelectedToken} tokenSelected={tokenSelected} />
      <div className='flex flex-row items-center'>
        <div className='mr-3'>
          <Input
            className='h-11 w-[70px] border-none bg-transparent'
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
        <OutlineIconButton className='mr-2' Icon={token.lock ? LockIcon : UnlockIcon} onClick={handleLockToken} />
        <OutlineIconButton Icon={TrashIcon} onClick={handleRemoveToken} />
      </div>
    </div>
  )
}

const initialToken = {
  token: null,
  lock: false,
  weight: 0,
}

export function ErrorMessage({ message, type = 'error', className }) {
  return (
    <Box
      className={cn(
        'flex flex-row items-center gap-3 border border-primary-800 bg-primary-950',
        type === 'warn' ? 'border-warn-950 bg-warn-950' : '',
        className,
      )}
    >
      <div className='flex h-10 w-10 items-center'>
        <InfoIcon className={cn('h-5 w-5 !stroke-primary-600', type === 'warn' ? '!stroke-warn-600' : '')} />
      </div>
      <div>{message}</div>
    </Box>
  )
}

export default function ChooseTokenAndWeights({ setTokenAndWeights, tokensAndWeights, setCurrentStep }) {
  const t = useTranslations()
  const [tokenSelected, setTokenSelected] = useState(
    tokensAndWeights.length > 0 ? tokensAndWeights : [initialToken, initialToken],
  )
  const idDefault = useId()
  const [totalWeight, setTotalWeight] = useState(0)

  const { getValueTokenAmountToUSD } = useTokenUSDValue()

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

  useEffect(() => {
    const tokens = tokenSelected.filter(item => item.token !== null)
    setTotalWeight(tokens.reduce((sum, curr) => sum + curr.weight, 0))
    setTokenAndWeights(tokens)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTokenAndWeights, JSON.stringify(tokenSelected)])

  const handleAddToken = useCallback(() => {
    setTokenSelected(prev => [...prev, initialToken])
  }, [setTokenSelected])

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

    return errorMessages.map((message, index) => <ErrorMessage key={index} message={message} />)
  }, [checkAllWeightingHigherThanZero, t, tokenSelected, tokensAndWeights])

  const isDisable = useMemo(
    () => !checkAllWeightingHigherThanZero || tokensAndWeights.length <= 1 || tokenSelected.length <= 1,
    [checkAllWeightingHigherThanZero, tokenSelected, tokensAndWeights],
  )

  return (
    <Box className='flex flex-col gap-3'>
      <TextHeading className='font-archia text-2xl xl:text-3xl'>{t('Choose Tokens and Weights')}</TextHeading>
      <div className='divide-y divide-neutral-700 rounded-xl border border-neutral-700'>
        {tokenSelected.map((token, index) => (
          <TokenItem
            key={idDefault}
            index={index}
            setTokenSelected={setTokenSelected}
            token={token}
            tokenSelected={tokenSelected}
          />
        ))}
      </div>
      <OutlinedButton
        disabled={tokenSelected.length >= 8}
        className={cn(
          'h-11 w-[130px] border border-primary-600 p-0 text-primary-600 hover:text-primary-600',
          tokenSelected.length >= 8 ? 'border-neutral-600 text-neutral-600 hover:text-neutral-600' : '',
        )}
        onClick={() => handleAddToken()}
      >
        <PlusIcon
          className={cn('h-4 w-4 !stroke-primary-600', tokenSelected.length >= 8 ? '!stroke-neutral-600' : '')}
        />
        {t('Add Token')}
      </OutlinedButton>
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
      {tokensAndWeights.length > 0 && totalBalance < 20000 ? (
        <ErrorMessage
          type='warn'
          message={t('We recommend you to provide new pools [symbol]', { yourBalance: formatAmount(totalBalance) })}
        />
      ) : (
        <></>
      )}
      {renderMessages()}
      <PrimaryButton disabled={isDisable} className='w-full' onClick={() => setCurrentStep(prev => prev + 1)}>
        {t('Next')}
      </PrimaryButton>
    </Box>
  )
}
