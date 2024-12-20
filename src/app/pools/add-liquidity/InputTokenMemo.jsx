import React, { memo, useMemo } from 'react'

import BalanceInput from '@/components/input/BalanceInput'
import { useAssets } from '@/context/assetsContext'

function InputTokenMemo({ token, title, autoFocus, amount, onAmountChange }) {
  const assets = useAssets()
  const bnbBalance = assets.find(ele => ele.address === 'BNB').balance
  const isDouble = useMemo(() => token.symbol === 'WBNB' || token.name === 'Wrapped BNB', [token])
  const balance = useMemo(() => {
    if (isDouble) {
      return token?.balance?.plus(bnbBalance)
    }
    return token?.balance
  }, [isDouble, token?.balance, bnbBalance])

  return (
    <BalanceInput
      type='number'
      key={token?.address}
      amount={amount}
      asset={token}
      title={title}
      maxBalance={isDouble ? balance : null}
      autoFocus={autoFocus}
      onAmountChange={onAmountChange}
    />
  )
}

export default memo(InputTokenMemo)
