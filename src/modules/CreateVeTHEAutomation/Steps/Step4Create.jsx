import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React from 'react'
import { useSelector } from 'react-redux'

import IconGroup from '@/components/icongroup'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES } from '@/constant'
import { ListTokenPercantage } from '@/modules/WeightedPool/TokenPercentage'

function Step4Create() {
  const t = useTranslations()
  const { createData } = useSelector(state => state.veTHEAutomationContract)
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
          <TextHeading>{createData?.contractName || 'UNKNOWN'}</TextHeading>
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
          <div key={`${pair.pair.address}_${index}`} className='flex flex-row justify-between'>
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
                  <TextHeading>{pair.pair.symbol}</TextHeading>
                  <Paragraph className='text-sm'>{t(pair.pair.type)}</Paragraph>
                </div>
              </div>
            ) : (
              <ListTokenPercantage listToken={pair.pair.tokens} />
            )}
            <TextHeading>{pair.weight}%</TextHeading>
          </div>
        ))}
      </div>

      {/* Transaction */}
      <div className='flex flex-col gap-3 pt-5'>
        <TextHeading>{t('Transaction')}</TextHeading>
        <div className='flex flex-row justify-between'>
          <Paragraph>{t('Transaction Cost')}</Paragraph>
          <TextHeading>TODO</TextHeading>
        </div>
      </div>
    </div>
  )
}

export default Step4Create
