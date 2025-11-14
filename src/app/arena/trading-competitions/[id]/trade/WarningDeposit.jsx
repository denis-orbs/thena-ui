import { minBy } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'
import useSWR from 'swr'

import { usePairsContract } from '@/app/arena/PairsContractContext'
import { Paragraph } from '@/components/typography'
import useWallet from '@/hooks/useWallet'
import { fromWei } from '@/lib/utils'

const COEFFICIENT = 3

export function WarningDeposit({ amount, competition }) {
  const t = useTranslations()

  const { pairsContract } = usePairsContract()

  const minPairs = useMemo(
    () =>
      minBy(
        pairsContract.filter(pair =>
          (competition?.competitionRules?.pairIds ?? []).some(({ id }) => id === pair.symbol_id),
        ),
        'min_acceptable_quote_value',
      ) ?? undefined,
    [pairsContract, competition?.competitionRules?.pairIds],
  )

  const { account } = useWallet()
  const { data: deposit } = useSWR(['deposit of user in tc', competition?.id, account])

  const deposited = useMemo(
    () => fromWei(deposit || 0n, competition?.competitionRules?.winningToken?.decimals).toNumber(),
    [competition?.competitionRules?.winningToken?.decimals, deposit],
  )

  if (minPairs && Number(minPairs.min_acceptable_quote_value) + COEFFICIENT > Number(amount) + deposited) {
    return (
      <Paragraph className='text-error-500 ml-1 text-sm'>
        {t('This Deposit Is Not Enough To Trade', { min: minPairs.min_acceptable_quote_value + COEFFICIENT })}
      </Paragraph>
    )
  }
  return null
}
