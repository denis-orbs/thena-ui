import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { UNKNOWN_LOGO } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'
import SelectTokenFromList from '@/modules/SelectTokenModal/SelectTokenFromList'
import { ChevronDownIcon } from '@/svgs'

import TokenBadge from '../badges/TokenBadge'
import { EmphasisButton } from '../buttons/Button'
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
  disabledSelect = false,
}) {
  const [tokenPopup, setTokenPopup] = useState(false)
  const t = useTranslations()

  return (
    <div className='flex flex-col gap-3'>
      {typeof title === 'string' && <TextHeading>{title}</TextHeading>}
      <div className='flex flex-col gap-3 self-stretch rounded-xl border border-neutral-700 p-4'>
        <div className='flex items-center justify-between gap-2'>
          <input
            type='number'
            className='w-[70%] border-0 bg-transparent p-0 text-xl text-neutral-50 placeholder-neutral-400'
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
              <CircleImage alt='' className='h-6 w-6' src={asset.logoURI || UNKNOWN_LOGO} />
              <span className='text-nowrap'>{asset?.symbol}</span>
            </div>
          ) : (
            <>
              {asset ? (
                <TokenBadge asset={asset} onClick={() => setTokenPopup(true)} />
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
          <TextSubHeading>
            {t('Balance')}: {formatAmount(asset?.balance)}
          </TextSubHeading>
        </div>
        {!assetData ? (
          <TokenModal
            popup={tokenPopup}
            setPopup={setTokenPopup}
            selectedAsset={asset}
            setSelectedAsset={setAsset}
            otherAsset={otherAsset}
            setOtherAsset={setOtherAsset}
          />
        ) : (
          <SelectTokenFromList
            setIsOpen={setTokenPopup}
            isOpen={tokenPopup}
            selectedAsset={asset}
            tokens={assetData}
            setToken={setAsset}
          />
        )}
      </div>
    </div>
  )
}

export default TokenInput
