import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

import Box from '@/components/box'
import { TextSubHeading } from '@/components/typography'
import { cn } from '@/lib/utils'
import { ChevronUpIcon, InfoIcon, LinkExternalPrimaryIcon } from '@/svgs'

function WarningZapper() {
  const warningTextRef = useRef(null)
  const [warningTextHeight, setWarningTextHeight] = useState('0px')
  const [showWarning, setShowWarning] = useState(true)

  useEffect(() => {
    if (warningTextRef.current) {
      setWarningTextHeight(showWarning ? `${warningTextRef.current.scrollHeight}px` : '0px')
    }
  }, [showWarning])
  return (
    <Box
      className={cn(
        'flex flex-row items-start gap-2.5 border border-primary-800 bg-primary-950 py-3 md:gap-4',
        !showWarning && 'items-center',
      )}
    >
      <InfoIcon className='my-1 w-5 min-w-5 stroke-primary-600 md:my-2 md:w-8 md:min-w-8' />
      <div>
        <p className='mb-2 text-xl font-medium text-primary-100'>Important Information about Zapper</p>
        <div
          className='overflow-hidden transition-all duration-300 ease-in-out'
          style={{ height: warningTextHeight }}
          ref={warningTextRef}
        >
          <TextSubHeading className='text-base text-primary-100'>
            <p>This feature is incompatible with tokens that have tax implications.</p>
            <p className='mb-2'>
              If you are zapping a considerable amount of funds, please ensure to use protection against sandwich
              attacks to safeguard your investment. This precaution helps protecting your transaction from potential
              front-running and other malicious activities.
            </p>
            <Link
              target='_blank'
              className='flex items-center gap-2 text-primary-600'
              href='https://www.bnbchain.org/en/blog/protecting-users-from-sandwich-attacks-bnb-chain-introduces-mev-protection-with-several-wallets'
              rel='noreferrer'
            >
              Learn more about protection from sandwich attacks here
              <LinkExternalPrimaryIcon className='inline-block h-4 w-4 !stroke-primary-600' />
            </Link>
          </TextSubHeading>
        </div>
      </div>
      <ChevronUpIcon
        className={cn(
          'w-7 min-w-7 cursor-pointer p-1 transition-all duration-300 ease-in-out md:w-9 md:min-w-9 md:p-2',
          !showWarning && 'rotate-180',
        )}
        onClick={() => setShowWarning(show => !show)}
      />
    </Box>
  )
}

export default WarningZapper
