import React, { memo } from 'react'

import BalanceInput from '@/components/input/BalanceInput'

function InputTokenMemo({ token, title, autoFocus, amount, onAmountChange }) {
  return (
    <BalanceInput
      type='number'
      key={token?.address}
      amount={amount}
      asset={token}
      title={title}
      autoFocus={autoFocus}
      onAmountChange={onAmountChange}
    />
  )
}

export default memo(InputTokenMemo)
