import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import IconGroup from '@/components/icongroup'
import CircleImage from '@/components/image/CircleImage'
import Input from '@/components/input'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import useWallet from '@/hooks/useWallet'
import { cn, formatAmount } from '@/lib/utils'
import SelectTokenFromList from '@/modules/SelectTokenModal/SelectTokenFromList'
import { ErrorMessage } from '@/modules/WeightedPool/ChooseTokenAndWeights'
import { ListTokenPercantage } from '@/modules/WeightedPool/TokenPercentage'
import { createVeTHEAutomationContract } from '@/state/veTHEAutomationContract/action'
import { ChevronDownIcon } from '@/svgs'

const UPDATE_REGISTRATION = {
  CHAINLINK: 'chainlink',
  CHAINLINK_AMOUNT: 'chainlinkAmount',
}

function Step4Create() {
  const t = useTranslations()
  const { createData, veTHESelected } = useSelector(state => state.veTHEAutomationContract)
  const assets = useAssets()
  const { chainId } = useWallet()
  const dispatch = useDispatch()
  const [popup, setPopup] = useState(false)

  const chainLinkData = useMemo(
    () =>
      (assets || []).filter(asset =>
        [Contracts.chainlinkToken[chainId], Contracts.chainlinkTokenERC677[chainId]].includes(asset.address),
      ),
    [assets, chainId],
  )

  const updateRegistration = useCallback(
    (data, type) => {
      dispatch(
        createVeTHEAutomationContract({
          createData: {
            ...createData,
            registration: {
              ...createData.registration,
              [type]: data,
            },
          },
        }),
      )
    },
    [createData, dispatch],
  )

  return (
    <div className='space-y-5 divide-y divide-neutral-700 '>
      {/* Details */}
      <div className='flex flex-col gap-3'>
        <TextHeading>{t('Details')}</TextHeading>
        <div className='flex flex-row justify-between'>
          <Paragraph>veTHE ID</Paragraph>
          <TextHeading>{createData?.veTHEId || 'UNKNOWN'}</TextHeading>
        </div>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Contract Name')}</Paragraph>
          <TextHeading>{`veTHE Automation - ID ${veTHESelected?.id}`}</TextHeading>
        </div>
      </div>

      {/* Settings */}
      <div className='flex flex-col gap-3 pt-5'>
        <TextHeading>{t('Settings')}</TextHeading>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Claim rebase rewards every week')}</Paragraph>
          <TextHeading>{createData?.settings?.isClaimEveryWeek ? 'Yes' : 'No'}</TextHeading>
        </div>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Relock contract every 1 Week')}</Paragraph>
          <TextHeading>{createData?.settings?.isRelockEveryWeek ? 'Yes' : 'No'}</TextHeading>
        </div>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Contract Execution Time')}</Paragraph>
          <TextHeading>{dayjs(createData?.settings?.executionTime).format('YYYY/MM/DD hh:mm A')}</TextHeading>
        </div>
      </div>

      {/* Voting Pairs and Weights */}
      <div className='flex flex-col gap-3 pt-5'>
        <TextHeading>{t('Voting Pairs and Weights')}</TextHeading>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Automatically vote each epoch')}</Paragraph>
          <TextHeading>{createData?.votes?.isAutoVote ? 'Yes' : 'No'}</TextHeading>
        </div>
        {(createData?.votes?.pairs || []).map((pair, index) => (
          <div key={`${pair.pair.address}_${index}`} className='flex flex-row items-center justify-between'>
            {pair.pair.type !== PAIR_TYPES.WEIGHTED ? (
              <div className='flex flex-row gap-3'>
                <IconGroup
                  className='-space-x-2'
                  classNames={{
                    image: 'outline-2 w-7 h-7',
                  }}
                  logo1={pair.pair.token0.logoURI}
                  logo2={pair.pair.token1.logoURI}
                />
                <div className='flex flex-row gap-[6px]'>
                  <TextHeading className='text-sm'>{pair.pair.symbol}</TextHeading>
                  <Paragraph className='text-sm'>{pair.pair.type}</Paragraph>
                </div>
              </div>
            ) : (
              <ListTokenPercantage listToken={pair.pair.tokens} />
            )}
            <TextHeading>{pair.weight}%</TextHeading>
          </div>
        ))}
      </div>

      {/* Registration */}
      <div className='flex flex-col gap-3 pt-5'>
        <TextHeading className='text-[18px]'>{t('Registration')}</TextHeading>
        <div className='space-y-3'>
          <Paragraph className='text-base'>{t('Starting Balance')}</Paragraph>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <div
              className='flex cursor-pointer items-center justify-between rounded-[8px] bg-neutral-700 px-4 py-3'
              onClick={() => setPopup(true)}
            >
              {createData?.registration?.chainlink ? (
                <div className='flex items-center gap-3'>
                  <CircleImage
                    className='h-6 w-6'
                    alt='Logo'
                    src={createData?.registration?.chainlink?.logoURI || UNKNOWN_LOGO}
                  />
                  <div className='flex items-end gap-2'>
                    <TextHeading>{createData?.registration?.chainlink.symbol}</TextHeading>
                  </div>
                </div>
              ) : (
                <p className='text-neutral-400'>{t('Select Chainlink')}</p>
              )}
              <ChevronDownIcon
                className={cn(
                  'transfrom h-5 w-5 transition-all duration-150 ease-out',
                  popup ? 'rotate-180' : 'rotate-0',
                )}
              />
            </div>
            <Input
              val={createData?.registration?.chainlinkAmount}
              min={0.1}
              placeholder='Link Amount'
              onChange={e => updateRegistration(Number(e.target.value), UPDATE_REGISTRATION.CHAINLINK_AMOUNT)}
              suffix={`$${
                createData?.registration?.chainlink
                  ? formatAmount(
                      (createData?.registration?.chainlinkAmount || 0) *
                        (createData?.registration?.chainlink.price || 0),
                    )
                  : 0
              }`}
            />
          </div>
          <ErrorMessage message={t('Registration automation contract description')} />
        </div>
        <SelectTokenFromList
          allowSearch={false}
          isOpen={popup}
          selectedAsset={createData?.registration?.chainlink}
          setIsOpen={setPopup}
          setToken={data => {
            updateRegistration({ ...data, balance: data.balance.toNumber() }, UPDATE_REGISTRATION.CHAINLINK)
          }}
          tokens={chainLinkData}
        />
      </div>
    </div>
  )
}

export default Step4Create
