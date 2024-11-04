import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import MenuTab from '@/app/arena/MenuTab'
import Modal, { ModalBody } from '@/components/modal'
import { TextHeading } from '@/components/typography'
import { InfoIcon } from '@/svgs'

export default function AdjustNewPositionModal({ isOpen, onClose }) {
  const t = useTranslations()

  const [tabActive, setTabActive] = useState(0)

  const menuData = useMemo(
    () => [
      {
        title: t('Full range'),
        isActive: tabActive === 0,
        onClick: setTabActive(0),
      },
      {
        title: t('Safe'),
        isActive: tabActive === 1,
        onClick: setTabActive(1),
      },
      {
        title: t('Common'),
        isActive: tabActive === 2,
        onClick: setTabActive(2),
      },
      {
        title: t('Expert'),
        isActive: tabActive === 3,
        onClick: setTabActive(3),
      },
    ],
    [t, tabActive, setTabActive],
  )

  return (
    <Modal width={540} isOpen={isOpen} closeModal={onClose} title={t('Adjust New Position')}>
      <ModalBody className='flex flex-col gap-5'>
        <div className='flex flex-col gap-3'>
          <div className='flex flex-row items-center justify-between'>
            <TextHeading>{t('Range Type')}</TextHeading>
            <InfoIcon className='h-4 w-4 stroke-neutral-400' />
          </div>
          <MenuTab className='grid w-full grid-cols-4' menuData={menuData} />
        </div>
        <div className='flex items-center justify-between'>
          <TextHeading>{t('Price Range')}</TextHeading>
          {/* <Selection isSmall /> */}
        </div>
      </ModalBody>
    </Modal>
  )
}
