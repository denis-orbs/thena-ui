import { Paragraph } from '@/components/typography'

import WeightedPoolLogo from './WeightedPoolLogo'

export function TokenPercentage({ tokens }) {
  return (
    <div className='flex items-center gap-[6px]'>
      <WeightedPoolLogo width={24} height={24} tokens={tokens} />
      <div className='flex flex-col gap-1'>
        <div>
          {tokens.map((token, index) => (
            <Paragraph>{`${token?.symbol}${index !== tokens.length - 1 ? '/' : ''}`}</Paragraph>
          ))}
        </div>
        <div>
          {tokens.map((token, index) => (
            <Paragraph>{`${token?.weight}%${index !== tokens.length - 1 ? ',' : ''}`}</Paragraph>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ListTokenPercantage({ listToken }) {
  return (
    <div className='flex flex-wrap items-center gap-[14px]'>
      <TokenPercentage tokens={listToken} />
    </div>
  )
}
