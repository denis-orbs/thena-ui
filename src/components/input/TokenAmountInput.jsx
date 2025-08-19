import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WBNB } from 'thena-sdk-core'
import { useBalance, useReadContract } from 'wagmi'

import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Tabs from '@/components/tabs'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { SELECT_TOKEN_STYLE, UNKNOWN_LOGO } from '@/constant'
import { ERC20Abi } from '@/constant/abi'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { useWindowSize } from '@/hooks/useWindowSize'
import { cn, formatAmount, fromWei } from '@/lib/utils'
import SelectToken from '@/modules/Pools/SelectToken'
import SelectTokenFromList from '@/modules/SelectTokenModal/SelectTokenFromList'
import TokenModal from '@/modules/TokenModal'

import AssetDropdown from '../dropdown/AssetDropdown'
import Skeleton from '../skeleton'

/**
 * @param {Object} props
 * @param {import('bignumber.js').BigNumber} maxBalance, ether value
 * @param {string} props.amount, ether value
 */
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
  isSmall = false,
  isSwapChainLink = false,
  singleMode = false,
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
        onClickHandler: () => onAmountChange(max.times(0.1).dp(asset?.decimals).toString(10)),
      },
      {
        label: '25%',
        onClickHandler: () => onAmountChange(max.times(0.25).dp(asset?.decimals).toString(10)),
      },
      {
        label: '50%',
        onClickHandler: () => onAmountChange(max.times(0.5).dp(asset?.decimals).toString(10)),
      },
      {
        label: 'Max',
        onClickHandler: () => onAmountChange(max.dp(asset?.decimals).toString(10)),
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

  const windowSize = useWindowSize()
  const [optionWidth, setOptionWidth] = useState()
  const wrapperSelectRef = useRef(null)
  useEffect(() => {
    if (wrapperSelectRef?.current) {
      const { width } = wrapperSelectRef.current.getBoundingClientRect()
      setOptionWidth(width - 32)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapperSelectRef?.current, windowSize])

  const isInvalidAmount = useMemo(() => {
    if (amount === '' || amount === '0') return false
    if (Number(amount) === Number.isNaN || Number(amount) < 0) return true
    if (max) {
      if (max.lt(amount)) return true
    }

    return false
  }, [amount, max])

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
          'flex cursor-text flex-col gap-1 self-stretch rounded-xl px-4 py-3 lg:gap-2 lg:py-4',
          'outline-1 outline-neutral-700 hover:bg-neutral-900 [&:has(.hover-dont-change-bg:hover)]:bg-transparent',
          'focus-within:border-neutral-500 focus-within:hover:bg-transparent!',
          classNames?.input,
          isSmall && 'xl:gap-1! xl:px-3! xl:py-2!',
          isInvalidAmount && 'border-error-600 focus-within:border-error-500',
        )}
        onClick={onfocusInput}
        ref={wrapperSelectRef}
      >
        <div className={cn('flex items-center justify-between gap-2', isSmall && 'xl:gap-1!')}>
          <input
            ref={inputRefer}
            type='number'
            className={cn(
              'w-full truncate border-0 bg-transparent p-0 text-xl text-neutral-50 placeholder-neutral-400',
              isSmall && 'text-sm!',
            )}
            placeholder='0.0'
            value={amount ?? ''}
            onChange={e => {
              let { value } = e.target
              if (value === '') {
                onAmountChange('')
                return
              }
              if (!isNaN(Number(value))) {
                value = value.replace(/^0+(?=\d)/, '')
              }
              onAmountChange(value)
            }}
            min={0}
            autoFocus={autoFocus}
          />
          {setAsset ? (
            <>
              {Array.isArray(assetsSelect) ? (
                // <TokenBadge
                //   className={cn(
                //     'inline-flex items-center justify-center gap-2',
                //     'rounded-lg bg-[#29292980] text-xs text-neutral-200 hover:bg-neutral-700 md:text-sm',
                //     'py-0.5 pl-1 pr-1.5 lg:py-1.5 lg:pl-1.5 lg:pr-2',
                //     'hover-dont-change-bg cursor-pointer',
                //     Boolean(maxBalance) && 'w-[220px]',
                //   )}
                //   asset={asset}
                //   onClick={() => setTokenPopup(true)}
                //   isDouble={Boolean(maxBalance)}
                // />
                <SelectToken
                  setSelectedAsset={setAsset}
                  placeHolder={t('Select Token')}
                  selectedAsset={asset}
                  dropdownAlign='right'
                  optionWidth={optionWidth}
                  style={SELECT_TOKEN_STYLE.BADGE}
                  allowDouble={!singleMode && Boolean(maxBalance) && !isSwapChainLink}
                  assetOptions={assetsSelect}
                  classNames={{ dropdown: classNames?.dropdown ?? '2xl:grid-cols-2' }}
                />
              ) : (
                <AssetDropdown
                  className='hover-dont-change-bg hover:rounded-lg hover:bg-neutral-700 [&>#info]:rounded-lg! [&>#info]:bg-[#292929]/50!'
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
                'rounded-lg bg-[#29292980] text-xs text-neutral-200 md:text-sm',
                'py-1.5 pr-2 pl-1.5',
                'cursor-default',
              )}
            >
              {maxBalance && !isSwapChainLink ? (
                <IconGroup
                  className='*:not-first:-ml-2'
                  classNames={{
                    image: 'outline-2 md:w-6 md:h-6 h-4 w-4',
                  }}
                  logo1='https://cdn.thena.fi/assets/BSC.png'
                  logo2='https://cdn.thena.fi/assets/BNB.png'
                />
              ) : (
                <CircleImage alt='thena' className='h-4 w-4 md:h-6 md:w-6' src={asset?.logoURI ?? UNKNOWN_LOGO} />
              )}
              <span className='text-xs text-nowrap md:text-sm'>
                {`${maxBalance ? 'BNB + WBNB' : asset?.symbol} ${weight ? `(${weight}%)` : ''}`}
              </span>
            </div>
          ) : (
            <Skeleton className='h-6 w-24' />
          )}
        </div>
        <div className='flex items-center justify-between gap-2'>
          <TextSubHeading className={cn('truncate text-xs! leading-4! text-neutral-500')}>
            ${formatAmount(amount * (asset?.price || 0))}
          </TextSubHeading>
          <TextSubHeading className={cn('flex gap-4 text-xs! leading-4! text-nowrap text-neutral-500')}>
            <span>
              {t('Balance')}: {formatAmount(max)}
            </span>
            <span
              onClick={() => onAmountChange(max.dp(asset?.decimals).toString(10))}
              className={cn('text-primary-600 hover:text-primary-400 cursor-pointer', max?.eq(0) && 'hidden')}
            >
              {t('Max')}
            </span>
          </TextSubHeading>
        </div>
      </div>
      {isInvalidAmount && (
        <TextHeading className='text-error-600 text-base leading-5 font-normal'>{t('Invalid Amount')}</TextHeading>
      )}
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
