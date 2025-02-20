import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import AvailablePools from '@/app/pools/add-liquidity/Step2/AvailablePools'
import { NewTextSubHeading, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useUpdateSearchParams } from '@/hooks/useUpdateSearchParams'
import { cn } from '@/lib/utils'
import { PoolCoinsIcon } from '@/svgs'

import SelectToken from '../Pools/SelectToken'

function ChoosePoolTokens({ setTokensSelect }) {
  const t = useTranslations()
  const { tokens: tokensPool } = useSelector(state => state.weightedPool || [])
  const [tokens, setTokens] = useState([...(tokensPool || [])])
  const wrapperSelectRef = useRef(null)
  const [optionWidth, setOptionWidth] = useState()
  const updateSearchParams = useUpdateSearchParams()
  const searchParams = useSearchParams()
  const length = searchParams.get('totalToken') || 2

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

  const finalListTokens = useMemo(() => tokens.slice(0, length), [tokens, length])

  const tokensList = useMemo(() => {
    const hiddenTokens = finalListTokens.map(token => token.address)
    return (
      <>
        {Array.from({ length }, (_, index) => index + 1).map((_, index) => (
          <SelectToken
            key={tokens?.[index]?.address || index}
            setSelectedAsset={item => {
              updateTokens(item, index)
            }}
            placeHolder={t('Select Token')}
            selectedAsset={tokens?.[index]}
            dropdownAlign={index % 2 === 0 ? 'left' : 'right'}
            optionWidth={optionWidth}
            hiddenTokens={hiddenTokens}
          />
        ))}
      </>
    )
  }, [finalListTokens, length, optionWidth, t, tokens, updateTokens])

  useEffect(() => {
    if (finalListTokens.length > 0) setTokensSelect(finalListTokens)
  }, [finalListTokens, setTokensSelect])

  return (
    <div className='w-full space-y-8'>
      <div className='space-y-4'>
        <NewTextSubHeading>{t('Choose Pool Tokens')}</NewTextSubHeading>
        <div className='grid grid-cols-7 rounded-lg bg-neutral-800 p-1'>
          {[2, 3, 4, 5, 6, 7, 8].map(value => (
            <div
              key={value}
              onClick={() => updateSearchParams({ totalToken: value })}
              className={cn('cursor-pointer rounded-md px-3 py-2 max-sm:px-1', length === value && 'bg-neutral-700')}
            >
              <div className='mx-auto flex w-fit items-center gap-2 max-sm:gap-1'>
                <TextHeading>{value}</TextHeading>
                <PoolCoinsIcon className='h-5 w-5' />
              </div>
            </div>
          ))}
        </div>
        <div ref={wrapperSelectRef} className='grid grid-cols-1 gap-4 border-b border-neutral-700 pb-8 lg:grid-cols-2'>
          {tokensList}
        </div>
      </div>
      {finalListTokens.length >= 2 && finalListTokens.length === length && (
        <AvailablePools tokens={finalListTokens} pairType={PAIR_TYPES.WEIGHTED} />
      )}
    </div>
  )
}

export default ChoosePoolTokens
