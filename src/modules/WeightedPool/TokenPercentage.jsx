import CircleImage from '@/components/image/CircleImage'
import { Paragraph, TextHeading } from '@/components/typography'

export function TokenPercentage({ token }) {
  return (
    <div className='flex items-center gap-[6px]'>
      <CircleImage
        className='h-6 w-6 outline outline-4 outline-[#1C2027]'
        src={token?.logoURI ?? ''}
        alt={`${token.symbol} Logo`}
      />
      <TextHeading>{token.symbol}</TextHeading>
      <Paragraph>50%</Paragraph>
    </div>
  )
}

export function ListTokenPercantage({ listToken }) {
  return (
    <div className='flex items-center gap-[14px]'>
      {listToken?.length && listToken.map(token => <TokenPercentage token={token} />)}
    </div>
  )
}
