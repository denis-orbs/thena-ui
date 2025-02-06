import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { useGetMaxPaymentForGas } from '@/hooks/automationContract/useAutomationContract'
import useWallet from '@/hooks/useWallet'
import { cn, formatAmount } from '@/lib/utils'
import { ChevronDownIcon } from '@/svgs'

import SelectTokenFromList from '../SelectTokenModal/SelectTokenFromList'
import { ErrorMessage } from '../WeightedPool/ChooseTokenAndWeights'

const UPDATE_REGISTRATION = {
  CHAINLINK: 'chainlink',
  CHAINLINK_AMOUNT: 'chainlinkAmount',
}

function RegisterAutomation({ chainLINK, chainLINKAmount, updateRegistration = () => {} }) {
  const [popup, setPopup] = useState(false)
  const { chainId } = useWallet()

  const automationAddress = useGetMaxPaymentForGas()

  const t = useTranslations()

  const assets = useAssets()
  const chainLinkData = useMemo(
    () =>
      (assets || []).filter(asset =>
        [Contracts.chainlinkToken[chainId], Contracts.chainlinkTokenERC677[chainId]].includes(asset.address),
      ),
    [assets, chainId],
  )
  return (
    <div className='space-y-3'>
      <Paragraph className='text-base'>{t('Starting Balance')}</Paragraph>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
        <div
          className='flex cursor-pointer items-center justify-between rounded-[8px] bg-neutral-700 px-4 py-3'
          onClick={() => setPopup(true)}
        >
          {chainLINK ? (
            <div className='flex items-center gap-3'>
              <CircleImage className='h-6 w-6' alt='Logo' src={chainLINK?.logoURI || UNKNOWN_LOGO} />
              <div className='flex items-end gap-2'>
                <TextHeading>{chainLINK.symbol}</TextHeading>
              </div>
            </div>
          ) : (
            <p className='text-neutral-400'>{t('Select ChainLINK')}</p>
          )}
          <ChevronDownIcon
            className={cn('transfrom h-5 w-5 transition-all duration-150 ease-out', popup ? 'rotate-180' : 'rotate-0')}
          />
        </div>
        <Input
          val={chainLINKAmount}
          placeholder='LINK Amount'
          onChange={e => updateRegistration(Number(e.target.value), UPDATE_REGISTRATION.CHAINLINK_AMOUNT)}
          suffix={`$${chainLINK ? formatAmount((chainLINKAmount || 0) * (chainLINK.price || 0)) : 0}`}
        />
      </div>
      {chainLINKAmount < automationAddress && (
        <ErrorMessage
          message={t('LINK Amount should be larger than [value]', { value: formatAmount(automationAddress) })}
        />
      )}
      <ErrorMessage message={t('Registration automation contract description')} />
      <SelectTokenFromList
        allowSearch={false}
        isOpen={popup}
        selectedAsset={chainLINK}
        setIsOpen={setPopup}
        setToken={data => {
          updateRegistration({ ...data, balance: data.balance.toNumber() }, UPDATE_REGISTRATION.CHAINLINK)
        }}
        tokens={chainLinkData}
      />
    </div>
  )
}

export default RegisterAutomation
