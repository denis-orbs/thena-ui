import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useEffect, useRef } from 'react'

import { ErrorButton } from '@/components/buttons/Button'
import CircleImage from '@/components/image/CircleImage'
import { TokenAmountInput } from '@/components/input/TokenAmountInput'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { useGetMinimumFunds } from '@/hooks/automationContract/useAutomationContract'
import useChainLINKData from '@/hooks/useChainLINKData'
import { convertBooleansToHex, formatAmount } from '@/lib/utils'
import { InfoIcon } from '@/svgs'

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

  const { push } = useRouter()

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
      {chainLINK && minFunds.gt(chainLINK?.balance) && (
        <div className='flex items-center gap-4 rounded-xl border border-error-800 bg-error-950 px-4 py-2 lg:px-5 lg:py-4'>
          <InfoIcon className='h-5 w-5 !stroke-error-800' />
          <div className='flex w-full flex-row items-center justify-between gap-2'>
            <Paragraph className='text-base text-red-100'>
              {t('You have [balance] LINK in your Wallet', { balance: formatAmount(chainLINK.balance) || 0 })}
            </Paragraph>
            <ErrorButton
              onClick={
                () =>
                  push('/swap?inputCurrency=BNB&outputCurrency=0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd&swapType=1')
                // eslint-disable-next-line react/jsx-curly-newline
              }
              className='min-w-fit bg-error-800'
            >
              {t('Swap LINK')}
            </ErrorButton>
          </div>
        </div>
      )}
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
      {minFunds.gt(chainLINKAmount) && (
        <ErrorMessage message={t('LINK Amount should be larger than [value]', { value: formatAmount(minFunds) })} />
      )}
    </div>
  )
}

export default RegisterAutomation
