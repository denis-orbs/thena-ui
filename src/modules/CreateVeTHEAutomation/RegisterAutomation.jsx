import { useTranslations } from 'next-intl'
import React, { useEffect, useRef } from 'react'

import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import { Paragraph, TextHeading } from '@/components/typography'
import { useGetMaxPaymentForGas } from '@/hooks/automationContract/useAutomationContract'
import useChainLINKData from '@/hooks/useChainLINKData'
import { convertBooleansToHex, formatAmount } from '@/lib/utils'

import { ErrorMessage } from '../WeightedPool/ChooseTokenAndWeights'

const UPDATE_REGISTRATION = {
  CHAINLINK: 'chainlink',
  CHAINLINK_AMOUNT: 'chainlinkAmount',
}

function RegisterAutomation({
  chainLINK,
  chainLINKAmount,
  contractData,
  setMinFunds = () => {},
  updateRegistration = () => {},
}) {
  const minFunds = useGetMaxPaymentForGas(
    contractData?.veTHEId,
    convertBooleansToHex(
      contractData?.votes?.isAutoVote,
      contractData?.settings?.isClaimEveryWeek,
      contractData?.settings?.isRelockEveryWeek,
    ),
    (contractData?.votes?.pairs || []).filter(item => Boolean(item.pair)).length,
  )

  const minRef = useRef(null)

  useEffect(() => {
    if (!minRef.current || !minRef.current.eq(minFunds)) {
      setMinFunds(minFunds)
      minRef.current = minFunds
    }
  }, [minFunds, setMinFunds])

  const t = useTranslations()
  const chainLinkData = useChainLINKData()

  useEffect(() => {
    if (!chainLINK && chainLinkData.length > 0) {
      updateRegistration(
        { ...chainLinkData[0], balance: chainLinkData[0].balance.toNumber() },
        UPDATE_REGISTRATION.CHAINLINK,
      )
    }
  }, [chainLINK, chainLinkData, updateRegistration])

  return (
    <div className='space-y-3'>
      <Paragraph className='text-base'>{t('Starting Balance')}</Paragraph>
      <div className='flex flex-col gap-[11px]'>
        <div className='flex flex-row justify-between'>
          <TextHeading>{t('Add Funds')}</TextHeading>
        </div>
        <TokenAmountInput
          type='number'
          amount={chainLINKAmount}
          setAsset={
            data => updateRegistration({ ...data, balance: data.balance.toNumber() }, UPDATE_REGISTRATION.CHAINLINK)
            // eslint-disable-next-line react/jsx-curly-newline
          }
          asset={chainLINK}
          autoFocus
          onAmountChange={value => updateRegistration(value, UPDATE_REGISTRATION.CHAINLINK_AMOUNT)}
          showPercent={false}
          assetsSelect={chainLinkData}
        />
      </div>
      {minFunds.gt(chainLINKAmount) && (
        <ErrorMessage message={t('LINK Amount should be larger than [value]', { value: formatAmount(minFunds) })} />
      )}
      <ErrorMessage message={t('Registration automation contract description')} />
    </div>
  )
}

export default RegisterAutomation
