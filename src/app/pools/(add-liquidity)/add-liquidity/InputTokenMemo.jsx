import React, { memo, useEffect, useState } from 'react'
import { useTranslations } from 'use-intl'

import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import { useTokenBalance } from '@/hooks/fusion/Tokens'
import { isInvalidAmount } from '@/lib/utils'

function InputTokenMemo({
  token,
  autoFocus,
  amount,
  onAmountChange,
  alowDouble,
  weight,
  isCheckError,
  showTitle = true,
  isSmall = false,
}) {
  const { balance, isDouble } = useTokenBalance(token, alowDouble)
  const t = useTranslations()
  const [invalid, setInvalid] = useState(false)
  useEffect(() => {
    if (isCheckError) {
      if (amount > Number(balance) || isInvalidAmount(amount)) {
        setInvalid(true)
      } else {
        setInvalid(false)
      }
    }
  }, [amount, balance, isCheckError])
  return (
    <TokenAmountInput
      type='number'
      amount={amount}
      asset={token}
      maxBalance={isDouble ? balance : null}
      autoFocus={autoFocus}
      onAmountChange={onAmountChange}
      showPercent={false}
      title={showTitle ? `${t('Pool Weight')} ${weight}%` : ''}
      classNames={{ title: 'text-neutral-500 text-xs' }}
      isInvalidAmount={invalid}
      isSmall={isSmall}
    />
  )
}

export default memo(InputTokenMemo)
