import {
  ChainId,
  FUSION_QUOTER_ADDRESSES,
  FUSION_ROUTER_ADDRESSES,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  V1_ROUTER_ADDRESSES,
  WBNB,
} from 'thena-sdk-core'

const Contracts = {
  THE: {
    [ChainId.BSC]: '0xf4c8e32eadec4bfe97e0f595add0f4450a863a11',
    [ChainId.OPBNB]: '0x9d94a7ff461e83f161c8c040e78557e31d8cba72',
    97: '0x853d42B6b9e0512926923d3710472e36578A5cD7',
  },
  WBNB: {
    [ChainId.BSC]: WBNB[ChainId.BSC].address,
    [ChainId.OPBNB]: WBNB[ChainId.OPBNB].address,
    97: '0xeC7Ef2340cA18D268C3F564af2F24587F7D399Ba',
  },
  theNFT: '0x0C6e178271558571F54077cd32E97a1579119aC4',
  multiCall: {
    [ChainId.BSC]: '0xfF6FD90A470Aaa0c1B8A54681746b07AcdFedc9B',
    [ChainId.OPBNB]: '0xD6f6e27e96535749587Ac77bfc83607A743e765f',
  },
  solidlyRouter: V1_ROUTER_ADDRESSES,
  factory: {
    [ChainId.BSC]: '0xAFD89d21BdB66d00817d4153E055830B1c2B3970',
  },
  veTHE: {
    [ChainId.BSC]: '0xfBBF371C9B0B994EebFcC977CEf603F7f31c070D',
  },
  veDist: {
    [ChainId.BSC]: '0xA6e0e731Cb1E99AedE0f9C9128d04F948E18727D',
  },
  voter: {
    [ChainId.BSC]: '0x3A1D0952809F4948d15EBCe8d345962A282C4fCb',
    97: '0x2e974a81F68eAFA2A197A3A6eb6e75949504524E',
  },
  minter: {
    [ChainId.BSC]: '0x86069FEb223EE303085a1A505892c9D4BdBEE996',
    97: '0x880a58766cd15139bA816a57197f7393D97D6628',
  },
  pairAPI: {
    [ChainId.BSC]: '0x53a67b6b57907aa1926e95b004578a9bacb72e15',
    [ChainId.OPBNB]: '0xCB78f8d9DFb78CD43Bd2dC9Ffe75E39fBE7F2820',
    97: '0x999b56e95feE66Afb14f535D0cB55fb6bDde3FE3',
  },
  veTHEAPI: {
    [ChainId.BSC]: '0xf13b61c40F7B2eEB43bFBb05c2a5c6867D99C84d',
  },
  rewardsAPI: {
    [ChainId.BSC]: '0xDb65C1C922632B8B62134d49785316818ade413c',
  },
  staking: {
    [ChainId.BSC]: '0xe58E64fb76e3C3246C34Ee596fB8Da300b5Adfbb',
  },
  nftStaking: {
    [ChainId.BSC]: '0x11746fd90091228a97974435d6bE5E10BDA92f7C',
  },
  royalty: {
    [ChainId.BSC]: '0xBB2caf56BF29379e329dFED453cbe60E4d913882',
  },
  dibs: {
    [ChainId.BSC]: '0x664cE330511653cB2744b8eD50DbA31C6c4C08ca',
  },
  dibsLottery: {
    [ChainId.BSC]: '0x287ed50e4c158dac38e1b7e16c50cd1b2551a300',
  },
  muon: {
    [ChainId.BSC]: '0xBa079Ad36E48e75b8b37f17aF1Fc285bceB84391',
  },
  openOcean: {
    [ChainId.BSC]: '0x6352a56caadc4f1e25cd6c75970fa768a3304e64',
  },
  odos: {
    [ChainId.BSC]: '0x89b8AA89FDd0507a99d334CBe3C808fAFC7d850E',
  },
  tcManager: {
    [ChainId.BSC]: '0x8D03FeBF03cD8E6F2388e587A6a1263360f639ec',
  },
  tcPerpetualManager: {
    [ChainId.BSC]: '0xc90992b9aE19ec04b9AA9878A510c2ae3203aEe7',
  },
  fusionRouter: FUSION_ROUTER_ADDRESSES,
  fusionQuoter: FUSION_QUOTER_ADDRESSES,
  nonfungiblePositionManager: NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  gammaUniProxy: {
    [ChainId.BSC]: '0xF75c017E3b023a593505e281b565ED35Cc120efa',
  },
  vaultDepositGuard: {
    [ChainId.BSC]: '0xd9272a45BbF488816C6A5351894bCE7b04a66eE1',
    [ChainId.OPBNB]: '0x7C6389714719C68cAAc8Ae06baE6E878B3605f6D',
  },
  vaultDeployer: {
    [ChainId.BSC]: '0x05cC3CA6E768a68A7f86b09e3ceE754437bd5f12',
    [ChainId.OPBNB]: '0xAAC397840fC57F6bE1e3d40496E0823Ff15e1C6D',
  },
  thenaId: {
    [ChainId.BSC]: '0xd8cd3f2e2c97d85bcd5bd47ff3f67ed0060f5b14',
  },
  dibsRewarder: {
    [ChainId.BSC]: '0x6e298908514c77c2dc1dc8faa150eef46ad7f03b',
  },
  multiAccount: {
    [ChainId.BSC]: '0x9a9f48888600fc9c05f11e03eab575ebb2fc2c8f',
  },
  tcPerpRewarder: {
    [ChainId.BSC]: '0xA2Bc09C290a260CDc6B63a5434ed81614A9624DE',
  },

  votingEscrow: '0xD9f2a8b8361121d1b2C3f705c99477e9F9526380',
  votingEscrowAttach: '0x0c04481fE0eBBb3655d51827EA0364272d73045b',
  claimer: '0x02308f4455CD6d2109092c7903D1ed843440e1F7',
  rewardsDistributor: '0xaD85026986D1c887BA715901A45239FEce88604c',
  gaugeFactory: '0x215f48C6a66aEaFC0C80a35b29223d62c59653aB',
  votingIncentivesFactory: '0xcBd12Cd9E9C09D67cF88B01447e1C1B3957A4318',
  globalFactory: '0xa4b9FD00b47F34385F52AfFc5d79822063F0334b',
  algebraFactory: '0xFBFB64eD1C70bb8d4c8bFCc338C10a5120809538',
  swapRouter: '0xc12f40f584A751C032e18f5757d3b7EE6fD74289',
  nonfungiblePosManager: '0xF1E919e24159b14aC32790dD4828B671E2158982',
  mockERC20Token: {
    USDT: '0x2A5052fb2a561c5abc547F0F194a5FC39575A661',
    BTC: '0x05D868e1e04f9F887C5607d59a81D66DCd3397DB',
    ETH: '0x8Fe83AFF545f583E0968ce3eDd05cD8E1F83b14E',
    WBNB: '0xeC7Ef2340cA18D268C3F564af2F24587F7D399Ba',
  },
  BTCUSDT: {
    Volatile: '0x1582e850eC2f5c42E177a4365eBe76ef8455fc94',
    CL: '0x123A7282EF46E7ea38A530D798452f64b0D3E1BF',
  },
}
export default Contracts
