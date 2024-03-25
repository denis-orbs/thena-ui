import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'

import { TextIconButton } from '@/components/buttons/IconButton'
import Input from '@/components/input'
import Modal, { ModalBody } from '@/components/modal'
import Selection from '@/components/selection'
import { useChainSettings, useSettings } from '@/state/settings/hooks'
import { SettingsIcon } from '@/svgs'

import { LiquidityHubSettings } from '../LiquidityHub/components'

const slipageTolerance = [0.1, 0.5, 1]

function TxnSettings() {
  const [popup, setPopup] = useState(false)
  const { slippage, deadline, updateSlippage, updateDeadline } = useSettings()
  const { networkId } = useChainSettings()
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
            />
          </div>
          {networkId === ChainId.BSC && <LiquidityHubSettings />}
        </ModalBody>
      </Modal>
    </>
  )
}

export default TxnSettings
