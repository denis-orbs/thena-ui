import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Divider from '@/components/divider'
import { NewTextSubHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { useCustomAssets } from '@/context/customAssetsContext'
import { useUpdateSearchParams } from '@/hooks/useUpdateSearchParams'
import { getTokenInfo } from '@/lib/helper'
import SelectToken from '@/modules/Pools/SelectToken'
import ChoosePoolTokens from '@/modules/WeightedPool/ChoosePoolTokens'
import { tokensSelected } from '@/state/weightedPool/action'

import AvailablePools from './AvailablePools'

export default function ChooseTokensSection({ pairType }) {
  const { push } = useRouter()
  const searchParams = useSearchParams()
  const wrapperSelectRef = useRef(null)

  const [firstAsset, setFirstAsset] = useState(null)
  const [secondAsset, setSecondAsset] = useState(null)
  const [optionWidth, setOptionWidth] = useState(0)
  const [foundedPair, setFoundedPair] = useState(null)

  const t = useTranslations()
  const assets = useAssets()
  const customAssets = useCustomAssets()
  const updateSearchParams = useUpdateSearchParams()

  const firstAddress = searchParams.get('firstAddress')
  const secondAddress = searchParams.get('secondAddress')

  // for weighted pool
  const dispatch = useDispatch()
  const { tokens: tokensPool } = useSelector(state => state.weightedPool || [])
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

  useEffect(() => {
    if (pairType !== PAIR_TYPES.WEIGHTED && assets.length) {
      if (!firstAsset && firstAddress) {
        const asset = getTokenInfo({ tokenAddress: firstAddress, assets, customAssets })
        if (asset) {
          setFirstAsset(asset)
        }
      }

      if (!secondAsset && secondAddress) {
        const asset = getTokenInfo({ tokenAddress: secondAddress, assets, customAssets })
        if (asset) {
          setSecondAsset(asset)
        }
      }
    }
  }, [assets, customAssets, firstAddress, firstAsset, pairType, secondAddress, secondAsset])

  // Calculate width for dropdown
  useEffect(() => {
    if (wrapperSelectRef.current) {
      const { width } = wrapperSelectRef.current.getBoundingClientRect()
      if (optionWidth !== width) {
        setOptionWidth(width)
      }
    }
  }, [wrapperSelectRef, optionWidth])

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
                  updateSearchParams({ firstAddress: asset?.address })
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
                  updateSearchParams({ secondAddress: asset?.address })
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

            <AvailablePools tokens={[firstAsset, secondAsset]} pairType={pairType} setFoundedPool={setFoundedPair} />
          </>
        )}
        <div className='mt-5 flex gap-4 lg:mt-8'>
          <EmphasisButton onClick={() => updateSearchParams({ step: 1, firstAddress: null, secondAddress: null })}>
            {t('Back')}
          </EmphasisButton>
          <PrimaryButton
            disabled={pairType === PAIR_TYPES.WEIGHTED ? tokensPool?.length < 2 : !firstAsset || !secondAsset}
            onClick={() => {
              if (pairType !== PAIR_TYPES.WEIGHTED) {
                updateSearchParams(
                  {
                    step: 3,
                    ...(foundedPair
                      ? {
                          firstAddress: null,
                          secondAddress: null,
                          poolAddress: foundedPair.address,
                          pairType: null,
                        }
                      : {
                          poolAddress: null,
                        }),
                  },
                  true,
                )
              } else {
                push('/pools/weighted-pool/create')
              }
            }}
          >
            {pairType !== PAIR_TYPES.WEIGHTED && foundedPair ? t('Add to Pool') : t('Create New Pool')}
          </PrimaryButton>
        </div>
      </div>
    </>
  )
}
