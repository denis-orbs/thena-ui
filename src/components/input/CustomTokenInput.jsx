import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import CustomTokenModal from '@/modules/TokenModal/CustomTokenModal'
import cn from '@/utils/classes'
import { formatAmount } from '@/utils/utils'

import TokenBadge from '../badges/TokenBadge'
import Skeleton from '../skeleton'
import Tabs from '../tabs'
import { TextSubHeading } from '../typography'

function CustomTokenInput({
  asset,
  setAsset,
  amount,
  setAmount,
  autoFocus = false,
  disabled = false,
  hasTabs = true,
  title = '',
  assets = [],
  helperText = '',
  disabledSelect = false,
  enableSetMax = false,
}) {
  const [tokenPopup, setTokenPopup] = useState(false)
  const t = useTranslations()

  const percents = useMemo(
    () => [
      {
        label: '10%',
        onClickHandler: () => setAmount(asset?.balance.times(0.1).dp(asset.decimals).toString(10)),
      },
      {
        label: '25%',
        onClickHandler: () => setAmount(asset?.balance.times(0.25).dp(asset.decimals).toString(10)),
      },
      {
        label: '50%',
        onClickHandler: () => setAmount(asset?.balance.times(0.5).dp(asset.decimals).toString(10)),
      },
      {
        label: 'Max',
        onClickHandler: () => setAmount(asset?.balance.dp(asset.decimals).toString(10)),
      },
    ],
    [asset, setAmount],
  )

  return (
    <div className='flex flex-col gap-2'>
      {hasTabs && (
        <div className='flex items-center justify-between'>
          <p className='font-medium text-white'>{title}</p>
          <Tabs data={percents} />
        </div>
      )}

      <div className='flex flex-col gap-3 self-stretch rounded-xl border border-neutral-700 p-4'>
        <div className='flex items-center justify-between gap-2'>
          <input
            type='number'
            className='w-full border-0 bg-transparent p-0 text-xl text-neutral-50 placeholder-neutral-400'
            placeholder='0.0'
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min={0}
            autoFocus={autoFocus}
            disabled={disabled}
          />
          {asset ? (
            <TokenBadge
              asset={asset}
              showChevronDownIcon={!disabledSelect}
              onClick={() => {
                if (!disabledSelect) {
                  setTokenPopup(true)
                }
              }}
            />
          ) : (
            <Skeleton className='h-[36px] w-[100px]' />
          )}
        </div>
        <div className='flex items-center justify-between gap-2'>
          <TextSubHeading>{helperText || `$${formatAmount(amount * (asset?.price || 0))}`}</TextSubHeading>
          <TextSubHeading className='space-x-4 text-nowrap text-neutral-500'>
            <span>
              {t('Balance')}: {formatAmount(asset?.balance, false, 10)}
            </span>
            {enableSetMax && (
              <span
                onClick={() => setAmount(asset?.balance?.dp(asset.decimals).toString(10))}
                className={cn(
                  'text-primary-600 hover:text-primary-400 cursor-pointer',
                  !asset?.balance || (asset?.balance?.eq(0) && 'hidden'),
                )}
              >
                {t('Max')}
              </span>
            )}
          </TextSubHeading>
        </div>
        <CustomTokenModal popup={tokenPopup} setPopup={setTokenPopup} setSelectedAsset={setAsset} assets={assets} />
      </div>
    </div>
  )
}

export default CustomTokenInput
