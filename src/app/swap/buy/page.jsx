import React from 'react'

export default function BuySwapPage() {
  const key = process.env.NEXT_PUBLIC_ONRAMP_KEY
  return (
    <div className='flex w-full justify-center'>
      <iframe
        // eslint-disable-next-line max-len
        src={`https://buy.onramper.com/?apiKey=${key}&defaultCrypto=bnb_bsc&themeName=dark&primaryTextColor=FCE6FB&secondaryTextColor=F3F2F4&containerColor=1A121E&primaryColor=DC00D4&secondaryColor=412D4C&cardColor=281B2E`}
        className='m-auto h-[650px] w-[375px] rounded-xl bg-neutral-900 lg:w-[480px]'
        title='Onramper Widget'
        allow='accelerometer; autoplay; camera; gyroscope; payment'
      />
    </div>
  )
}
