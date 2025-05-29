import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'

import { TextIconButton } from '@/components/buttons/IconButton'
import NextImage from '@/components/image/NextImage'
import Input from '@/components/input'
import Modal, { ModalBody } from '@/components/modal'
import Selection from '@/components/selection'
import Toggle from '@/components/toggle'
import { LOCALES } from '@/constant'
import { useChainSettings, useLocaleSettings, useSettings } from '@/state/settings/hooks'
import { SettingsIcon } from '@/svgs'

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

function OrbsLogo() {
  return (
    <NextImage
      className='inline h-5 w-5 object-contain'
      alt='Orbs logo'
      src='https://www.orbs.com/assets/img/common/logo.svg'
    />
  )
}

function OrbsLink({ children, href }) {
  return (
    <a href={href} className='text-primary-100 font-medium' target='_blank' rel='noreferrer'>
      {children}
    </a>
  )
}

function LiquidityHubSettings() {
  const { liquidityHubEnabled, updateLiquidityHubEnabled } = useSettings()
  const { locale } = useLocaleSettings()
  const t = useTranslations()

  return (
    <div className='w-full'>
      <div className='flex items-center justify-between space-x-1.5'>
        <p className='text-lg font-medium'>Liquidity Hub</p>
        <Toggle checked={liquidityHubEnabled} onChange={updateLiquidityHubEnabled} toggleId='liquidityHub' label='' />
      </div>
      <div className='mt-[9px] flex items-center space-x-[9px]'>
        <p className='inline text-sm text-neutral-300'>
          {locale === LOCALES.en ? (
            <>
              <OrbsLogo /> <OrbsLink href='https://www.orbs.com/liquidity-hub/'>Liquidity Hub</OrbsLink>, powered by{' '}
              <OrbsLink href='https://www.orbs.com'>Orbs</OrbsLink>
            </>
          ) : (
            <>
              由 <OrbsLink href='https://www.orbs.com'>Orbs</OrbsLink> 提供支持的 <OrbsLogo />{' '}
              <OrbsLink href='https://www.orbs.com/liquidity-hub/'>Liquidity Hub</OrbsLink>
            </>
          )}
          {t('Provide better price')}{' '}
          <span>
            <OrbsLink href='https://www.orbs.com/liquidity-hub/'>{t('Learn More')}</OrbsLink>
          </span>
        </p>
      </div>
    </div>
  )
}

export default TxnSettings
