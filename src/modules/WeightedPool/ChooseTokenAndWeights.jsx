'use client'

import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'

import TokenBadge from '@/components/badges/TokenBadge'
import Box from '@/components/box'
import { EmphasisButton, OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import { OutlineIconButton } from '@/components/buttons/IconButton'
import Input from '@/components/input'
import { TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, InfoIcon, LockIcon, PlusIcon, TrashIcon, UnlockIcon } from '@/svgs'

import TokenModal from '../TokenModal'

const updateAllocate = tokens => {
  const allocateLocked = tokens.filter(item => item.lock).reduce((sum, cur) => sum + cur.allocate, 0)
  const tokenUnlock = tokens.filter(item => !item.lock && item.token != null)
  if (tokenUnlock.length === 0) return tokens

  let newAllocate = (100 - allocateLocked) / tokenUnlock.length
  newAllocate = Math.round(newAllocate * 100) / 100

  let totalAllocated = 0
  const newData = tokenUnlock.map(i => {
    const roundedAllocate = Math.round(newAllocate * 100) / 100
    totalAllocated += roundedAllocate
    return {
      ...i,
      allocate: roundedAllocate,
    }
  })

  let difference = Math.round((100 - allocateLocked - totalAllocated) * 100) / 100

  if (difference !== 0) {
    newData.forEach((item, index) => {
      if (difference === 0) return

      const adjustment = difference > 0 ? 0.01 : -0.01
      newData[index].allocate = Math.round((item.allocate + adjustment) * 100) / 100
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
  const hiddenTokens = useMemo(() => tokenSelected.map(item => item?.token?.address.toLowerCase()), [tokenSelected])
  return (
    <>
      {token.token ? (
        <TokenBadge asset={token.token} onClick={() => setTokenPopup(true)} />
      ) : (
        <EmphasisButton
          className='h-10 w-[130px] rounded-full p-1 text-sm font-semibold text-neutral-200 transition-all duration-150 ease-out'
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
          token: data,
        }
        return updateAllocate(updatedTokens)
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

      return updateAllocate(updatedTokens)
    })
  }, [index, setTokenSelected])

  const handleLockToken = useCallback(() => {
    setTokenSelected(prev => {
      const updatedTokens = [...prev]
      console.log({ updatedTokens })
      updatedTokens[index] = {
        ...updatedTokens[index],
        lock: !updatedTokens[index].lock,
      }
      return updateAllocate(updatedTokens)
    })
  }, [index, setTokenSelected])

  const handleUpdateAllocateToken = e => {
    const newVal = isNaN(Number(e.target.value)) || Number(e.target.value) < 0 ? 0 : Math.floor(Number(e.target.value))
    setTokenSelected(prev => {
      const updatedTokens = [...prev]
      updatedTokens[index] = {
        ...updatedTokens[index],
        lock: !!updatedTokens[index].token,
        allocate: newVal,
      }
      return updateAllocate(updatedTokens)
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
            min={0}
            step={1}
            val={token.allocate || ''}
            onChange={handleUpdateAllocateToken}
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
  allocate: 0,
}

export function ErrorMessage({ message, type = 'error', className }) {
  return (
    <Box
      className={cn(
        'flex flex-row items-center gap-3 border border-primary-800 bg-primary-950',
        type === 'warn' ? 'bg-warn-950' : '',
        className,
      )}
    >
      <InfoIcon className={cn('h-5 w-5 !stroke-primary-600', type === 'warn' ? '!stroke-warn-600' : '')} />
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
  const [totalAllocated, setTotalAllocated] = useState(0)

  useEffect(() => {
    const tokens = tokenSelected.filter(item => item.token !== null)
    setTotalAllocated(tokens.reduce((sum, curr) => sum + curr.allocate, 0))
    setTokenAndWeights(tokens)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTokenAndWeights, JSON.stringify(tokenSelected)])

  const handleAddToken = useCallback(() => {
    setTokenSelected(prev => [...prev, initialToken])
  }, [setTokenSelected])

  const checkAllWeightingHigherThanZero = useMemo(
    () => tokensAndWeights.every(item => item.allocate > 0),
    [tokensAndWeights],
  )
  const renderMessage = useCallback(() => {
    if (tokensAndWeights.length === 1 && tokenSelected.length === 1) {
      return <ErrorMessage message={t('You must add two tokens at least to create a weighted pool')} />
    }
    if (!checkAllWeightingHigherThanZero) {
      return <ErrorMessage message={t('All tokens in a pool must have a weighting higher than zero')} />
    }
  }, [checkAllWeightingHigherThanZero, t, tokenSelected.length, tokensAndWeights.length])

  const isDisable = useMemo(
    () => !checkAllWeightingHigherThanZero || (tokensAndWeights.length === 1 && tokenSelected.length === 1),
    [checkAllWeightingHigherThanZero, tokenSelected.length, tokensAndWeights.length],
  )

  return (
    <Box className='flex flex-col gap-3'>
      <TextHeading className='font-archia text-3xl'>{t('Choose Tokens and Weights')}</TextHeading>
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
          <TextHeading>{t('Total Allocated')}</TextHeading>
          <span>{totalAllocated}%</span>
        </div>
        <div className='mt-3 inline-block h-3 w-full rounded-md bg-neutral-500'>
          <div
            style={{
              width: `${totalAllocated > 100 ? 100 : totalAllocated}%`,
            }}
            className='block h-full rounded-md bg-gradient-to-r from-[#B386FF] to-[#FF86FA]'
          />
        </div>
      </div>
      {renderMessage()}
      <PrimaryButton disabled={isDisable} className='w-full' onClick={() => setCurrentStep(prev => prev + 1)}>
        {t('Next')}
      </PrimaryButton>
    </Box>
  )
}
