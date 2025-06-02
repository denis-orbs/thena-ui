import { memo } from 'react'
import { useTranslations } from 'use-intl'

import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import { useTokenBalance } from '@/hooks/fusion/Tokens'

function InputTokenMemo({
  token,
  autoFocus,
  amount,
  onAmountChange,
  alowDouble,
  weight,
  showTitle = true,
  isSmall = false,
}) {
  const { balance, isDouble } = useTokenBalance(token, alowDouble)
  const t = useTranslations()

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
      isSmall={isSmall}
    />
  )
}

export default memo(InputTokenMemo)
