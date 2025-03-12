import { motion } from 'framer-motion'
import Link from 'next/link'
import React, { useState } from 'react'

import Box from '@/components/box'
import { NewTextSubHeading, Paragraph, TextSubHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { ChevronUpIcon, InfoIcon, LinkExternalPrimaryIcon } from '@/svgs'

function WarningZapper() {
  const [showWarning, setShowWarning] = useState(true)

  return (
    <Box
      className={cn(
        'flex flex-col items-start border border-primary-800 bg-primary-950 p-4 lg:p-8',
        showWarning && 'gap-2 md:gap-4',
      )}
    >
      <div className='flex w-full gap-2 md:gap-4'>
        <InfoIcon className='size-6 min-w-6 stroke-primary-600 md:size-8 md:min-w-8' />
        <div className='flex w-full items-start justify-between md:items-center'>
          <NewTextSubHeading className='text-xl leading-6 text-primary-100 md:text-2xl'>
            Important Information about Zapper
          </NewTextSubHeading>

          <ChevronUpIcon
            className={cn(
              'w-7 min-w-7 cursor-pointer p-1 transition-all duration-300 ease-in-out md:w-9 md:min-w-9 md:p-2',
              !showWarning && 'rotate-180',
            )}
            onClick={() => setShowWarning(show => !show)}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 0, height: 0 }}
        animate={showWarning ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 0, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn('overflow-hidden pl-8 md:pl-12')}
      >
        <TextSubHeading className='flex flex-col gap-2 text-sm md:gap-4 md:text-base'>
          <Paragraph className='text-primary-100'>
            This feature is incompatible with tokens that have tax implications.
          </Paragraph>
          <Paragraph className='text-primary-100'>
            If you are zapping a considerable amount of funds, please ensure to use protection against sandwich attacks
            to safeguard your investment. This precaution helps protecting your transaction from potential front-running
            and other malicious activities.
          </Paragraph>
          <Link
            target='_blank'
            className='flex items-start gap-2 text-primary-600 md:items-center'
            href='https://www.bnbchain.org/en/blog/protecting-users-from-sandwich-attacks-bnb-chain-introduces-mev-protection-with-several-wallets'
            rel='noreferrer'
          >
            Learn more about protection from sandwich attacks here
            <LinkExternalPrimaryIcon className='inline-block w-4 min-w-4 !stroke-primary-600' />
          </Link>
        </TextSubHeading>
      </motion.div>
    </Box>
  )
}

export default WarningZapper
