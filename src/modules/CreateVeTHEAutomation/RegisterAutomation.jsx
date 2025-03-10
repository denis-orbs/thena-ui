import { useTranslations } from 'next-intl'
import React, { useEffect, useRef } from 'react'

import CircleImage from '@/components/image/CircleImage'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import { TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { useGetMinimumFunds } from '@/hooks/automationContract/useAutomationContract'
import useChainLINKData from '@/hooks/useChainLINKData'
import { convertBooleansToHex, formatAmount } from '@/lib/utils'

import WarningLINKBalance from './WarningLINKBalance'
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
  const { minimumFunds: minFunds } = useGetMinimumFunds(
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
  const { chainLinkData } = useChainLINKData()

  useEffect(() => {
    if (!chainLINK && (chainLinkData || []).length > 0) {
      updateRegistration(
        { ...chainLinkData[0], balance: chainLinkData[0].balance.toNumber() },
        UPDATE_REGISTRATION.CHAINLINK,
      )
    }
  }, [chainLINK, chainLinkData, updateRegistration])

  return (
    <div className='space-y-4'>
      <div className='flex flex-row justify-between'>
        <TextHeading>{t('Minimum Link Balance needed')}</TextHeading>
        <div className='flex flex-row items-center gap-2'>
          <TextHeading>{formatAmount(minFunds)}</TextHeading>
          <CircleImage alt='LINK logo' className='h-4 w-4' src={chainLINK?.logoURI || UNKNOWN_LOGO} />
        </div>
      </div>
      <WarningLINKBalance contract={contractData} chainLINK={chainLINK} />
      <div className='flex flex-col gap-2'>
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
      {minFunds?.gt(chainLINKAmount) && (
        <ErrorMessage message={t('LINK Amount should be larger than [value]', { value: formatAmount(minFunds) })} />
      )}
    </div>
  )
}

export default RegisterAutomation
