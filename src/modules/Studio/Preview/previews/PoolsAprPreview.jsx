import Divider from '@/components/divider'
import IconGroup from '@/components/icongroup'
import { TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'

import EmptyShow from './EmptyShow'
import { normalizeAssetUrl } from '../../lib/utils'
import BorderGradient from '../../StudioLayout/BorderGradient'

function PairInfo({ pair, size = 'lg', type = 'normal', className }) {
  const background = { background: 'linear-gradient(180deg, rgba(40, 27, 46, 0.48) 0%, rgba(40, 27, 46, 0) 100%)' }
  return type === 'normal' ? (
    <div
      className={cn('relative flex flex-col items-center rounded-xl px-5 py-6', className)}
      style={size !== 'lg' ? background : {}}
    >
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
        {pair.type === 'Conc Liquidity' ? 'Conc. Liquidity' : pair.type}
      </div>
      <IconGroup
        classNames={{
          image: cn('outline-none', size === 'lg' ? '!size-[166px]' : size === 'md' ? '!size-[60px]' : '!size-[52px]'),
        }}
        className={cn('*:not-first:-ml-4', size === 'lg' && '*:not-first:-ml-[58px]')}
        logo1={normalizeAssetUrl(pair.token0.logoURI ?? UNKNOWN_LOGO)}
        logo2={normalizeAssetUrl(pair.token1.logoURI ?? UNKNOWN_LOGO)}
        width={size === 'lg' ? 166 : size === 'md' ? 60 : 52}
        height={size === 'lg' ? 166 : size === 'md' ? 60 : 52}
        style={{
          border: `${size === 'lg' ? '10px' : '4px'} solid ${size === 'lg' ? 'rgba(26, 13, 31, 0.2)' : '#1A121E'}`,
        }}
      />
      <TextHeading
        className={cn(
          'font-archia text-[68px] leading-[77px] font-semibold uppercase',
          size !== 'lg' && 'mt-3 text-[28px] leading-7',
        )}
      >
        {pair.symbol}
      </TextHeading>
      {size !== 'lg' && <Divider className='my-5 h-px w-full' />}
      <TextHeading
        className={cn(
          'flex items-center gap-1.5 text-[26px] leading-[35px] font-semibold tracking-[-1px] text-nowrap',
          size === 'lg' && 'font-archia gap-2.5 text-8xl leading-[101px]',
        )}
        style={{ color: '#D642DB' }}
      >
        <span className={cn(size === 'lg' && 'text-4xl')}>APR{size !== 'lg' && ':'}</span>
        {` ${pair.apr}`}
      </TextHeading>
      <TextHeading className={cn('text-2xl leading-[31px] font-medium', size === 'lg' && 'text-4xl leading-[43px]')}>
        <span className='text-neutral-300'>TVL </span>${formatAmount(pair.tvlUSD)}
      </TextHeading>
    </div>
  ) : (
    <div className={cn('relative flex flex-col gap-4 rounded-xl p-4', className)} style={background}>
      <BorderGradient />
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <IconGroup
            logo1={normalizeAssetUrl(pair.token0.logoURI ?? UNKNOWN_LOGO)}
            logo2={normalizeAssetUrl(pair.token1.logoURI ?? UNKNOWN_LOGO)}
            width={32}
            height={32}
            classNames={{ image: '!outline-none' }}
            style={{
              border: '4px solid #1A121E',
            }}
          />
          <TextHeading className='font-archia max-w-[118px] text-base font-medium uppercase'>
            {(() => {
              // Create a temporary element to measure text width
              const canvas = document.createElement('canvas')
              const context = canvas.getContext('2d')
              context.font = '16px Archia'
              const textWidth = context.measureText(pair.symbol).width

              // Only break if text width exceeds approximately 118px
              if (textWidth > 118) {
                return pair.symbol.split('/').map((part, index, array) => (
                  <span className='leading-5!' key={index}>
                    {part}
                    {index < array.length - 1 && '/'}
                    {index < array.length - 1 && <br />}
                  </span>
                ))
              }
              return <span className='leading-5'>{pair.symbol}</span>
            })()}
          </TextHeading>
        </div>
        <div
          className={cn(
            'w-fit rounded-full text-nowrap',
            'border px-2 py-0.5 text-xs leading-4 font-normal text-neutral-200',
          )}
          style={{
            borderColor: 'color-mix(in oklab, #FFFFFF 8%, transparent)',
          }}
        >
          {pair.type === 'Conc Liquidity' ? 'C. Liquidity' : pair.type}
        </div>
      </div>
      <Divider className='h-px w-full' />
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-base font-medium'>
          <TextHeading className='font-medium text-neutral-300'>APR</TextHeading>
          <TextHeading className='font-medium text-neutral-50'>{pair.apr}</TextHeading>
        </div>
        <div className='flex items-center justify-between text-base font-medium'>
          <TextHeading className='font-medium text-neutral-300'>TVL</TextHeading>
          <TextHeading className='font-medium text-neutral-50'>${formatAmount(pair.tvlUSD)}</TextHeading>
        </div>
      </div>
    </div>
  )
}

export default function PoolsAprPreview({ state }) {
  const { pairs: _pairs } = state
  const pairs = (_pairs || []).filter(Boolean)

  if ((pairs || []).length === 0) {
    return <EmptyShow />
  }

  return (
    <div
      className={cn(
        'h-full w-full px-10',
        pairs.length > 1 && 'pt-[56px]',
        pairs.length === 2 && 'pt-[82px]',
        pairs.length === 3 && 'pt-20',
      )}
    >
      <div className='grid grid-cols-1 gap-8'>
        <div className='flex w-full justify-center gap-x-5.5'>
          {pairs.slice(0, pairs.length !== 4 ? 3 : 2).map((pair, index) => (
            <PairInfo
              key={`${pair?.id}_${index}}`}
              pair={pair}
              size={pairs.length === 1 ? 'lg' : pairs.length === 2 ? 'md' : 'sm'}
              type={pairs.length < 4 ? 'normal' : 'compact'}
              className={cn(
                pairs.length === 2 && 'w-[380px]',
                (pairs.length > 4 || pairs.length === 3) && 'w-[300px]',
                pairs.length === 4 && 'w-[364px]',
              )}
            />
          ))}
        </div>
        {pairs.length > 3 && (
          <div className='flex w-full justify-center gap-x-5.5'>
            {pairs.slice(pairs.length !== 4 ? 3 : 2).map((pair, index) => (
              <PairInfo
                key={`${pair?.id}_${index}}`}
                pair={pair}
                size={pairs.length === 1 ? 'lg' : pairs.length === 2 ? 'md' : 'sm'}
                type={pairs.length < 4 ? 'normal' : 'compact'}
                className={cn('w-[300px]', pairs.length === 4 && 'w-[364px]')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
