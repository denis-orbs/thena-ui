import React, { memo } from 'react'

import BalanceInput from '@/components/input/BalanceInput'
import { useTokenBalance } from '@/hooks/fusion/Tokens'

function InputTokenMemo({ token, title, autoFocus, amount, onAmountChange, alowDouble, weight }) {
  const { balance, isDouble } = useTokenBalance(token, alowDouble)
  return (
    <BalanceInput
      type='number'
      amount={amount}
      asset={token}
      title={title}
      maxBalance={isDouble ? balance : null}
      autoFocus={autoFocus}
      onAmountChange={onAmountChange}
      weight={weight}
    />
  )
}

export default memo(InputTokenMemo)
