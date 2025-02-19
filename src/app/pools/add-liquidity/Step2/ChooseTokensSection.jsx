import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Divider from '@/components/divider'
import { NewTextSubHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import SelectToken from '@/modules/Pools/SelectToken'
import ChoosePoolTokens from '@/modules/WeightedPool/ChoosePoolTokens'
import { tokensSelected } from '@/state/weightedPool/action'

import AvailablePools from './AvailablePools'

export default function ChooseTokensSection({ pairType, setStep }) {
  const t = useTranslations()
  const [firstAsset, setFirstAsset] = useState(null)
  const [secondAsset, setSecondAsset] = useState(null)
  const wrapperSelectRef = useRef(null)
  const [optionWidth, setOptionWidth] = useState(0)
  const searchParams = useSearchParams()
  const { replace } = useRouter()

  // for weighted pool
  const dispatch = useDispatch()
  const { push } = useRouter()
  const { tokens: tokensPool } = useSelector(state => state.weightedPool || [])
  // update token for weighted pool
  const updateTokensSelected = useCallback(
    tokens => {
      dispatch(
        tokensSelected({
          tokens: tokens.map(token => ({
            ...token,
            // to save to redux
            balance: typeof token.balance !== 'number' ? token.balance.toNumber() : token.balance,
          })),
        }),
      )
    },
    [dispatch],
  )

  // Calculate width for dropdown
  useEffect(() => {
    if (wrapperSelectRef.current) {
      const { width } = wrapperSelectRef.current.getBoundingClientRect()
      setOptionWidth(width)
    }
  }, [wrapperSelectRef])

  const updateSearchParams = useCallback(
    updates => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      const newPathname = `${window.location.pathname}?${params.toString()}`
      replace(newPathname)
    },
    [replace, searchParams],
  )

  return (
    <>
      <div className='flex flex-col gap-5 lg:gap-8'>
        {pairType === PAIR_TYPES.WEIGHTED ? (
          <ChoosePoolTokens setTokensSelect={updateTokensSelected} />
        ) : (
          <div className='flex flex-col gap-2'>
            <NewTextSubHeading>{t('Choose Tokens')}</NewTextSubHeading>
            <div className='grid gap-3 md:grid-cols-2' ref={wrapperSelectRef}>
              <SelectToken
                otherAsset={secondAsset}
                setSelectedAsset={asset => {
                  setFirstAsset(asset)
                  if (asset) {
                    updateSearchParams({ firstAddress: asset.address })
                  }
                }}
                placeHolder={t('Select Token')}
                selectedAsset={firstAsset}
                dropdownAlign='left'
                optionWidth={optionWidth}
              />
              <SelectToken
                otherAsset={firstAsset}
                setSelectedAsset={asset => {
                  setSecondAsset(asset)
                  if (asset) {
                    updateSearchParams({ secondAddress: asset.address })
                  }
                }}
                placeHolder={t('Select Token')}
                selectedAsset={secondAsset}
                dropdownAlign='right'
                optionWidth={optionWidth}
              />
            </div>
          </div>
        )}

        {firstAsset && secondAsset && (
          <>
            <Divider />

            <AvailablePools tokens={[firstAsset, secondAsset]} pairType={pairType} />
          </>
        )}

        <div className='mt-5 flex gap-4 lg:mt-8'>
          <EmphasisButton onClick={() => setStep(1)}>{t('Back')}</EmphasisButton>
          <PrimaryButton
            disabled={pairType !== PAIR_TYPES.WEIGHTED ? !firstAsset || !secondAsset : (tokensPool || []).length < 2}
            onClick={() => {
              if (pairType !== PAIR_TYPES.WEIGHTED) {
                setStep(3)
              } else {
                push('/pools/weighted-pool/create')
              }
            }}
          >
            {t(pairType !== PAIR_TYPES.WEIGHTED ? 'Next' : 'Create New Pool')}
          </PrimaryButton>
        </div>
      </div>
    </>
  )
}
