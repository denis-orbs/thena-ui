import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'

import CircleImage from '@/components/image/CircleImage'
import Modal from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { formatAmount } from '@/lib/utils'

export default function SelectTokenFromList({ isOpen, setIsOpen, tokens, setToken }) {
  const t = useTranslations()
  const handleSelect = useCallback(
    token => {
      setToken(token)
      setIsOpen(false)
    },
    [setIsOpen, setToken],
  )
  return (
    <Modal
      isOpen={isOpen}
      closeModal={() => {
        setIsOpen(false)
      }}
      width={540}
      title='Select Token'
    >
      <div className='mb-3 inline-flex w-full flex-col gap-4 px-6 py-3'>
        <Paragraph>{t('Tokens')}</Paragraph>
        <div className='flex flex-col gap-1'>
          {tokens.map(token => (
            <div
              onClick={() => handleSelect(token)}
              className='flex cursor-pointer flex-row items-center justify-between rounded-lg px-6 py-3 hover:bg-neutral-600'
            >
              <div className='flex flex-row items-center gap-2'>
                <CircleImage className='h-8 w-8' alt={token?.address} src={token?.logoURI || UNKNOWN_LOGO} />
                <div className='flex flex-col'>
                  <TextHeading>{token?.symbol}</TextHeading>
                  <Paragraph>{token?.name}</Paragraph>
                </div>
              </div>
              <div className='flex flex-col'>
                <TextHeading>{formatAmount(token.price)}</TextHeading>
                <Paragraph>${formatAmount(token.price)}</Paragraph>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
