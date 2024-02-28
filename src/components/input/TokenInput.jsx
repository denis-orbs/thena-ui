import React, { useState } from 'react'

import { formatAmount } from '@/lib/utils'

import TokenBadge from '../badges/TokenBadge'
import Skeleton from '../skeleton'
import { TextSubHeading } from '../typography'
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
}) {
  const [tokenPopup, setTokenPopup] = useState(false)

  return (
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
          <TokenBadge asset={asset} onClick={() => setTokenPopup(true)} />
        ) : (
          <Skeleton className='h-[36px] w-[100px]' />
        )}
      </div>
      <div className='flex items-center justify-between gap-2'>
        <TextSubHeading>${formatAmount(amount * (asset?.price || 0))}</TextSubHeading>
        <TextSubHeading>Balance: {formatAmount(asset?.balance)}</TextSubHeading>
      </div>
      <TokenModal
        popup={tokenPopup}
        setPopup={setTokenPopup}
        selectedAsset={asset}
        setSelectedAsset={setAsset}
        otherAsset={otherAsset}
        setOtherAsset={setOtherAsset}
      />
    </div>
  )
}

export default TokenInput
