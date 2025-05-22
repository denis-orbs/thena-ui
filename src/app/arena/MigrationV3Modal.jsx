import Link from 'next/link'
import React, { useState } from 'react'
import { useTranslations } from 'use-intl'

import { EmphasisButton } from '@/components/buttons/Button'
import CheckBox from '@/components/checkbox'
import Modal, { ModalBody } from '@/components/modal'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useWindowSize } from '@/hooks/useWindowSize'

function MigrationV3Modal({ keyOpen, title = '', titleStyle, showHeadModal = true }) {
  const [checked, setChecked] = useState(false)
  const t = useTranslations()

  const [isOpen, setIsOpen] = useState(!localStorage.getItem(keyOpen))

  const windowSize = useWindowSize()

  const handleChecked = () => {
    setChecked(prev => {
      if (!prev) {
        localStorage.setItem(keyOpen, true)
        return true
      }
      localStorage.removeItem(keyOpen)
      return false
    })
  }

  return (
    <Modal
      width={windowSize.width >= 1024 ? 1024 : '80%'}
      isOpen={isOpen}
      closeModal={() => {
        setIsOpen(false)
        if (checked) {
          localStorage.setItem(keyOpen, true)
        }
      }}
      background='url("/images/arena/bg-discover.png") no-repeat'
      title={title}
      fontSizeTitle={titleStyle}
      showHeadModal={showHeadModal}
    >
      <ModalBody className='relative lg:py-[80px]'>
        <div className='he mx-auto flex  min-h-[274px] flex-col items-center gap-3 text-center lg:w-[744px]'>
          <TextHeading className='font-archia text-4xl text-neutral-50'>Thena is migrating from V2 to V3</TextHeading>
          <TextSubHeading className='flex flex-col gap-2 text-[16px] text-neutral-300 lg:text-[18px]'>
            <span>
              For the current epoch (May 22nd to May 29th), V2 gauges are still active and emissions continue as usual.
              You can access them here:{' '}
              <Link href='https://v2.thena.fi/pools' target='_blank'>
                <span className='font-semibold text-primary-600 hover:underline'>v2.thena.fi</span>
              </Link>
              . The liquidity migration to V3 will begin next week, at the end of this epoch.
            </span>
            <span className='font-semibold text-primary-600'>
              If you’re currently holding an LP position, no action is required on your part
            </span>
          </TextSubHeading>
          <div className='group flex cursor-pointer items-center' onClick={handleChecked}>
            <CheckBox checked={checked} className='group-hover:border-neutral-400' />
            <span className='ml-2 text-[15px] text-neutral-300 group-hover:text-neutral-50 lg:text-[16px] 2xl:ml-3'>
              {t("Don't show this again")}
            </span>
          </div>
          <div className='mt-2 flex w-full flex-col items-center justify-center gap-2 text-center lg:flex-row'>
            <EmphasisButton
              onClick={() => {
                setIsOpen(false)
                if (checked) {
                  localStorage.setItem(keyOpen, true)
                }
              }}
              className='w-full p-3 text-neutral-100 lg:w-[140px]'
            >
              {t('Close')}
            </EmphasisButton>
          </div>
        </div>
      </ModalBody>
    </Modal>
  )
}

export default MigrationV3Modal
