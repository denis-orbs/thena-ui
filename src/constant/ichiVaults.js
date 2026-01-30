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
      rewardAddress: '0x0EF4A107b48163ab4b57FCa36e1352151a587Be4',
      algebraV2Address: '0x51bd5e6d3da9064d59bcaa5a76776560ab42ceb8',
      algebraAddress: '0xc268ee337543a62115d46109d6771f1cf068063b',
      basePool: '0xc268ee337543a62115d46109d6771f1cf068063b',
      version: 2,
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
      rewardAddress: '0x0EF4A107b48163ab4b57FCa36e1352151a587Be4',
      algebraV2Address: '0x98a0004b8e9fe161369528a2e07de56c15a27d76',
      algebraAddress: '0xbe3040bda2de61949d3acec64fa9a86dd5130b7b',
      basePool: '0xbe3040bda2de61949d3acec64fa9a86dd5130b7b',
      version: 2,
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
      rewardAddress: '0x0EF4A107b48163ab4b57FCa36e1352151a587Be4',
      algebraV2Address: '0x752328a1e16d38933789860b8c09f6f2cc6c63d6',
      algebraAddress: '0x47f7394daf5ee223280b1258735b667a9600550c',
      basePool: '0x47f7394daf5ee223280b1258735b667a9600550c',
      version: 2,
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
      rewardAddress: '0x0EF4A107b48163ab4b57FCa36e1352151a587Be4',
      algebraV2Address: '0x7c0b5d39765b221810d477e8f02d47a9badf018a',
      algebraAddress: '0x6b8a95892af0a5c3b76bf06695a108fc994d7b8c',
      basePool: '0x6b8a95892af0a5c3b76bf06695a108fc994d7b8c',
      version: 2,
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
      rewardAddress: '0x0EF4A107b48163ab4b57FCa36e1352151a587Be4',
      algebraV2Address: '0x246505db95e5a60d8524d52b9ed3dbaf6ee2584f',
      algebraAddress: '0x1fe8e7738944fae5b20ec185cac114c7895b36e8',
      basePool: '0x1fe8e7738944fae5b20ec185cac114c7895b36e8',
      version: 2,
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
      algebraAddress: '0xa7e84de1f48743143223ba17153ea88732490cd2',
      basePool: '0xa7e84de1f48743143223ba17153ea88732490cd2',
      version: 2,
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
      algebraAddress: '0xa7e84de1f48743143223ba17153ea88732490cd2',
      basePool: '0xa7e84de1f48743143223ba17153ea88732490cd2',
      version: 2,
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
      algebraAddress: '0xdc83c475dab357b6c3cd66e1a16cfdab08992560',
      basePool: '0xdc83c475dab357b6c3cd66e1a16cfdab08992560',
      version: 2,
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
      algebraAddress: '0x2c8d50474decffbae19cb2af02d646897b2b869c',
      basePool: '0x2c8d50474decffbae19cb2af02d646897b2b869c',
      version: 2,
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
      algebraAddress: '0x55ce9b92f2d0a842e639c354d72f2e85c5382e5f',
      basePool: '0x55ce9b92f2d0a842e639c354d72f2e85c5382e5f',
      version: 2,
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

// Hardcoded farming contract addresses for Ichi V3 farming pools
// The vault contract's farmingContract will be set to 0, so we use this mapping instead
export const FARM_CONFIG = [
  {
    symbol: 'IV-THE_V3_RW-0-ETH-WBNB',
    pool: '0xdaDAdc327c2CD434E65913c11e81a98CF9c9FC95',
    farming: '0xb6F3C6770aB81f7F7e4E8794d391EF4A3fa1533a',
  },
  {
    symbol: 'IV-THE_V3_RW-1-WBNB-ETH',
    pool: '0xf20a62ED4541a0360975D391761ADf15EC4b3453',
    farming: '0xB75634f63c8876Ca04961E8425d0353dd82c4ff3',
  },
  {
    symbol: 'IV-THE_V3_RW-2-BTCB-WBNB',
    pool: '0x756B21617f3782289089991a9A6b6F4c5A455d68',
    farming: '0x70d6880717968107370593b47C40C9435F90fd1A',
  },
  {
    symbol: 'IV-THE_V3_RW-3-WBNB-BTCB',
    pool: '0x3929E5B7D447ed243Ee2655Dfbd1ed9F24F1aC56',
    farming: '0x2e01Ba342d8a7168adc5C9fd9DabC581B355f6dE',
  },
  {
    symbol: 'IV-THE_V3_RW-4-WBNB-THE',
    pool: '0xEddD271ccf0BCeDDC8C720e878d36F2F4824c8c0',
    farming: '0x3F892Da13b928C33215D2fCFdD680c59ec53d15E',
  },
  {
    symbol: 'IV-THE_V3_RW-5-SOL-WBNB',
    pool: '0x75c4235bFF0e0631d77De05941055a28002256e9',
    farming: '0xe0d9Fd089AC910B733db514D91fe189e5e288760',
  },
  {
    symbol: 'IV-THE_V3_RW-6-WBNB-SOL',
    pool: '0x048FAaec8c31E0910dAcB4a6Ff4fdD501CbdB125',
    farming: '0xa8D1E811aF96aae39777691Ef36801Cc4F6a504E',
  },
  {
    symbol: 'IV-THE_V3_RW-7-FIL-WBNB',
    pool: '0xEF5ab86C303302D7DCe9C7226E18D55Ad029cDa9',
    farming: '0x4d82E9B8557Eb100fa2150842e4673820C738A66',
  },
  {
    symbol: 'IV-THE_V3_RW-8-WBNB-FIL',
    pool: '0xBC0c25B48B2c75672b88bB6668FA5D5894647Ac8',
    farming: '0x5Cf32aA07004c9360E0292904A1db6a15fC4647A',
  },
  {
    symbol: 'IV-THE_V3_RW-9-ETH-USDT',
    pool: '0x4aB48D934a8cfF2e557f8bf7EA7e54419504C0B2',
    farming: '0x733742B1A1d93cD77DB3CCB751A3822c011D8958',
  },
  {
    symbol: 'IV-THE_V3_RW-10-USDT-ETH',
    pool: '0xa8c3bF3E437248C5968c45091047D7d9e7d5BF10',
    farming: '0x7ad238debFf6595786a83AbBAC1c2ef09c1062C4',
  },
  {
    symbol: 'IV-THE_V3_RW-11-USDT-WBNB',
    pool: '0xAcf0fF327b36b2e45DcA3567E1669a43bC973ed7',
    farming: '0x4a5d31b7c98CF4b1Dff63741233047FC6744Cb7b',
  },
  {
    symbol: 'IV-THE_V3_RW-12-WBNB-USDT',
    pool: '0x2B3cf44cd82E4475aeC06f4051Ae4a3ddD16BE24',
    farming: '0xc791C9985Fe04E9Dafe2a1893A869e3630A4F389',
  },
  {
    symbol: 'IV-THE_V3_RW-13-DOGE-WBNB',
    pool: '0x9A050BFd44C3D15D336c1a286A26dA01Ad1772E7',
    farming: '0x2A230E768CefA7E605d0b2b224a65e20c8615C0b',
  },
  {
    symbol: 'IV-THE_V3_RW-14-WBNB-DOGE',
    pool: '0xDd29B440713C3AEA3204E6259E92c1c58d551aA0',
    farming: '0x1434da63ebE8E4D4700D7C32ea813E509Da377ca',
  },
  {
    symbol: 'IV-THE_V3_RW-15-USDT-THE',
    pool: '0xA2EbD5d2FD39546782d9c98E63F799DCFF9874F8',
    farming: '0xCf7BFa8e04901273b6201Ed86c190045c258fe19',
  },
  {
    symbol: 'IV-THE_V3_RW-16-HBR-USDT',
    pool: '0x9C47E919a628612ba3F1889a97f8c35a23003079',
    farming: '0x2Cd5f6F50Ed045715DbfC9c3DF8F385E0583F978',
  },
  {
    symbol: 'IV-THE_V3_RW-17-Cake-mCake',
    pool: '0x8E291f0653446481AF22A158DAa8FF77E4F5e42C',
    farming: '0x01cf499d9c055c1Be6Af45c3eb2fb5976E697Ee6',
  },
  {
    symbol: 'IV-THE_V3_RW-18-USDT-XCAD',
    pool: '0xCbF8A017A88E0AeF1E12D1bb21220d66440dB1B7',
    farming: '0x0B8E7FF9089aE6ed3C04aF4D1B31530145d8A1bE',
  },
  {
    symbol: 'IV-THE_V3_RW-19-mPendle-PENDLE',
    pool: '0xdA183965BCE824F7adBbf14B381fA2060B1020F7',
    farming: '0xCFbE7806d654de76e40Aa99B5bd588479394f170',
  },
  {
    symbol: 'IV-THE_V3_RW-20-PENDLE-mPendle',
    pool: '0x86FaDA04f005467bC9abce7Fb28c2F635691B308',
    farming: '0xaf947A095BAc36010953B4B393caED14256f4DFd',
  },
  {
    symbol: 'IV-THE_V3_RW-21-ETH-THE',
    pool: '0x646Ecd3CAe8c9F02Ae2eA93305f8B574a2c6eE04',
    farming: '0xb497EB396E03278489c155083D2271b737332a03',
  },
  {
    symbol: 'IV-THE_V3_RW-22-BTCB-THE',
    pool: '0x8833E5Db9CCb6DC5d3C394E5b0166883F0a222AC',
    farming: '0xee9058515e692d2a3a80b80524aEAb7D2f7fd480',
  },
  {
    symbol: 'IV-THE_V3_RW-23-USDC-THE',
    pool: '0x9B465EaF72891e81b4A3F1D407E30418E1dD403A',
    farming: '0x9Cf345554Ca79Bd621e597b91A4274919aF13259',
  },
  {
    symbol: 'IV-THE_V3_RW-24-ADA-WBNB',
    pool: '0xd5775439d9f5d2de77E472939AB4B758a635f601',
    farming: '0x6225D53E8725f560652afd955d858517eDcA0F3B',
  },
  {
    symbol: 'IV-THE_V3_RW-25-WBNB-ADA',
    pool: '0x58d18070bC0cAeB7bb298DBE8045F0bfC6588477',
    farming: '0x8cDa3179f3A694DD06873BEd550535E95Ac349cf',
  },
]

// New Ichi strategies
// ICHI back in after the migration
/**
 *  Pool: ICHIVault
 *  OldPool: ICHIVault old
 *  Farming: MultiFeeDistribution
 *  OldFarming: MultiFeeDistribution old
 */
export const NEW_ICHI_STRATEGIES = [
  {
    symbol: 'WBNB-ETH',
    pool: '0xb9bC3711e4d3807FAB47dc6EA32C15b8033B9A32',
    oldPool: '0xf20a62ED4541a0360975D391761ADf15EC4b3453',
    farming: '0x23719Be99bf557fda864DA9B893cc9EDd5eb14e0',
    oldFarming: '0xB75634f63c8876Ca04961E8425d0353dd82c4ff3',
  },
  {
    symbol: 'ETH-BNB',
    pool: '0xccDd139adcfC5077531A595a1c1b441304f2919D',
    oldPool: '0xdaDAdc327c2CD434E65913c11e81a98CF9c9FC95',
    farming: '0x7e6b7621d76C8719e3F054017047678B16197D91',
    oldFarming: '0xb6F3C6770aB81f7F7e4E8794d391EF4A3fa1533a',
  },
  {
    symbol: 'BTCB-BNB',
    pool: '0xAb03c538DFF311139BB0E65866636d1f8fE5B36d',
    oldPool: '0x756B21617f3782289089991a9A6b6F4c5A455d68',
    farming: '0xca9223AfEce64aB589fa0848Fb81E141D50A4626',
    oldFarming: '0x70d6880717968107370593b47C40C9435F90fd1A',
  },
  {
    symbol: 'BNB-BTCB',
    pool: '0x73C880022A1D1acAB963b79C8d1DcCBe8848eeE9',
    oldPool: '0x3929E5B7D447ed243Ee2655Dfbd1ed9F24F1aC56',
    farming: '0xAf1163C96E0560d939F6b7809723da5077D024d5',
    oldFarming: '0x2e01Ba342d8a7168adc5C9fd9DabC581B355f6dE',
  },
  {
    symbol: 'BNB-SOL',
    pool: '0xaEBc5C3C1709D68cf64CaC25b6e57edB39d5EEf7',
    oldPool: '0x048FAaec8c31E0910dAcB4a6Ff4fdD501CbdB125',
    farming: '0xA542A3e5dda05770aA161656C37396f4eba16230',
    oldFarming: '0xa8D1E811aF96aae39777691Ef36801Cc4F6a504E',
  },
  {
    symbol: 'BNB-THE',
    pool: '0x1Fcb4a7E271c1dD8D6a33953F99fc142Bf06a392',
    oldPool: '0xEddD271ccf0BCeDDC8C720e878d36F2F4824c8c0',
    farming: '0xf77a0b4e63845C6582d0d847BC5B01A3025DCbFa',
    oldFarming: '0x3F892Da13b928C33215D2fCFdD680c59ec53d15E',
  },
  {
    symbol: 'BNB-DOGE',
    pool: '0x9d35f277C7783f39A0Bf95894D70b84356b2C38A',
    oldPool: '0xDd29B440713C3AEA3204E6259E92c1c58d551aA0',
    farming: '0xdBbC61C79925992B4f5FbCdED2bC96b45DE396BD',
    oldFarming: '0x1434da63ebE8E4D4700D7C32ea813E509Da377ca',
  },
  {
    symbol: 'USDT-ETH',
    pool: '0x3840b22C6b1bbad4ffbB1b790a1c5301cE3F05B3',
    oldPool: '0xa8c3bF3E437248C5968c45091047D7d9e7d5BF10',
    farming: '0x700c0d77Df0F2b9F025Fdf9973df89eb115a4a38',
    oldFarming: '0x7ad238debFf6595786a83AbBAC1c2ef09c1062C4',
  },
  {
    symbol: 'BNB-USDT',
    pool: '0x0e20AC1161c7282A11e609Da7384b82D30b0C005',
    oldPool: '0x2B3cf44cd82E4475aeC06f4051Ae4a3ddD16BE24',
    farming: '0xf76912d33B14cA8dCe290B629A873cDF3CD167E0',
    oldFarming: '0xc791C9985Fe04E9Dafe2a1893A869e3630A4F389',
  },
  {
    symbol: 'FIL-BNB',
    pool: '0x91e6e2856616725B0F4a8b00bb6a34bEdc6D6129',
    oldPool: '0xEF5ab86C303302D7DCe9C7226E18D55Ad029cDa9',
    farming: '0x49ce1676e66aC938535D801ACcF863863634720F',
    oldFarming: '0x4d82E9B8557Eb100fa2150842e4673820C738A66',
  },
  {
    symbol: 'BNB-FIL',
    pool: '0x2D044624843a7497CB908775faC4C5B474A8423A',
    oldPool: '0xBC0c25B48B2c75672b88bB6668FA5D5894647Ac8',
    farming: '0xE5fe60Ee6aa027960526bC2Ce9cabae3358cdf85',
    oldFarming: '0x5Cf32aA07004c9360E0292904A1db6a15fC4647A',
  },
]
