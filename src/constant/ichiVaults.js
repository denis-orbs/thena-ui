import { ChainId } from 'thena-sdk-core'

export const ICHI_VAULTS = {
  [ChainId.BSC]: [
    // BNB/THE (BNB)
    {
      address: '0xcbfb2d1487a8a69a8b0ee8e7fb3ca5e0c338b508',
      symbol: 'BNB/THE',
      token0Address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      token1Address: '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11',
      allowed0: true,
      allowed1: false,
      gaugeAddress: '0xba445618FFcb3edD639304D145e423a57C33E871',
      rewardAddress: '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11',
    },
    // USDT/THE (USDT)
    {
      address: '0x7fa4ee13f7dcb6bb0deea72f24bb5598ac3f30c5',
      symbol: 'USDT/THE',
      token0Address: '0x55d398326f99059fF775485246999027B3197955',
      token1Address: '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11',
      allowed0: true,
      allowed1: false,
      gaugeAddress: '0xa95186c80DF0438D4ECbF7DF3DA6b6153bA9b8d6',
      rewardAddress: '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11',
    },
    // ETH/THE (ETH)
    {
      address: '0x4fff5696f74c85fd617385842c58d3fb4b29654d',
      symbol: 'ETH/THE',
      token0Address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      token1Address: '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11',
      allowed0: true,
      allowed1: false,
      gaugeAddress: '0x2F92bcC2dA319262Ba4DDc46D883B23F7E121BB2',
      rewardAddress: '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11',
    },
    // USDC/THE (USDC)
    {
      address: '0xa84bd0fb53790cbc9db2c7e44933ed9cea8836ae',
      symbol: 'USDC/THE',
      token0Address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      token1Address: '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11',
      allowed0: true,
      allowed1: false,
      gaugeAddress: '0xCf2071cc2F8f53f611E528F7558CFcaB5e64541a',
      rewardAddress: '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11',
    },
    // BTCB/THE (BTCB)
    {
      address: '0x953d0f8cf816368dee0af1237c90716420c681c7',
      symbol: 'BTCB/THE',
      token0Address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
      token1Address: '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11',
      allowed0: true,
      allowed1: false,
      gaugeAddress: '0xe6519bab9DBd868Df05584C898Ef3c60fABC3b0C',
      rewardAddress: '0xF4C8E32EaDEC4BFe97E0F595AdD0f4450a863a11',
    },
  ],
  [ChainId.OPBNB]: [
    // BTCB/ETH (BTCB)
    {
      address: '0x546c9afd419cb7908b0f296b9eb8ae6d569c7410',
      symbol: 'BTCB/ETH',
      token0Address: '0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2',
      token1Address: '0xE7798f023fC62146e8Aa1b36Da45fb70855a77Ea',
      allowed0: true,
      allowed1: false,
      gaugeAddress: '0xBa07006D008c84c38b64FCD1693678094894aCEE',
      rewardAddress: '0x9d94a7ff461e83f161c8c040e78557e31d8cba72',
    },
    // ETH/BTCB (ETH)
    {
      address: '0x31a81a2a8e1df158b468049a878cd2425072033b',
      symbol: 'ETH/BTCB',
      token0Address: '0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2',
      token1Address: '0xE7798f023fC62146e8Aa1b36Da45fb70855a77Ea',
      allowed0: false,
      allowed1: true,
      gaugeAddress: '0xc8e249785A9022E5E4cCD8447F2F19F3Fb9579b8',
      rewardAddress: '0x9d94a7ff461e83f161c8c040e78557e31d8cba72',
    },
    // BNB/USDT (USDT)
    {
      address: '0x6ec985789d541024feef58d26602ed2ae0bf68cc',
      symbol: 'BNB/USDT',
      token0Address: '0x4200000000000000000000000000000000000006',
      token1Address: '0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3',
      allowed0: false,
      allowed1: true,
      gaugeAddress: '0x2A5052fb2a561c5abc547F0F194a5FC39575A661',
      rewardAddress: '0x9d94a7ff461e83f161c8c040e78557e31d8cba72',
    },
    // USDT/ETH (USDT)
    {
      address: '0x27681cb9c7c834e7e55c009a2760f5121e61edbd',
      symbol: 'ETH/USDT',
      token0Address: '0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3',
      token1Address: '0xE7798f023fC62146e8Aa1b36Da45fb70855a77Ea',
      allowed0: true,
      allowed1: false,
      gaugeAddress: '0xd87a62559659301f39d197709407281bE7b3a15E',
      rewardAddress: '0x9d94a7ff461e83f161c8c040e78557e31d8cba72',
    },
    // BNB/ETH (BNB)
    {
      address: '0x09efc1a1837e835c21a73ea8ef7d7330c5bc8692',
      symbol: 'BNB/ETH',
      token0Address: '0x4200000000000000000000000000000000000006',
      token1Address: '0xE7798f023fC62146e8Aa1b36Da45fb70855a77Ea',
      allowed0: true,
      allowed1: false,
      gaugeAddress: '0xeC7Ef2340cA18D268C3F564af2F24587F7D399Ba',
      rewardAddress: '0x9d94a7ff461e83f161c8c040e78557e31d8cba72',
    },
    // // BTCB/USDT (BTCB)
    // {
    //   address: '0x9d8aeb354712e9fc28ff052ef7fc951ee4620347',
    //   symbol: 'BTCB/USDT',
    //   token0Address: '0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2',
    //   token1Address: '0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3',
    //   allowed0: true,
    //   allowed1: false,
    //   gaugeAddress: '0x5E80A94307b1C9C30ee9271E7b4885257fa5db59',
    //   depositToken: 'BTCB',
    // },
    // // ETH/USDT (ETH)
    // {
    //   address: '0xa2baca4cf3e9f2901d1be9bdee20a6f93fb34cb4',
    //   symbol: 'ETH/USDT',
    //   token0Address: '0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3',
    //   token1Address: '0xE7798f023fC62146e8Aa1b36Da45fb70855a77Ea',
    //   allowed0: false,
    //   allowed1: true,
    //   gaugeAddress: '0xB19513de923BB0E979BA272f9d334B258E9680e1',
    // },
    // // USDT/BTC (USDT)
    // {
    //   address: '0xfe8359ddfa56419528bd755debfadd0ff63bccfc',
    //   symbol: 'BTCB/USDT',
    //   token0Address: '0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2',
    //   token1Address: '0x9e5AAC1Ba1a2e6aEd6b32689DFcF62A509Ca96f3',
    //   allowed0: false,
    //   allowed1: true,
    //   gaugeAddress: '0xC2890fa1151005bd70Eb15E3D32192841022EE23',
    // },
  ],
}
