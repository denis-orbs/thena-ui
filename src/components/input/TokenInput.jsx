import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { BNB_LOGO, BSC_LOGO, UNKNOWN_LOGO } from '@/constant'
import { useTokenBalance } from '@/hooks/fusion/Tokens'
import ChevronDownIcon from '@/icons/ChevronDownIcon'
import SelectTokenFromList from '@/modules/SelectTokenModal/SelectTokenFromList'
import cn from '@/utils/classes'
import { formatAmount } from '@/utils/utils'

import TokenBadge from '../badges/TokenBadge'
import { EmphasisButton } from '../buttons/Button'
import IconGroup from '../icongroup'
import CircleImage from '../image/CircleImage'
import Skeleton from '../skeleton'
import { TextHeading, TextSubHeading } from '../typography'
import TokenModal from '../../modules/TokenModal'

function TokenInput({
  asset,
  setAsset,
  otherAsset,
  setOtherAsset,
  amount,
  setAmount,
  autoFocus = false,
  disabled = false,
  assetData,
  assetNull,
  title,
  alowDouble = false,
  disabledSelect = false,
  isHideTrending = false,
  className = '',
  hiddenAssets = [],
}) {
  const t = useTranslations()
  const [tokenPopup, setTokenPopup] = useState(false)
  const { balance, isDouble } = useTokenBalance(asset, alowDouble)

  const wrapAssetsData = useMemo(
    () =>
      (assetData || []).map(item => ({
        ...item,
        symbol: item.name === 'Wrapped BNB' ? 'WBNB' : item.symbol,
      })),
    [assetData],
  )

  const inputRefer = useRef(null)
  const onfocusInput = useCallback(() => {
    if (inputRefer && inputRefer.current) {
      inputRefer.current.focus()
    }
  }, [])

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      {typeof title === 'string' && <TextHeading>{title}</TextHeading>}
      <div
        className='flex cursor-text flex-col gap-3 self-stretch rounded-xl border border-neutral-700 p-4 focus-within:border-neutral-500 hover:bg-neutral-700'
        onClick={onfocusInput}
      >
        <div className='flex items-center justify-between gap-2'>
          <input
            ref={inputRefer}
            type='number'
            className='w-[60%] border-0 bg-transparent p-0 text-xl text-neutral-50 placeholder-neutral-400'
            placeholder='0.0'
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min={0}
            autoFocus={autoFocus}
            disabled={disabled}
          />
          {disabledSelect ? (
            <div
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'rounded-full bg-neutral-600 text-sm text-neutral-200',
                'py-1.5 pr-2 pl-1.5',
              )}
            >
              {isDouble && alowDouble ? (
                <IconGroup
                  className='*:not-first:-ml-2'
                  classNames={{
                    image: 'outline-2 w-6 h-6',
                  }}
                  logo1={BSC_LOGO}
                  logo2={BNB_LOGO}
                />
              ) : (
                <CircleImage alt='' className='h-6 w-6' src={asset.logoURI || UNKNOWN_LOGO} />
              )}
              <span className='text-nowrap'>{isDouble ? 'BNB + WBNB' : asset?.symbol}</span>
            </div>
          ) : (
            <>
              {asset ? (
                <TokenBadge
                  className='rounded-lg'
                  asset={asset}
                  onClick={() => setTokenPopup(true)}
                  isDouble={isDouble && alowDouble}
                />
              ) : assetNull ? (
                <EmphasisButton
                  className='h-9 w-[130px]! rounded-full p-1 text-sm font-semibold text-neutral-200 transition-all duration-150 ease-out'
                  onClick={() => setTokenPopup(true)}
                >
                  {t('Select Token')} <ChevronDownIcon className='stroke-neutral-200! text-neutral-200' />
                </EmphasisButton>
              ) : (
                <Skeleton className='h-[36px] w-[100px]' />
              )}
            </>
          )}
        </div>
        <div className='flex items-center justify-between gap-2'>
          <TextSubHeading>${formatAmount(amount * (asset?.price || 0))}</TextSubHeading>
          <TextSubHeading className='flex gap-2'>
            <span>
              {t('Balance')}: {formatAmount(isDouble ? balance : asset?.balance)}
            </span>

            {!disabled && (
              <span onClick={() => setAmount(asset.balance)} className={cn('text-primary-600 cursor-pointer')}>
                {t('Max')}
              </span>
            )}
          </TextSubHeading>
        </div>
      </div>

      {!assetData ? (
        <TokenModal
          popup={tokenPopup}
          setPopup={setTokenPopup}
          selectedAsset={asset}
          setSelectedAsset={setAsset}
          otherAsset={otherAsset}
          setOtherAsset={setOtherAsset}
          isHideTrending={isHideTrending}
          hiddenAssets={hiddenAssets}
        />
      ) : (
        <SelectTokenFromList
          setIsOpen={setTokenPopup}
          isOpen={tokenPopup}
          selectedAsset={asset}
          tokens={wrapAssetsData}
          setToken={setAsset}
        />
      )}
    </div>
  )
}

export default TokenInput
