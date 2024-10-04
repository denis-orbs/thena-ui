import Link from 'next/link'
import React, { useState } from 'react'
import { useTranslations } from 'use-intl'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import CheckBox from '@/components/checkbox'
import Modal, { ModalBody } from '@/components/modal'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { NotShowDiscoverArenaModal } from '@/constant'
import { useWindowSize } from '@/hooks/useWindowSize'
import { ChevronRightIcon } from '@/svgs'

function DiscoverArenaModal() {
  const [checked, setChecked] = useState(false)
  const t = useTranslations()

  const [isOpen, setIsOpen] = useState(!localStorage.getItem(NotShowDiscoverArenaModal))

  const windowSize = useWindowSize()

  const handleChecked = () => {
    setChecked(prev => {
      if (!prev) {
        localStorage.setItem(NotShowDiscoverArenaModal, true)
        return true
      }
      localStorage.removeItem(NotShowDiscoverArenaModal)
      return false
    })
  }

  return (
    <Modal
      width={windowSize.width >= 1024 ? 1024 : '80%'}
      isOpen={isOpen}
      closeModal={() => setIsOpen(false)}
      background='url("/images/arena/bg-discover.png") no-repeat'
    >
      <ModalBody className='lg:py-[80px]'>
        <div className='he mx-auto flex  min-h-[274px] flex-col items-center gap-3 text-center lg:w-[744px]'>
          <TextHeading className='font-archia text-3xl text-neutral-50 lg:text-5xl'>
            {t('Discover ARENA heading')}
          </TextHeading>
          <TextSubHeading className='text-[16px] text-neutral-300 lg:text-[18px]'>
            {t('Discover ARENA sub heading')}
          </TextSubHeading>
          <div className='flex items-center'>
            <CheckBox checked={checked} onClick={handleChecked} />
            <span className='ml-2 text-[15px] text-neutral-300 lg:text-[16px] 2xl:ml-3'>
              {t("Don't show this again")}
            </span>
          </div>
          <div className='mt-2 flex w-full flex-col items-center justify-center gap-2 text-center lg:flex-row'>
            <EmphasisButton onClick={() => setIsOpen(false)} className='w-full p-3 text-neutral-100 lg:w-[140px]'>
              {t('Close')}
            </EmphasisButton>
            <Link className='w-full lg:w-[140px]' href='https://docs.thena.fi/thena/arena' target='_blank'>
              <PrimaryButton className='w-full p-3'>
                {t('Learn more')}
                <ChevronRightIcon className='h-4 w-4 text-white' />
              </PrimaryButton>
            </Link>
          </div>
        </div>
      </ModalBody>
    </Modal>
  )
}

export default DiscoverArenaModal
