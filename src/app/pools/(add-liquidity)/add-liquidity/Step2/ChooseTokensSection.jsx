import BigNumber from 'bignumber.js'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Divider from '@/components/divider'
import { NewTextSubHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { useAssets } from '@/context/assetsContext'
import { useCustomAssets } from '@/context/customAssetsContext'
import { useUpdateSearchParams } from '@/hooks/useUpdateSearchParams'
import { getTokenInfo } from '@/lib/helper'
import { wrappedAddress } from '@/lib/utils'
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
  const [isShowError, setShowError] = useState(false)

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
            balance:
              typeof token?.balance !== 'number'
                ? (token?.balance || new BigNumber(0)).toNumber()
                : token?.balance || 0,
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

  // for weighted
  const duplicateAddresses = useMemo(() => {
    const addressMap = new Map()
    const duplicates = new Set()

    if ((tokensPool || []).length <= 0) return []
    tokensPool.forEach(token => {
      if (addressMap.has(wrappedAddress(token))) {
        duplicates.add(wrappedAddress(token))
      } else {
        addressMap.set(wrappedAddress(token), true)
      }
    })

    const result = Array.from(duplicates)
    return result
  }, [tokensPool])

  useEffect(() => {
    if (firstAddress && secondAddress && firstAddress !== secondAddress) {
      setShowError(false)
    }
  }, [firstAddress, secondAddress])

  const handleAddPool = useCallback(() => {
    if (pairType !== PAIR_TYPES.WEIGHTED) {
      if (!firstAddress || !secondAddress || firstAddress === secondAddress) {
        setShowError(true)
        return
      }
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
      if (duplicateAddresses.length > 0 || (tokensPool || []).length < 2) {
        setShowError(true)
        return
      }
      push('/pools/add-liquidity/weighted/create')
    }
  }, [
    duplicateAddresses.length,
    firstAddress,
    foundedPair,
    pairType,
    push,
    secondAddress,
    tokensPool,
    updateSearchParams,
  ])

  return (
    <>
      <div className='flex flex-col gap-5 lg:gap-8'>
        {pairType === PAIR_TYPES.WEIGHTED ? (
          <ChoosePoolTokens setTokensSelect={updateTokensSelected} isShowError={isShowError} />
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
                isError={isShowError && secondAddress}
                errorMessage={!firstAddress ? t('Select token') : t('You can not select the same token twice')}
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
                isError={isShowError && firstAddress}
                errorMessage={!secondAddress ? t('Select token') : t('You can not select the same token twice')}
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
          <PrimaryButton onClick={handleAddPool}>
            {pairType !== PAIR_TYPES.WEIGHTED && foundedPair ? t('Add to Pool') : t('Create New Pool')}
          </PrimaryButton>
        </div>
      </div>
    </>
  )
}
