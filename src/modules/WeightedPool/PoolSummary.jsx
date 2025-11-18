import { motion } from 'framer-motion'
import Image from 'next/image'
import React, { useState } from 'react'
import { useTranslations } from 'use-intl'

import { EmphasisButton } from '@/components/buttons/Button'
import Divider from '@/components/divider'
import CircleImage from '@/components/image/CircleImage'
import { NewTextSubHeading, Paragraph, TextHeading } from '@/components/typography'
import InfoIcon from '@/icons/InfoIcon'
import cn from '@/utils/classes'
import { formatAmount } from '@/utils/utils'

function Attributes({ tokens, fees, isMobile }) {
  const t = useTranslations()
  return (
    <div className={cn(isMobile && 'rounded-lg bg-neutral-900 px-5 py-3')}>
      <div className='flex items-center justify-between py-4'>
        <div className='flex items-center gap-4'>
          <Image src='/svgs/coins-hand.svg' className='size-6 lg:size-9' />
          <Paragraph className='text-sm text-neutral-50 lg:text-base'>{t('Pool Fees')}</Paragraph>
        </div>
        <Paragraph className='text-sm text-neutral-50 lg:text-base'>{`${fees} %`}</Paragraph>
      </div>

      <Divider className='my-4' />

      <div className='mx-auto mt-4 w-full'>
        <div className='w-full text-left'>
          {/* Header */}
          <div className='flex py-6'>
            <NewTextSubHeading className='flex-4 text-left text-sm lg:text-lg xl:text-xl'>Token</NewTextSubHeading>
            <NewTextSubHeading className='flex-3 text-left text-sm lg:text-lg xl:text-xl'>USD Value</NewTextSubHeading>
            <NewTextSubHeading className='flex-3 text-right text-sm lg:text-lg xl:text-xl'>Pool %</NewTextSubHeading>
          </div>

          {/* Body */}
          <div className='flex flex-col gap-4'>
            {(tokens || []).map(token => (
              <div className='flex' key={token.symbol}>
                <div className='flex flex-4 items-center gap-2 py-4'>
                  <div className='flex items-center gap-3'>
                    <CircleImage className='size-6 lg:size-9' src={token.logoURI} alt={`${token.symbol} logo`} />
                    <TextHeading className='text-sm text-neutral-50 lg:text-base'>{token.symbol}</TextHeading>
                  </div>
                </div>
                <div className='flex flex-3 items-center py-4'>
                  <Paragraph
                    className={cn(
                      'truncate text-left text-sm text-neutral-50 lg:text-base',
                      'max-w-[100px] lg:max-w-[110px] xl:max-w-[150px]',
                    )}
                  >
                    $ {formatAmount(token.price * (Number(token.amount) || 0))}
                  </Paragraph>
                </div>
                <div className='flex flex-3 items-center justify-end py-4'>
                  <Paragraph className='text-sm text-neutral-50 lg:text-base'>{token.weight} %</Paragraph>
                </div>
              </div>
            ))}

            {/* Total Row */}
            <div className='mt-4 flex pt-6 pb-1'>
              <div className='flex flex-4 items-center gap-2'>
                <NewTextSubHeading className='text-sm text-neutral-50 lg:text-xl'>{t('Total')}</NewTextSubHeading>
              </div>
              <div className='flex flex-3 items-center'>
                <NewTextSubHeading
                  className={cn(
                    'truncate text-sm text-neutral-50 lg:text-xl',
                    'max-w-[100px] lg:max-w-[110px] xl:max-w-[150px]',
                  )}
                >
                  $ {formatAmount(tokens.reduce((curr, token) => curr + Number(token.amount || 0) * token.price, 0))}
                </NewTextSubHeading>
              </div>
              <div className='flex flex-3 items-center justify-end'>
                <NewTextSubHeading className='text-sm text-neutral-50 lg:text-xl'>
                  {tokens.reduce((curr, token) => curr + Number(token.weight), 0)} %
                </NewTextSubHeading>
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
    <div className={cn('flex flex-col gap-4', !isMobile && 'lg:rounded-xl lg:bg-neutral-900 lg:p-4')}>
      <NewTextSubHeading className={cn(isMobile && 'hidden')}>{t('Pool Attributes')}</NewTextSubHeading>
      {/* NEED TO CHECK THIS */}
      <div className={cn(show ? 'max-lg:gap--2 flex flex-col' : '', isMobile ? 'block lg:hidden' : 'hidden')}>
        <div className='flex flex-row items-center justify-between gap-2'>
          <div className='h-8 w-full rounded-lg bg-neutral-900 px-4 py-1'>
            <TextHeading className='font-archia text-xs font-semibold text-neutral-50'>
              {t('Pool Attributes')}
            </TextHeading>
          </div>
          <EmphasisButton
            className={cn(
              'ml-auto block w-fit p-2 outline-0 hover:bg-neutral-900 lg:hidden',
              show ? 'bg-neutral-600' : 'bg-neutral-900',
            )}
            onClick={() => setShow(prev => !prev)}
          >
            <InfoIcon />
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
