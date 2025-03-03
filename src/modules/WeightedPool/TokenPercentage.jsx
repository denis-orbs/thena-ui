import { Paragraph, TextHeading } from '@/components/typography'
import { cn } from '@/lib/utils'

import GroupIconTokens from '../../components/icongroup/GroupIconTokens'

export function TokenPercentage({ tokens, poolAddress }) {
  const { length } = tokens || []
  return (
    <>
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
            <TextHeading key={token.address}>{`${token?.symbol}${index !== tokens.length - 1 ? '/' : ''}`}</TextHeading>
          ))}
        </div>
        <div>
          {tokens.map((token, index) => (
            <Paragraph key={token.address}>{`${token?.weight}%${index !== tokens.length - 1 ? ',' : ''}`}</Paragraph>
          ))}
        </div>
      </div>
    </>
  )
}

export function ListTokenPercantage({ listToken, poolAddress }) {
  return <TokenPercentage tokens={listToken} poolAddress={poolAddress} />
}
