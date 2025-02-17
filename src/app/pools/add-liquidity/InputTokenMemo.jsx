import React, { memo } from 'react'
import { useTranslations } from 'use-intl'

import BalanceInput from '@/components/input/BalanceInput'
import { useTokenBalance } from '@/hooks/fusion/Tokens'

function InputTokenMemo({ token, autoFocus, amount, onAmountChange, alowDouble, weight }) {
  const { balance, isDouble } = useTokenBalance(token, alowDouble)
  const t = useTranslations()
  return (
    <BalanceInput
      type='number'
      amount={amount}
      asset={token}
      maxBalance={isDouble ? balance : null}
      autoFocus={autoFocus}
      onAmountChange={onAmountChange}
      weight={weight}
      showPercent={false}
      title={`${t('Pool Weight')} ${weight}%`}
      classNames={{ title: 'text-neutral-500 text-xs' }}
    />
  )
}

export default memo(InputTokenMemo)
