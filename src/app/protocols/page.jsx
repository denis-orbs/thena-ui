'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

import { Neutral } from '@/components/alert'
import Box from '@/components/box'
import { EmphasisButton, SecondaryButton } from '@/components/buttons/Button'
import { Paragraph, TextHeading } from '@/components/typography'
import { InfoIcon } from '@/svgs'

export default function ProtocolsPage() {
  const { push } = useRouter()
  return (
    <div className='flex flex-col gap-10'>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-2'>
          <h2>Protocols</h2>
          <Paragraph>Add a Gauge</Paragraph>
        </div>
        <Neutral className='justify-between lg:p-8'>
          <div className='flex items-center gap-4'>
            <InfoIcon className='h-4 w-4 min-w-fit stroke-neutral-600 lg:h-8 lg:w-8' />
            <div className='flex flex-col gap-2'>
              <TextHeading className='text-xl'>What are Gauges?</TextHeading>
              <Paragraph>
                Gauges are used to measure voting power. veTHE holders can allocate their voting power to different
                liquidity pools through these gauges. This voting determines how the protocol’s emissions or rewards are
                distributed among the pools. The more voting power a pool has via the gauge, the larger the share of THE
                rewards it receives.
              </Paragraph>
            </div>
          </div>
          <EmphasisButton
            className='min-w-fit'
            responsive
            onClick={() => {
              window.open(
                'https://thena.gitbook.io/thena/the-open-marketplace-for-liquidity/whitelist-tokens',
                '_blank',
              )
            }}
          >
            Learn More
          </EmphasisButton>
        </Neutral>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <Box className='flex items-center justify-between gap-2'>
            <div className='flex flex-col gap-2'>
              <TextHeading className='text-lg'>Gauge</TextHeading>
              <Paragraph>Create a new gauge which can be used for staking and voting.</Paragraph>
            </div>
            <SecondaryButton onClick={() => push('/protocols/gauge')}>Add</SecondaryButton>
          </Box>
          <Box className='flex items-center justify-between gap-2'>
            <div className='flex flex-col gap-2'>
              <TextHeading className='text-lg'>Voting Incentive</TextHeading>
              <Paragraph>Add a bribe reward for an existing gauge to incentivize votes on it.</Paragraph>
            </div>
            <SecondaryButton onClick={() => push('/protocols/incentive')}>Add</SecondaryButton>
          </Box>
        </div>
      </div>
      {/* <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-[120px]'>
        <Highlight>
          <InfoCircleWhite className='h-4 w-4' />
        </Highlight>
        <div className='flex flex-col items-center gap-3'>
          <h2>Other inquiries?</h2>
          <Paragraph className='mt-3 text-center'>Reach out to us!</Paragraph>
        </div>
        <EmphasisButton>Support system</EmphasisButton>
      </div> */}
    </div>
  )
}
