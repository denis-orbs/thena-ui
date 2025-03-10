import { motion } from 'framer-motion'
import React, { useState } from 'react'
import { useTranslations } from 'use-intl'

import { EmphasisButton } from '@/components/buttons/Button'
import Divider from '@/components/divider'
import CircleImage from '@/components/image/CircleImage'
import { Paragraph, TextHeading } from '@/components/typography'
import { cn, formatAmount } from '@/lib/utils'
import { CoinsHandIcon, InfoNeutralIcon } from '@/svgs'

function Attributes({ tokens, fees, isMobile }) {
  const t = useTranslations()
  return (
    <div className={cn(isMobile && 'rounded-lg bg-neutral-900 px-5 py-3')}>
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
            <div className='flex-1 pb-2 text-left text-sm text-neutral-50 lg:text-base'>Token</div>
            <div className='flex-1 pb-2 text-center text-sm text-neutral-50 lg:text-base'>USD Value</div>
            <div className='flex-1 pb-2 text-right text-sm text-neutral-50 lg:text-base'>Pool</div>
          </div>

          {/* Body */}
          <div className='space-y-4'>
            {(tokens || []).map(token => (
              <div className='flex' key={token.symbol}>
                <div className='flex flex-1 items-center gap-2 py-2'>
                  <div className='flex items-center gap-3'>
                    <CircleImage className='h-8 w-8' src={token.logoURI} alt={`${token.symbol} logo`} />
                    <TextHeading className='text-sm text-neutral-50 lg:text-base'>{token.symbol}</TextHeading>
                  </div>
                </div>
                <div className='flex flex-1 justify-center py-2'>
                  <Paragraph className='text-center text-sm text-neutral-50 lg:text-base'>
                    $ {formatAmount(token.price * (Number(token.amount) || 0))}
                  </Paragraph>
                </div>
                <div className='flex flex-1 justify-end py-2'>
                  <Paragraph className='text-sm text-neutral-50 lg:text-base'>{token.weight} %</Paragraph>
                </div>
              </div>
            ))}

            {/* Total Row */}
            <Divider className='h-[2px] w-full bg-neutral-700 lg:hidden' />
            <div className='mt-6 flex'>
              <div className='flex flex-1 items-center gap-2'>
                <Paragraph className='text-sm text-neutral-50 lg:text-base'>{t('Total')}</Paragraph>
              </div>
              <div className='flex flex-1 justify-center'>
                <Paragraph className='text-sm text-neutral-50 lg:text-base'>
                  $ {formatAmount(tokens.reduce((curr, token) => curr + Number(token.amount || 0) * token.price, 0))}
                </Paragraph>
              </div>
              <div className='flex flex-1 justify-end'>
                <Paragraph className='text-sm text-neutral-50 lg:text-base'>
                  {tokens.reduce((curr, token) => curr + Number(token.weight), 0)} %
                </Paragraph>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PoolSummary({ tokens, fees, isMobile = false }) {
  const t = useTranslations()
  const [show, setShow] = useState(false)
  return (
    <div className={!isMobile ? 'lg:rounded-xl lg:bg-neutral-900 lg:p-5' : ''}>
      <TextHeading className={cn('font-archia text-3xl font-semibold text-neutral-50', isMobile && 'hidden')}>
        {t('Pool Attributes')}
      </TextHeading>
      <div className={cn(show ? 'max-lg:space-y-2' : '', isMobile ? 'block lg:hidden' : 'hidden')}>
        <div className='flex flex-row items-center justify-between gap-2'>
          <div className='w-full rounded-lg bg-neutral-900 px-4 py-1'>
            <TextHeading className='font-archia text-xl font-semibold text-neutral-50 lg:text-3xl'>
              {t('Pool Attributes')}
            </TextHeading>
          </div>
          <EmphasisButton
            className='ml-auto block w-fit bg-neutral-600 p-2 lg:hidden'
            onClick={() => setShow(prev => !prev)}
          >
            <InfoNeutralIcon className='h-4 w-4' />
          </EmphasisButton>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={cn('overflow-hidden', !isMobile && 'hidden')}
        >
          <Attributes fees={fees} tokens={tokens} isMobile />
        </motion.div>
      </div>
      <div className={cn(isMobile && 'hidden')}>
        <Attributes fees={fees} tokens={tokens} isMobile={false} />
      </div>
    </div>
  )
}

export default PoolSummary
