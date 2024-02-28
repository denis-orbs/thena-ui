/* eslint-disable class-methods-use-this */

import NextImage from '@/components/image/NextImage'
import Toggle from '@/components/toggle'

import { usePersistedStore } from '.'

export function LiquidityHubRouting() {
  return (
    <div className='mt-5 flex justify-center gap-[5px]'>
      Via LiquidityHub powered by{' '}
      <a
        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        href='https://www.orbs.com/'
        target='_blank'
        rel='noreferrer'
      >
        Orbs <OrbsLogo />
      </a>
    </div>
  )
}

export function LiquidityHubPoweredByOrbs() {
  return (
    <div className='mt-5' style={{ display: 'flex', justifyContent: 'center' }}>
      <a className='flex items-center gap-[5px] text-sm' href='https://www.orbs.com/' target='_blank' rel='noreferrer'>
        <span className='text-[13px] text-[#9690b9] lg:text-[17px]'>Powered by</span>{' '}
        <span style={{ fontSize: 16 }}>Orbs</span> <OrbsLogo />
      </a>
    </div>
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
    <a href={href} target='_blank' rel='noreferrer'>
      {children}
    </a>
  )
}

export function LiquidityHubSettings() {
  const { liquidityHubEnabled, updateLiquidityHubEnabled } = usePersistedStore()

  return (
    <div className='w-full'>
      <div className='flex items-center justify-between space-x-1.5'>
        <p className='text-lg font-medium'>Liquidity Hub</p>
        <Toggle checked={liquidityHubEnabled} onChange={updateLiquidityHubEnabled} toggleId='liquidityHub' label='' />
      </div>
      <div className='mt-[9px] flex items-center space-x-[9px]'>
        <p className='inline text-sm text-neutral-300'>
          <OrbsLogo /> <OrbsLink href='https://www.orbs.com/liquidity-hub/'>Liquidity Hub</OrbsLink>, powered by{' '}
          <OrbsLink href='https://www.orbs.com'>Orbs</OrbsLink>, may provide better price by aggregating liquidity from
          multiple sources.{' '}
          <span>
            <OrbsLink href='https://www.orbs.com/liquidity-hub/'>For more info.</OrbsLink>
          </span>
        </p>
      </div>
    </div>
  )
}
