import { Paragraph } from '@/components/typography'
import { cn } from '@/lib/utils'

import GroupIconTokens from '../../components/icongroup/GroupIconTokens'

export function TokenPercentage({ tokens, poolAddress }) {
  const { length } = tokens || []
  const weights = tokens.map(token => token.weight).filter(w => typeof w === 'number')

  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  return (
    <div className='flex flex-row items-center gap-2'>
      <GroupIconTokens
        classNames={{
          image: cn('outline-2 w-7 h-7', length <= 4 ? 'w-7 h-7' : 'w-6 h-6'),
          rows: length > 2 ? '-space-x-3' : '-space-x-2',
        }}
        width={length <= 4 ? 32 : 24}
        height={length <= 4 ? 32 : 24}
        tokens={tokens}
        poolAddress={poolAddress}
      />
      <div className='flex flex-col gap-1'>
        <div>
          {tokens.map((token, index) => (
            <Paragraph className='text-[10px] leading-4 md:text-base' key={token.address}>
              {`${token?.symbol}${index !== tokens.length - 1 ? '/' : ''}`}
            </Paragraph>
          ))}
        </div>
        <div>
          <Paragraph className='text-[10px] leading-4 md:text-base'>
            {weights.length > 0 ? `${minWeight}% - ${maxWeight}%` : ''}
          </Paragraph>
        </div>
      </div>
    </div>
  )
}

export function ListTokenPercantage({ listToken, poolAddress }) {
  return <TokenPercentage tokens={listToken} poolAddress={poolAddress} />
}
