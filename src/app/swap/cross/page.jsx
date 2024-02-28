import React from 'react'

export default function CrossSwapPage() {
  return (
    <div className='flex w-full justify-center'>
      <iframe
        title='THENA'
        className='h-[780px] w-[375px] rounded-xl lg:h-[700px] lg:w-[480px]'
        src='https://widget.squidrouter.com/iframe?config=%7B%22integratorId%22%3A%22thena-swap-widget%22%2C%22companyName%22%3A%22THENA%22%2C%22style%22%3A%7B%22neutralContent%22%3A%22%23685770%22%2C%22baseContent%22%3A%22%23F3F2F4%22%2C%22base100%22%3A%22%23412D4C%22%2C%22base200%22%3A%22%23281B2E%22%2C%22base300%22%3A%22%23171D2B%22%2C%22error%22%3A%22%23F51C00%22%2C%22warning%22%3A%22%23F5DF00%22%2C%22success%22%3A%22%232AD16C%22%2C%22primary%22%3A%22%23DC00D4%22%2C%22secondary%22%3A%22%23DC00D4%22%2C%22secondaryContent%22%3A%22%23F3F2F4%22%2C%22neutral%22%3A%22%231A121E%22%2C%22roundedBtn%22%3A%225px%22%2C%22roundedCornerBtn%22%3A%22999px%22%2C%22roundedBox%22%3A%225px%22%2C%22roundedDropDown%22%3A%227px%22%7D%2C%22slippage%22%3A1.5%2C%22infiniteApproval%22%3Afalse%2C%22enableExpress%22%3Atrue%2C%22initialFromChainId%22%3A1%2C%22initialToChainId%22%3A56%2C%22apiUrl%22%3A%22https%3A%2F%2Fapi.squidrouter.com%22%2C%22comingSoonChainIds%22%3A%5B%5D%2C%22titles%22%3A%7B%22swap%22%3A%22Swap%22%2C%22settings%22%3A%22Settings%22%2C%22wallets%22%3A%22Wallets%22%2C%22tokens%22%3A%22Select%20Token%22%2C%22chains%22%3A%22Select%20Chain%22%2C%22history%22%3A%22History%22%2C%22transaction%22%3A%22Transaction%22%2C%22allTokens%22%3A%22Select%20Token%22%2C%22destination%22%3A%22Destination%20address%22%7D%2C%22priceImpactWarnings%22%3A%7B%22warning%22%3A3%2C%22critical%22%3A5%7D%2C%22showOnRampLink%22%3Afalse%2C%22preferDex%22%3A%5B%22%5B%27Thena_v3%27%22%2C%22%20%27Thena%27%5D%22%5D%7D'
      />
    </div>
  )
}
