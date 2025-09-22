import Divider from '@/components/divider'
import IconGroup from '@/components/icongroup'
import { TextHeading } from '@/components/typography'
import { UNKNOWN_LOGO } from '@/constant'
import { cn, formatAmount } from '@/lib/utils'

import EmptyShow from './EmptyShow'
import { normalizeAssetUrl } from '../../lib/utils'
import BorderGradient from '../../StudioLayout/BorderGradient'

function PairInfo({ pair, size = 'lg', type = 'normal' }) {
  const background = { background: 'linear-gradient(180deg, rgba(40, 27, 46, 0.48) 0%, rgba(40, 27, 46, 0) 100%)' }
  return type === 'normal' ? (
    <div className='relative flex flex-col items-center rounded-xl px-5 py-6' style={size !== 'lg' ? background : {}}>
      {size !== 'lg' && <BorderGradient />}
      <div
        className={cn(
          'font-archia w-fit items-center rounded-full',
          'border border-[#FFFFFF] px-2 py-[5px] leading-4 font-normal text-neutral-200',
          size === 'lg' ? 'mb-13 text-base' : 'mb-[22px] px-2 py-0.5 text-xs leading-4',
        )}
      >
        {pair.type === 'Conc Liquidity' ? 'C. Liquidity' : pair.type}
      </div>
      <IconGroup
        classNames={{
          image: cn('outline-4', size === 'lg' ? '!size-[166px]' : size === 'md' ? '!size-[60px]' : '!size-[52px'),
        }}
        logo1={normalizeAssetUrl(pair.token0.logoURI ?? UNKNOWN_LOGO)}
        logo2={normalizeAssetUrl(pair.token1.logoURI ?? UNKNOWN_LOGO)}
        width={size === 'lg' ? 166 : size === 'md' ? 60 : 52}
        height={size === 'lg' ? 166 : size === 'md' ? 60 : 52}
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
          'flex items-center gap-1.5 text-[28px] leading-[35px] font-semibold',
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
    <div className='relative flex flex-col gap-4 rounded-xl p-4' style={background}>
      <BorderGradient />
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <IconGroup
            logo1={normalizeAssetUrl(pair.token0.logoURI ?? UNKNOWN_LOGO)}
            logo2={normalizeAssetUrl(pair.token1.logoURI ?? UNKNOWN_LOGO)}
            width={32}
            height={32}
            classNames={{ image: '!outline-[3px]' }}
          />
          <TextHeading className='font-archia text-base leading-7 font-medium uppercase'>{pair.symbol}</TextHeading>
        </div>
        <div
          className={cn(
            'font-archia w-fit rounded-full text-nowrap',
            'border border-[#FFFFFF] px-2 py-0.5 text-xs leading-4 font-normal text-neutral-200',
          )}
        >
          {pair.type === 'Conc Liquidity' ? 'C. Liquidity' : pair.type}
        </div>
      </div>
      <Divider className='h-px w-full' />
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-base font-medium'>
          <TextHeading className='text-neutral-300'>APR</TextHeading>
          <TextHeading className='text-neutral-300'>{pair.apr}</TextHeading>
        </div>
        <div className='flex items-center justify-between text-base font-medium'>
          <TextHeading className='text-neutral-300'>TVL</TextHeading>
          <TextHeading className='text-neutral-300'>${formatAmount(pair.tvlUSD)}</TextHeading>
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
    <div className={cn('h-full w-full px-10', pairs.length > 1 && 'pt-16')}>
      <div
        className={cn(
          'grid gap-x-5.5 gap-y-8',
          pairs.length === 2 || pairs.length === 4 ? 'grid-cols-2' : 'grid-cols-3',
          pairs.length === 1 && 'grid-cols-1',
        )}
      >
        {pairs.map(pair => (
          <PairInfo
            key={pair?.id}
            pair={pair}
            size={pairs.length === 1 ? 'lg' : pairs.length === 2 ? 'md' : 'sm'}
            type={pairs.length < 4 ? 'normal' : 'compact'}
          />
        ))}
      </div>
    </div>
  )
}
