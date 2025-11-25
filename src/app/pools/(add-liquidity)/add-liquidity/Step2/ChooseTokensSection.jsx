import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import { useCallback, useEffect, useRef, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Divider from '@/components/divider'
import { NewTextSubHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useCustomAssets } from '@/context/customAssetsContext'
import { useBackURL } from '@/hooks/useBackURL'
import { useUpdateSearchParams } from '@/hooks/useUpdateSearchParams'
import { getTokenInfo } from '@/lib/helper'
import SelectToken from '@/modules/Pools/SelectToken'
import { wrappedAddress } from '@/utils/utils'

import AvailablePools from './AvailablePools'

export default function ChooseTokensSection({ pairType }) {
  const { push } = useRouter()
  const searchParams = useSearchParams()
  const wrapperSelectRef = useRef(null)
  const backUrl = useBackURL()

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

  useEffect(() => {
    if (assets.length) {
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

  useEffect(() => {
    if (firstAddress && secondAddress && wrappedAddress(firstAsset) !== wrappedAddress(secondAsset)) {
      setShowError(false)
    }
  }, [firstAddress, secondAddress, firstAsset, secondAsset])

  const handleAddPool = useCallback(() => {
    if (!firstAddress || !secondAddress || wrappedAddress(firstAsset) === wrappedAddress(secondAsset)) {
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
  }, [firstAddress, firstAsset, foundedPair, secondAddress, secondAsset, updateSearchParams])

  return (
    <div className='flex h-full flex-col gap-6'>
      <div className='grow'>
        <div className='flex flex-col gap-2 md:gap-4 lg:gap-6'>
          <NewTextSubHeading className='3xl:text-3xl text-lg 2xl:text-2xl'>{t('Choose Tokens')}</NewTextSubHeading>
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
        {firstAsset && secondAsset && (
          <>
            <Divider className='my-4 lg:my-8' />
            <AvailablePools tokens={[firstAsset, secondAsset]} pairType={pairType} setFoundedPool={setFoundedPair} />
          </>
        )}
      </div>

      <div className='flex flex-col gap-2 lg:flex-row lg:gap-4'>
        <EmphasisButton className='hidden 2xl:flex' onClick={() => push('/pools')}>
          {t('Cancel')}
        </EmphasisButton>
        <EmphasisButton className='flex 2xl:hidden' onClick={() => push(backUrl)}>
          {t('Back')}
        </EmphasisButton>
        <PrimaryButton onClick={handleAddPool}>{foundedPair ? t('Add to Pool') : t('Create New Pool')}</PrimaryButton>
      </div>
    </div>
  )
}
