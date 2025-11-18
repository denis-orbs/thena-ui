import { useTranslations } from 'next-intl'
import React, { useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'

import { TextIconButton } from '@/components/buttons/IconButton'
import NextImage from '@/components/image/NextImage'
import Input from '@/components/input'
import Modal, { ModalBody } from '@/components/modal'
import Selection from '@/components/selection'
import Toggle from '@/components/toggle'
import CustomTooltip from '@/components/tooltip'
import { LOCALES } from '@/constant'
import InfoIcon from '@/icons/InfoIcon'
import { useChainSettings, useLocaleSettings, useSettings } from '@/state/settings/hooks'

import SettingsIcon from '~/svgs/settings.svg'

const slipageTolerance = [0.1, 0.5, 1]
const priceProtectionTolerance = [1, 3, 5]

function TxnSettings({ isTwap }) {
  const [popup, setPopup] = useState(false)
  const { slippage, deadline, updateSlippage, updateDeadline, priceProtection, updatePriceProtection } = useSettings()
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

  const priceProtectionSelections = useMemo(
    () =>
      priceProtectionTolerance.map(ele => ({
        label: ele,
        active: priceProtection === Number(ele),
        onClickHandler: () => {
          updatePriceProtection(Number(ele))
        },
      })),
    [priceProtection, updatePriceProtection],
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
          {isTwap ? (
            <div className='flex w-full flex-col items-start justify-start gap-3'>
              <div className='flex items-center gap-1'>
                <p className='text-lg font-medium'>{t('Price Protection')}</p>
                <InfoIcon className='h-4 w-4 stroke-neutral-400' data-tooltip-id={t('priceProtectionTooltip')} />
              </div>
              <CustomTooltip id={t('priceProtectionTooltip')} place='top' className='z-50 max-w-[240px]'>
                <p className='break-words'>{t('priceProtectionTooltip')}</p>
              </CustomTooltip>
              <div className='inline-flex w-full justify-between'>
                <Selection data={priceProtectionSelections} />
                <Input
                  classNames={{
                    input: 'w-[110px]',
                  }}
                  val={priceProtection}
                  onChange={e => updatePriceProtection(Number(e.target.value) || 0)}
                  suffix='%'
                />
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
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
      <div className='flex items-center justify-between gap-1.5'>
        <p className='text-lg font-medium'>Liquidity Hub</p>
        <Toggle checked={liquidityHubEnabled} onChange={updateLiquidityHubEnabled} toggleId='liquidityHub' label='' />
      </div>
      <div className='mt-[9px] flex items-center gap-2.5'>
        <p className='inline text-sm text-neutral-300'>
          {locale !== LOCALES.zh_TW && locale !== LOCALES.zh_CN ? (
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
