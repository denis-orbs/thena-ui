import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import AvailablePools from '@/app/pools/(add-liquidity)/add-liquidity/Step2/AvailablePools'
import { NewTextSubHeading, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { cn, wrappedAddress } from '@/lib/utils'
import { PoolCoinsIcon } from '@/svgs'

import SelectToken from '../Pools/SelectToken'

function ChoosePoolTokens({ setTokensSelect, isShowError }) {
  const t = useTranslations()
  const { tokens: tokensPool } = useSelector(state => state.weightedPool || [])
  const [tokens, setTokens] = useState([...(tokensPool || [])])
  const wrapperSelectRef = useRef(null)
  const [optionWidth, setOptionWidth] = useState()
  const [length, setLength] = useState(2)

  const updateTokens = useCallback((token, index) => {
    if (token) {
      setTokens(prev => {
        const updateData = [...prev]
        updateData[index] = token
        return updateData
      })
    }
  }, [])
  useEffect(() => {
    if (wrapperSelectRef?.current) {
      const { width } = wrapperSelectRef.current.getBoundingClientRect()
      setOptionWidth(width)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapperSelectRef?.current])

  const finalListTokens = useMemo(() => (tokens.slice(0, length) || []).filter(item => Boolean(item)), [tokens, length])
  const duplicateAddresses = useMemo(() => {
    const addressMap = new Map()
    const duplicates = new Set()

    if (finalListTokens.length <= 0) return []
    finalListTokens.forEach(token => {
      if (addressMap.has(wrappedAddress(token))) {
        duplicates.add(wrappedAddress(token))
      } else {
        addressMap.set(wrappedAddress(token), true)
      }
    })

    const result = Array.from(duplicates)
    return result
  }, [finalListTokens])

  const tokensList = useMemo(
    () => (
      <>
        {Array.from({ length }, (_, index) => index + 1).map((_, index) => (
          <SelectToken
            key={`${index}_${tokens?.[index]?.address}`}
            setSelectedAsset={item => {
              updateTokens(item, index)
            }}
            placeHolder={t('Select Token')}
            selectedAsset={tokens?.[index]}
            dropdownAlign={index % 2 === 0 ? 'left' : 'right'}
            optionWidth={optionWidth}
            isError={
              (isShowError && finalListTokens.length < 2 && !tokens?.[index]) ||
              duplicateAddresses.includes(wrappedAddress(tokens?.[index]))
            }
            errorMessage={
              length === 2 && !tokens?.[index] ? t('Select token') : t('You can not select the same token twice')
            }
          />
        ))}
      </>
    ),
    [duplicateAddresses, finalListTokens.length, isShowError, length, optionWidth, t, tokens, updateTokens],
  )

  useEffect(() => {
    if (finalListTokens.length > 0) setTokensSelect(finalListTokens)
  }, [finalListTokens, setTokensSelect])

  return (
    <div className='w-full space-y-8'>
      <div className='space-y-2 lg:space-y-4'>
        <NewTextSubHeading>{t('Choose Pool Tokens')}</NewTextSubHeading>
        <div className='grid h-9 grid-cols-7 rounded-lg bg-neutral-800 p-1 lg:h-11'>
          {[2, 3, 4, 5, 6, 7, 8].map(value => (
            <div
              key={value}
              onClick={() => {
                setLength(value)
              }}
              className={cn(
                'h-7 cursor-pointer rounded-md px-2 py-1 hover:bg-neutral-600 lg:h-9 lg:px-3 lg:py-2',
                length === value && 'bg-neutral-700',
              )}
            >
              <div className='mx-auto flex w-fit items-center gap-[2px] lg:gap-2'>
                <TextHeading className='text-xs text-neutral-300 lg:text-sm'>{value}</TextHeading>
                <PoolCoinsIcon className='h-5 w-5 stroke-neutral-300' />
              </div>
            </div>
          ))}
        </div>
        <div
          ref={wrapperSelectRef}
          className={cn(
            'grid grid-cols-1 gap-4 pb-8 lg:grid-cols-2',
            finalListTokens.length >= 2 && 'border-b border-neutral-700',
          )}
        >
          {tokensList}
        </div>
      </div>
      {finalListTokens.length >= 2 && <AvailablePools tokens={finalListTokens} pairType={PAIR_TYPES.WEIGHTED} />}
    </div>
  )
}

export default ChoosePoolTokens
