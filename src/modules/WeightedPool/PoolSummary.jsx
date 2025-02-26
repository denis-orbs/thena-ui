import React from 'react'
import { useTranslations } from 'use-intl'

import Box from '@/components/box'
import CircleImage from '@/components/image/CircleImage'
import { Paragraph, TextHeading } from '@/components/typography'
import { formatAmount } from '@/lib/utils'
import { CoinsHandIcon } from '@/svgs'

function PoolSummary({ tokens, fees }) {
  const t = useTranslations()
  return (
    <Box>
      <TextHeading className='font-archia text-3xl font-semibold text-neutral-50'>{t('Pool Attributes')}</TextHeading>
      <div className='flex items-center justify-between border-b-[2px] border-neutral-700 p-4'>
        <div className='flex gap-3'>
          <CoinsHandIcon className='h-5 w-5' />
          <Paragraph>{t('Pool Fees')}</Paragraph>
        </div>
        <Paragraph>{`${fees} %`}</Paragraph>
      </div>
      <div className='mx-auto mt-4 w-full'>
        <div className='w-full text-left'>
          {/* Header */}
          <div className='flex py-5'>
            <div className='flex-1 pb-2 font-archia text-xl font-semibold text-neutral-50'>USD Value</div>
            <div className='flex-1 pb-2 text-center font-archia text-xl font-semibold text-neutral-50'>Pool</div>
            <div className='flex-1 pb-2 text-right font-archia text-xl font-semibold text-neutral-50'>Token</div>
          </div>

          {/* Body */}
          <div>
            {(tokens || []).map(token => (
              <div className='flex' key={token.symbol}>
                <div className='flex flex-1 items-center gap-2 py-2'>
                  <div className='flex items-center gap-3'>
                    <CircleImage className='h-8 w-8' src={token.logoURI} alt={`${token.symbol} logo`} />
                    <TextHeading className='text-neutral-50'>{token.symbol}</TextHeading>
                  </div>
                </div>
                <div className='flex flex-1 justify-center py-2'>
                  <Paragraph className='text-neutral-50'>
                    $ {formatAmount(token.price * (Number(token.amount) || 0))}
                  </Paragraph>
                </div>
                <div className='flex flex-1 justify-end py-2'>
                  <Paragraph className='text-neutral-50'>{token.weight} %</Paragraph>
                </div>
              </div>
            ))}

            {/* Total Row */}
            <div className='mt-6 flex'>
              <div className='flex flex-1 items-center gap-2'>
                <Paragraph className='font-archia text-xl font-semibold text-neutral-50'>{t('Total')}</Paragraph>
              </div>
              <div className='flex flex-1 justify-center'>
                <Paragraph className='font-archia text-xl font-semibold text-neutral-50'>
                  $ {formatAmount(tokens.reduce((curr, token) => curr + Number(token.amount || 0) * token.price, 0))}
                </Paragraph>
              </div>
              <div className='flex flex-1 justify-end'>
                <Paragraph className='font-archia text-xl font-semibold text-neutral-50'>
                  {tokens.reduce((curr, token) => curr + Number(token.weight), 0)} %
                </Paragraph>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Box>
  )
}

export default PoolSummary
