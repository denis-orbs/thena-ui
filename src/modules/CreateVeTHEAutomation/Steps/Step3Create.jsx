import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import IconGroup from '@/components/icongroup'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { ListTokenPercantage } from '@/modules/WeightedPool/TokenPercentage'
import { createVeTHEAutomationContract } from '@/state/veTHEAutomationContract/action'

import RegisterAutomation from '../RegisterAutomation'

function Step3Create() {
  const t = useTranslations()
  const { createData } = useSelector(state => state.veTHEAutomationContract)
  const dispatch = useDispatch()

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
    <div className='space-y-5 divide-y divide-neutral-700'>
      {/* Details */}
      <div className='flex flex-col gap-3'>
        <TextHeading>{t('Details')}</TextHeading>
        <div className='flex flex-row justify-between'>
          <Paragraph>veTHE ID</Paragraph>
          <TextHeading>{createData?.veTHEId || 'UNKNOWN'}</TextHeading>
        </div>
      </div>

      {/* Settings */}
      <div className='flex flex-col gap-3 pt-4'>
        <TextHeading>{t('Settings')}</TextHeading>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Claim rebase rewards every week')}</Paragraph>
          <TextHeading>{createData?.settings?.isClaimEveryWeek ? 'Yes' : 'No'}</TextHeading>
        </div>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Relock veTHE every 1 Week')}</Paragraph>
          <TextHeading>{createData?.settings?.isRelockEveryWeek ? 'Yes' : 'No'}</TextHeading>
        </div>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Automation Execution Time')}</Paragraph>
          <TextHeading>{dayjs(createData?.settings?.executionTime).format('YYYY/MM/DD hh:mm A')}</TextHeading>
        </div>
      </div>

      {/* Voting Pairs and Weights */}
      <div className='flex flex-col gap-3 pt-4'>
        <TextHeading>{t('Voting Pairs and Weights')}</TextHeading>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Automatically vote each epoch')}</Paragraph>
          <TextHeading>{createData?.votes?.isAutoVote ? 'Yes' : 'No'}</TextHeading>
        </div>
        {createData?.votes?.isAutoVote &&
          (createData?.votes?.pairs || []).map((pair, index) => (
            <div key={`${pair.pair.address}_${index}`} className='flex flex-row items-center justify-between'>
              {pair.pair?.type !== PAIR_TYPES.WEIGHTED ? (
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
      <div className='flex flex-col gap-3 pt-4'>
        <TextHeading className='text-[18px]'>{t('Registration')}</TextHeading>
        <RegisterAutomation
          chainLINK={createData?.registration?.chainlink}
          chainLINKAmount={createData?.registration?.chainlinkAmount}
          updateRegistration={updateRegistration}
          contractData={createData}
        />
      </div>
    </div>
  )
}

export default Step3Create
