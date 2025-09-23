import { useTranslations } from 'next-intl'
import React from 'react'

import Divider from '@/components/divider'
import IconGroup from '@/components/icongroup'
import { TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'

import EmptyShow from './EmptyShow'
import { normalizeAssetUrl } from '../../lib/utils'
import BorderGradient from '../../StudioLayout/BorderGradient'

function IncentiveInfo({ pair, size = 'lg' }) {
  const t = useTranslations()
  const background = { background: 'linear-gradient(180deg, rgba(40, 27, 46, 0.48) 0%, rgba(40, 27, 46, 0) 100%)' }
  return (
    <div className='relative flex flex-col items-center rounded-xl px-5 py-6' style={size !== 'lg' ? background : {}}>
      {size !== 'lg' && <BorderGradient />}
      <div
        className={cn(
          'w-fit items-center rounded-full',
          'border border-[#FFFFFF]/8 px-2 py-[5px] leading-4 font-normal text-neutral-200',
          size === 'lg' ? 'mb-13 text-base' : 'mb-[22px] px-2 py-0.5 text-xs leading-4',
        )}
        style={{
          borderColor: 'color-mix(in oklab, #FFFFFF 8%, transparent)',
        }}
      >
        {pair?.type === 'Conc Liquidity' ? 'C. Liquidity' : pair?.type}
      </div>
      <IconGroup
        classNames={{
          image: cn('outline-none', size === 'lg' ? '!size-[166px]' : size === 'md' ? '!size-[60px]' : '!size-[52px]'),
        }}
        className={cn('*:not-first:-ml-4', size === 'lg' && '*:not-first:-ml-[58px]')}
        logo1={normalizeAssetUrl(pair?.token0?.logoURI ?? UNKNOWN_LOGO)}
        logo2={normalizeAssetUrl(pair?.token1?.logoURI ?? UNKNOWN_LOGO)}
        width={size === 'lg' ? 166 : size === 'md' ? 60 : 52}
        height={size === 'lg' ? 166 : size === 'md' ? 60 : 52}
        style={{
          border: `${size === 'lg' ? '10px' : '4px'} solid ${size === 'lg' ? 'rgba(26, 13, 31, 0.2)' : '#1A121E'}`,
        }}
      />
      <TextHeading
        className={cn(
          'font-archia text-[68px]! leading-[77px]! font-semibold uppercase',
          size !== 'lg' && 'mt-3 text-[28px]! leading-7!',
        )}
      >
        {pair?.symbol}
      </TextHeading>
      {size !== 'lg' && <Divider className='my-5 h-px w-full' />}
      <TextHeading
        className={cn(
          'flex items-center gap-1.5 text-[36px]! leading-[43px]! font-semibold',
          size === 'lg' && 'font-archia gap-2.5 text-8xl! leading-[101px]!',
          size === 'sm' && 'text-[32px]! leading-10!',
        )}
        style={{ color: '#D642DB' }}
      >
        ${formatAmount(pair?.gauge?.bribeUsd)}
      </TextHeading>
      <TextHeading
        className={cn(
          'text-2xl! leading-[31px]! font-medium',
          size === 'lg' && 'text-4xl! leading-[43px]!',
          size === 'sm' && 'text-[22px]! leading-[31px]!',
        )}
        style={{ color: '#D642DB' }}
      >
        {t('Voting Incentives')}
      </TextHeading>
    </div>
  )
}

function IncentivesPreview({ state }) {
  const { pairs: _pairs } = state
  if ((_pairs || []).length === 0) {
    return <EmptyShow />
  }

  const pairs = _pairs.filter(Boolean)

  return (
    <div className={cn('h-full w-full px-10', pairs.length > 1 && 'pt-25')}>
      <div
        className={cn(
          'grid',
          pairs.length === 1 && 'grid-cols-1',
          pairs.length === 2 && 'grid-cols-2 gap-7',
          pairs.length === 3 && 'grid-cols-3 gap-5.5',
        )}
      >
        {pairs.map((pair, index) => (
          <IncentiveInfo
            key={`${pair?.address}_${index}`}
            pair={pair}
            size={pairs.length === 1 ? 'lg' : pairs.length === 2 ? 'md' : 'sm'}
          />
        ))}
      </div>
    </div>
  )
}

export default IncentivesPreview
