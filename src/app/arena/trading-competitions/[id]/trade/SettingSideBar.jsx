import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'

import { TextIconButton } from '@/components/buttons/IconButton'
import Input from '@/components/input'
import Modal, { ModalBody } from '@/components/modal'
import Selection from '@/components/selection'
import { useSettings } from '@/state/settings/hooks'
import { SettingsIcon } from '@/svgs'

const slipageTolerance = [0.1, 0.5, 1]
export const serviceList = ['1inch', 'Algebra', 'OOE', 'Odos']

function SettingSideBar({ service = serviceList[0], setService }) {
  const [popup, setPopup] = useState(false)
  const { slippage, deadline, updateSlippage, updateDeadline } = useSettings()
  const t = useTranslations()

  const selections = useMemo(
    () =>
      slipageTolerance.map(ele => ({
        label: ele,
        active: slippage === Number(ele),
        onClickHandler: () => {
          updateSlippage(Number(ele))
        },
      })),
    [slippage, updateSlippage],
  )

  const services = useMemo(
    () =>
      serviceList.map(item => ({
        label: item,
        active: item === service,
        onClickHandler: () => {
          setService(item)
        },
      })),
    [service, setService],
  )

  return (
    <>
      <TextIconButton
        Icon={SettingsIcon}
        onClick={() => {
          setPopup(true)
        }}
      />
      <Modal
        isOpen={popup}
        closeModal={() => {
          setPopup(false)
        }}
        width={480}
        title='Transaction Settings'
      >
        <ModalBody>
          <div className='flex w-full flex-col items-start justify-start gap-3'>
            <p className='text-lg font-medium'>{t('Slippage Tolerance')}</p>
            <div className='inline-flex w-full justify-between'>
              <Selection data={selections} />
              <Input
                classNames={{
                  input: 'w-[110px]',
                }}
                val={slippage}
                onChange={e => updateSlippage(Number(e.target.value) || 0)}
                suffix='%'
              />
            </div>
          </div>
          <div className='flex w-full flex-col items-start justify-start gap-3 self-stretch'>
            <p className='text-lg font-medium'>{t('Option')}</p>
            <Selection data={services} />
          </div>
          {service === 'Algebra' && (
            <div className='flex flex-col items-start justify-start gap-3 self-stretch'>
              <p className='text-lg font-medium'>{t('Transaction Deadline')}</p>
              <Input
                classNames={{
                  input: 'w-[120px] pr-[82px]',
                }}
                val={deadline}
                onChange={e => updateDeadline(Number(e.target.value) || 0)}
                suffix={t('minutes')}
                max={50}
                autoFocus
              />
            </div>
          )}
        </ModalBody>
      </Modal>
    </>
  )
}

export default SettingSideBar
