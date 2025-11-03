import { useTranslations } from 'next-intl'
import React from 'react'
import { ChainId } from 'thena-sdk-core'
import { bsc, bscTestnet, opBNB } from 'viem/chains'

import AlertTriangleIcon from '~/svgs/alert-triangle.svg'
import CheckGradientIcon from '~/svgs/checkGradient.svg'
import InfoCircleGradient from '~/svgs/info-circle-gradient.svg'
import XIcon from '~/svgs/x-close.svg'

import { EmphasisButton } from '../buttons/Button'
import { TextIconButton } from '../buttons/IconButton'
import Highlight from '../highlight'
import { Paragraph, TextHeading } from '../typography'

function getScanner(chainId) {
  switch (chainId) {
    case ChainId.OPBNB:
      return opBNB.blockExplorers.default.url

    case 97:
      return bscTestnet.blockExplorers.default.url

    case ChainId.BSC:
    default:
      return bsc.blockExplorers.default.url
  }
}

export function SuccessMessage({ closeToast, title, desc, hash = null, chainId, icon = null, translate = true }) {
  const t = useTranslations()
  const urlScanner = getScanner(chainId)

  return (
    <div className='flex items-start justify-between gap-4'>
      <div className='flex items-center gap-4'>
        <Highlight className='bg-success-700'>{icon || <CheckGradientIcon className='h-4 w-4' />}</Highlight>
        <div className='w-full'>
          <TextHeading>{translate ? t(title) : title}</TextHeading>
          {desc && <Paragraph className='text-sm'>{t(desc)}</Paragraph>}
          {hash && (
            <EmphasisButton
              className='mt-2 p-2 text-xs'
              onClick={() => {
                window.open(`${urlScanner}/tx/${hash}`, '_blank')
              }}
            >
              {t('See Transaction')}
            </EmphasisButton>
          )}
        </div>
      </div>
      <TextIconButton className='h-6 w-6 lg:h-6 lg:w-6' classNames='lg:h-4 lg:w-4' Icon={XIcon} onClick={closeToast} />
    </div>
  )
}

export function ErrorMessage({ closeToast, title, desc, icon = null, translate = true }) {
  const t = useTranslations()

  return (
    <div className='flex items-start justify-between gap-4'>
      <div className='flex items-center gap-4'>
        <Highlight className='bg-error-500'>{icon || <InfoCircleGradient className='h-4 w-4' />}</Highlight>
        <div>
          <div className='flex flex-col gap-1'>
            <TextHeading>{translate ? t(title) : title}</TextHeading>
            {desc && <Paragraph className='text-sm'>{t(desc)}</Paragraph>}
          </div>
        </div>
      </div>
      <TextIconButton className='h-6 w-6 lg:h-6 lg:w-6' classNames='lg:h-4 lg:w-4' Icon={XIcon} onClick={closeToast} />
    </div>
  )
}

export function WarnMessage({ closeToast, desc, params = undefined }) {
  const t = useTranslations()

  return (
    <div className='flex items-start justify-between gap-4'>
      <div className='flex items-center gap-4'>
        <Highlight className='bg-warn-700'>
          <AlertTriangleIcon className='h-4 w-4' />
        </Highlight>
        <div>
          <div className='flex flex-col gap-1'>
            <TextHeading>{t('Warning')}</TextHeading>
            {desc && <Paragraph className='text-sm'>{t(desc, params)}</Paragraph>}
          </div>
        </div>
      </div>
      <TextIconButton className='h-6 w-6 lg:h-6 lg:w-6' classNames='lg:h-4 lg:w-4' Icon={XIcon} onClick={closeToast} />
    </div>
  )
}
