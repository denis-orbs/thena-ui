import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { UNKNOWN_LOGO } from '@/constant'
import { useTokenBalance } from '@/hooks/fusion/Tokens'
import { cn, formatAmount } from '@/lib/utils'
import SelectTokenFromList from '@/modules/SelectTokenModal/SelectTokenFromList'
import { ChevronDownIcon } from '@/svgs'

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
  readOnly = false,
  title,
  alowDouble = false,
  disabledSelect = false,
  isHideTrending = false,
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
    <div className='flex flex-col gap-3'>
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
            readOnly={readOnly}
          />
          {disabledSelect ? (
            <div
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'rounded-full bg-neutral-600 text-sm text-neutral-200',
                'py-1.5 pl-1.5 pr-2',
              )}
            >
              {isDouble && alowDouble ? (
                <IconGroup
                  className='-space-x-2'
                  classNames={{
                    image: 'outline-2 w-6 h-6',
                  }}
                  logo1='https://cdn.thena.fi/assets/BSC.png'
                  logo2='https://cdn.thena.fi/assets/BNB.png'
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
                  className='h-9 !w-[130px] rounded-full p-1 text-sm font-semibold text-neutral-200 transition-all duration-150 ease-out'
                  onClick={() => setTokenPopup(true)}
                >
                  {t('Select Token')} <ChevronDownIcon className='h-4 w-4 !stroke-neutral-200 text-neutral-200' />
                </EmphasisButton>
              ) : (
                <Skeleton className='h-[36px] w-[100px]' />
              )}
            </>
          )}
        </div>
        <div className='flex items-center justify-between gap-2'>
          <TextSubHeading>${formatAmount(amount * (asset?.price || 0))}</TextSubHeading>
          <TextSubHeading className='space-x-2'>
            <span>
              {t('Balance')}: {formatAmount(isDouble ? balance : asset?.balance)}
            </span>
            <span onClick={() => setAmount(asset.balance)} className={cn('cursor-pointer text-primary-600')}>
              {t('Max')}
            </span>
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
