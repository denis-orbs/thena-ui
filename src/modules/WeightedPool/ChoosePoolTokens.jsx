import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import AvailablePools from '@/app/pools/add-liquidity/Step2/AvailablePools'
import { TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { cn } from '@/lib/utils'
import { PoolCoinsIcon } from '@/svgs'

import SelectToken from '../Pools/SelectToken'

function ChoosePoolTokens({ setTokensSelect }) {
  const t = useTranslations()
  const [length, setLength] = useState(2)
  const { tokens: tokensPool } = useSelector(state => state.weightedPool || [])
  const [tokens, setTokens] = useState([...(tokensPool || [])])
  const wrapperSelectRef = useRef(null)
  const [optionWidth, setOptionWidth] = useState()

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
    if (wrapperSelectRef.current) {
      const { width } = wrapperSelectRef.current.getBoundingClientRect()
      setOptionWidth(width)
    }
  }, [wrapperSelectRef])

  const tokensList = useMemo(
    () => (
      <>
        {Array.from({ length }, (_, index) => index + 1).map((_, index) => (
          <SelectToken
            key={index}
            setSelectedAsset={item => {
              updateTokens(item, index)
            }}
            placeHolder={t('Select Token')}
            selectedAsset={tokens?.[index]}
            dropdownAlign={index % 2 === 0 ? 'left' : 'right'}
            optionWidth={optionWidth}
          />
        ))}
      </>
    ),
    [length, optionWidth, t, tokens, updateTokens],
  )

  const finalListTokens = useMemo(() => tokens.slice(0, length), [tokens, length])

  useEffect(() => {
    if (finalListTokens.length > 0) setTokensSelect(finalListTokens)
  }, [finalListTokens, setTokensSelect])

  return (
    <div className='w-full space-y-8' ref={wrapperSelectRef}>
      <div className='space-y-4'>
        <TextHeading>{t('Choose Pool Tokens')}</TextHeading>
        <div className='grid grid-cols-7 rounded-lg bg-neutral-800 p-1'>
          {[2, 3, 4, 5, 6, 7, 8].map(value => (
            <div
              key={value}
              onClick={() => setLength(value)}
              className={cn('cursor-pointer rounded-md px-3 py-2 max-sm:px-1', length === value && 'bg-neutral-700')}
            >
              <div className='mx-auto flex w-fit items-center gap-2 max-sm:gap-1'>
                <TextHeading>{value}</TextHeading>
                <PoolCoinsIcon className='h-5 w-5' />
              </div>
            </div>
          ))}
        </div>
        <div className='grid grid-cols-1 gap-4 border-b border-neutral-700 pb-8 lg:grid-cols-2'>{tokensList}</div>
      </div>
      {finalListTokens.length >= 2 && <AvailablePools tokens={finalListTokens} pairType={PAIR_TYPES.WEIGHTED} />}
    </div>
  )
}

export default ChoosePoolTokens
