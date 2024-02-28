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
  },
  WBNB: {
    [ChainId.BSC]: WBNB[ChainId.BSC].address,
    [ChainId.OPBNB]: WBNB[ChainId.OPBNB].address,
  },
  theNFT: '0x2Af749593978CB79Ed11B9959cD82FD128BA4f8d',
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
  },
  minter: {
    [ChainId.BSC]: '0x86069FEb223EE303085a1A505892c9D4BdBEE996',
  },
  pairAPI: {
    [ChainId.BSC]: '0x53a67b6b57907aa1926e95b004578a9bacb72e15',
    [ChainId.OPBNB]: '0xCB78f8d9DFb78CD43Bd2dC9Ffe75E39fBE7F2820',
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
    [ChainId.BSC]: '0xa3122E54E8CB38aa0707c35f0D4034560987cC55',
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
}
export default Contracts
