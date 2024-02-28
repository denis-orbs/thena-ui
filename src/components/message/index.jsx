import React from 'react'
import { ChainId } from 'thena-sdk-core'
import { bsc, opBNB } from 'viem/chains'

import { AlertTriangleIcon, CheckGradientIcon, InfoCircleGradient, XIcon } from '@/svgs'

import { EmphasisButton } from '../buttons/Button'
import { TextIconButton } from '../buttons/IconButton'
import Highlight from '../highlight'
import { Paragraph, TextHeading } from '../typography'

export function SuccessMessage({ closeToast, title, desc, hash = null, chainId }) {
  return (
    <div className='flex items-start justify-between gap-4'>
      <div className='flex items-center gap-4'>
        <Highlight className='bg-success-700'>
          <CheckGradientIcon className='h-4 w-4' />
        </Highlight>
        <div className='w-full'>
          <TextHeading>{title}</TextHeading>
          {desc && <Paragraph className='text-sm'>{desc}</Paragraph>}
          {hash && (
            <EmphasisButton
              className='mt-2 p-2 text-xs'
              onClick={() => {
                window.open(
                  `${
                    chainId === ChainId.BSC ? bsc.blockExplorers.default.url : opBNB.blockExplorers.default.url
                  }/tx/${hash}`,
                  '_blank',
                )
              }}
            >
              See transaction
            </EmphasisButton>
          )}
        </div>
      </div>
      <TextIconButton className='h-6 w-6 lg:h-6 lg:w-6' classNames='lg:h-4 lg:w-4' Icon={XIcon} onClick={closeToast} />
    </div>
  )
}

export function ErrorMessage({ closeToast, title, desc }) {
  return (
    <div className='flex items-start justify-between gap-4'>
      <div className='flex items-center gap-4'>
        <Highlight className='bg-error-500'>
          <InfoCircleGradient className='h-4 w-4' />
        </Highlight>
        <div>
          <div className='flex flex-col gap-1'>
            <TextHeading>{title}</TextHeading>
            {desc && <Paragraph className='text-sm'>{desc}</Paragraph>}
          </div>
        </div>
      </div>
      <TextIconButton className='h-6 w-6 lg:h-6 lg:w-6' classNames='lg:h-4 lg:w-4' Icon={XIcon} onClick={closeToast} />
    </div>
  )
}

export function WarnMessage({ closeToast, desc }) {
  return (
    <div className='flex items-start justify-between gap-4'>
      <div className='flex items-center gap-4'>
        <Highlight className='bg-warn-700'>
          <AlertTriangleIcon className='h-4 w-4' />
        </Highlight>
        <div>
          <div className='flex flex-col gap-1'>
            <TextHeading>Warning</TextHeading>
            {desc && <Paragraph className='text-sm'>{desc}</Paragraph>}
          </div>
        </div>
      </div>
      <TextIconButton className='h-6 w-6 lg:h-6 lg:w-6' classNames='lg:h-4 lg:w-4' Icon={XIcon} onClick={closeToast} />
    </div>
  )
}
