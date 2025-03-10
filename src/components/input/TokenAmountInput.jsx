import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { WBNB } from 'thena-sdk-core'
import { useBalance, useReadContract } from 'wagmi'

import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Tabs from '@/components/tabs'
import { TextSubHeading } from '@/components/typography'
import { ERC20Abi } from '@/constant/abi'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { cn, formatAmount, fromWei } from '@/lib/utils'
import SelectTokenFromList from '@/modules/SelectTokenModal/SelectTokenFromList'
import TokenModal from '@/modules/TokenModal'

import TokenBadge from '../badges/TokenBadge'
import AssetDropdown from '../dropdown/AssetDropdown'
import Skeleton from '../skeleton'

export function TokenAmountInput({
  asset,
  setAsset,
  maxBalance = null,
  amount,
  onAmountChange,
  title,
  autoFocus = false,
  weight,
  showPercent = true,
  assetsSelect,
  classNames,
}) {
  const assets = useAssets()
  const t = useTranslations()
  const { account } = useWallet()

  const { data: balanceOf } = useReadContract({
    abi: ERC20Abi,
    address: asset?.address,
    functionName: 'balanceOf',
    args: [account],
    query: {
      enabled: !!asset && Boolean(account) && asset?.address !== 'BNB',
    },
  })

  const { data: nativeBalance } = useBalance({
    address: account,
  })

  const max = useMemo(() => {
    if (maxBalance) {
      return maxBalance
    }

    return asset?.address === 'BNB'
      ? fromWei(nativeBalance?.value || 0n, 18)
      : fromWei(balanceOf || 0n, asset?.decimals)
  }, [asset?.address, asset?.decimals, balanceOf, maxBalance, nativeBalance])

  const data = useMemo(
    () => assets.filter(item => item.address === 'BNB' || item.address === WBNB[item.chainId]?.address?.toLowerCase()),
    [assets],
  )

  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => onAmountChange(max.times(0.1).dp(asset.decimals).toString(10)),
      },
      {
        label: '25%',
        onClickHandler: () => onAmountChange(max.times(0.25).dp(asset.decimals).toString(10)),
      },
      {
        label: '50%',
        onClickHandler: () => onAmountChange(max.times(0.5).dp(asset.decimals).toString(10)),
      },
      {
        label: 'Max',
        onClickHandler: () => onAmountChange(max.dp(asset.decimals).toString(10)),
      },
    ],
    [asset, max, onAmountChange],
  )

  const inputRefer = useRef(null)
  const onfocusInput = useCallback(() => {
    if (inputRefer && inputRefer.current) {
      inputRefer.current.focus()
    }
  }, [])

  const [tokenPopup, setTokenPopup] = useState(false)
  const wrapAssetsData = useMemo(
    () =>
      (assetsSelect || []).map(item => ({
        ...item,
        symbol: item.name === 'Wrapped BNB' ? 'WBNB' : item.symbol,
      })),
    [assetsSelect],
  )

  return (
    <div className='flex flex-col gap-2'>
      {(typeof title === 'string' || showPercent) && (
        <div className='flex items-center justify-between'>
          {title && <p className={cn('font-medium text-white', classNames?.title)}>{title}</p>}
          {showPercent && <Tabs data={percents} />}
        </div>
      )}
      <div
        className={cn(
          'flex cursor-text flex-col gap-1 self-stretch rounded-xl px-4 py-3 lg:gap-3 lg:py-4',
          'border border-neutral-700 hover:bg-neutral-700 [&:has(.hover-dont-change-bg:hover)]:bg-transparent',
          'focus-within:border-neutral-500 focus-within:hover:!bg-transparent',
          classNames?.input,
        )}
        onClick={onfocusInput}
      >
        <div className='flex items-center justify-between gap-2'>
          <input
            ref={inputRefer}
            type='number'
            className='w-full border-0 bg-transparent p-0 text-xl text-neutral-50 placeholder-neutral-400'
            placeholder='0.0'
            value={amount ?? ''}
            onChange={e => {
              onAmountChange(Number(e.target.value) < 0 ? '' : e.target.value)
            }}
            min={0}
            autoFocus={autoFocus}
          />
          {setAsset ? (
            <>
              {Array.isArray(assetsSelect) ? (
                <TokenBadge
                  className={cn(
                    'inline-flex items-center justify-center gap-2',
                    'rounded-lg bg-[#29292980] text-sm text-neutral-200 hover:bg-neutral-700',
                    'py-0.5 pl-1 pr-1.5 lg:py-1.5 lg:pl-1.5 lg:pr-2',
                    'hover-dont-change-bg cursor-pointer',
                    Boolean(maxBalance) && 'w-[220px]',
                  )}
                  asset={asset}
                  onClick={() => setTokenPopup(true)}
                  isDouble={Boolean(maxBalance)}
                />
              ) : (
                <AssetDropdown
                  className='hover-dont-change-bg hover:rounded-lg hover:bg-neutral-700 [&>#info]:!rounded-lg [&>#info]:!bg-[#292929] [&>#info]:!bg-opacity-50'
                  selected={asset}
                  setSelected={setAsset}
                  data={data}
                />
              )}
            </>
          ) : asset ? (
            <div
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'rounded-lg bg-[#29292980] text-sm text-neutral-200',
                'py-1.5 pl-1.5 pr-2',
                'cursor-default',
              )}
            >
              {maxBalance ? (
                <IconGroup
                  className='-space-x-2'
                  classNames={{
                    image: 'outline-2 w-6 h-6',
                  }}
                  logo1='https://cdn.thena.fi/assets/BSC.png'
                  logo2='https://cdn.thena.fi/assets/BNB.png'
                />
              ) : (
                <CircleImage alt='thena' className='h-6 w-6' src={asset.logoURI ?? ''} />
              )}
              <span className='text-nowrap'>
                {`${maxBalance ? 'BNB + WBNB' : asset.symbol} ${weight ? `(${weight}%)` : ''}`}
              </span>
            </div>
          ) : (
            <Skeleton className='h-6 w-10' />
          )}
        </div>
        <div className='flex items-center justify-between gap-2'>
          <TextSubHeading>${formatAmount(amount * (asset?.price || 0))}</TextSubHeading>
          <TextSubHeading className='space-x-2'>
            <span>
              {t('Balance')}: {formatAmount(max)}
            </span>
            <span
              onClick={() => onAmountChange(max.dp(asset.decimals).toString(10))}
              className={cn('cursor-pointer text-primary-600 hover:text-primary-400', max?.eq(0) && 'hidden')}
            >
              {t('Max')}
            </span>
          </TextSubHeading>
        </div>
      </div>
      {Array.isArray(assetsSelect) && (
        <>
          {assetsSelect.length > 0 ? (
            <SelectTokenFromList
              setIsOpen={setTokenPopup}
              isOpen={tokenPopup}
              selectedAsset={asset}
              tokens={wrapAssetsData}
              setToken={setAsset}
            />
          ) : (
            <TokenModal
              popup={tokenPopup}
              setPopup={setTokenPopup}
              selectedAsset={asset}
              setSelectedAsset={setAsset}
              otherAsset={() => {}}
              setOtherAsset={() => {}}
              isHideTrending
            />
          )}
        </>
      )}
    </div>
  )
}
