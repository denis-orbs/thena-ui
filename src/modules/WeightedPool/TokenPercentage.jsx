import { useTranslations } from 'next-intl'

import { Paragraph } from '@/components/typography'
import { useWindowSize } from '@/hooks/useWindowSize'
import { cn } from '@/lib/utils'

import GroupIconTokens from '../../components/icongroup/GroupIconTokens'

export function TokenPercentage({ tokens, poolAddress, small = false }) {
  const t = useTranslations()
  const { length } = tokens || []
  const weights = tokens.map(token => token.weight).filter(w => typeof w === 'number')

  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const windowSize = useWindowSize()
  const isSmall = windowSize.width < 1440
  const isMobile = windowSize.width < 768
  return (
    <div className='flex flex-row items-center gap-2'>
      <GroupIconTokens
        classNames={{
          image: cn('outline-2 w-7 h-7', length <= 4 ? 'w-7 h-7' : 'w-6 h-6'),
          rows: length > 2 ? (isMobile ? '-space-x-2' : '-space-x-3') : '-space-x-2',
        }}
        width={isMobile && small ? 16 : length <= 4 ? (isSmall && small ? 28 : 32) : 24}
        height={isMobile && small ? 16 : length <= 4 ? (isSmall && small ? 28 : 32) : 24}
        tokens={tokens}
        poolAddress={poolAddress}
      />
      <div className='flex flex-col gap-0 md:gap-1'>
        <div className='text-[10px] leading-4 md:text-base'>
          {tokens.slice(0, isSmall ? 2 : 3).map((token, index) => (
            <Paragraph className='text-[10px] leading-4 md:text-base' key={token.address}>
              {`${token?.symbol}${index !== Math.min(2, tokens.slice(0, isSmall ? 2 : 3).length - 1) ? '/' : ''}`}
            </Paragraph>
          ))}
          <Paragraph className='inline-block text-[10px] leading-4 md:text-base xl:hidden'>
            <span>&nbsp;</span>
            {weights.length > 0 ? `${minWeight}-${maxWeight}%` : ''}
          </Paragraph>
          {tokens.length > (isSmall ? 2 : 3) && (
            <Paragraph className='hidden text-[10px] leading-4 md:text-base xl:inline-block'>...</Paragraph>
          )}
        </div>
        <div className='text-[10px] leading-4 md:text-base'>
          <Paragraph className='text-[10px] leading-4 md:text-base'>{t('Weighted Pool')}</Paragraph>
          <Paragraph className='hidden text-[10px] leading-4 md:text-base xl:inline-block'>
            <span>&nbsp;</span>
            {weights.length > 0 ? `${minWeight}-${maxWeight}%` : ''}
          </Paragraph>
        </div>
      </div>
    </div>
  )
}

export function ListTokenPercantage({ listToken, poolAddress, small }) {
  return <TokenPercentage tokens={listToken} poolAddress={poolAddress} small={small} />
}
