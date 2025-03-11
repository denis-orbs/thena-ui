import React from 'react'
import { useTranslations } from 'use-intl'

import Box from '@/components/box'
import { Paragraph, TextHeading } from '@/components/typography'

import PoolSummary from './PoolSummary'
import TotalAllocated from './TotalAllocated'

function SideBarCreateWeighted({ tokensAndWeights, fees, step }) {
  const t = useTranslations()
  switch (step) {
    case 1: {
      return <TotalAllocated tokensAndWeights={tokensAndWeights} />
    }
    case 2: {
      return (
        <div className='hidden space-y-4 lg:block'>
          <Box className='flex flex-col gap-2'>
            <TextHeading className='font-archia text-xl font-semibold'>{t('Pool Fees')}</TextHeading>
            <Paragraph className='text-neutral-400'>{t('Pool [fees] sidebar description', { fees })}</Paragraph>
          </Box>
          <Box className='flex flex-col gap-2'>
            <TextHeading className='font-archia text-xl font-semibold'>{t('Thena Governance')}</TextHeading>
            <Paragraph className='text-neutral-400'>{t('Thena Governance description', { fees })}</Paragraph>
          </Box>
          <PoolSummary
            fees={fees}
            tokens={tokensAndWeights.map(token => ({ ...token.token, weight: token.weight, amount: token.amount }))}
          />
        </div>
      )
    }

    default: {
      return <></>
    }
  }
}

export default SideBarCreateWeighted
