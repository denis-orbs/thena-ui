import { ChainId } from 'thena-sdk-core'

import {
  bribeAbi,
  claimerAbi,
  dibsAbi,
  dibsLotteryAbi,
  dibsRewarderAbi,
  ERC20Abi,
  farmCenterAbi,
  gaugeAbi,
  globalFactoryAbi,
  incentiveMakerAbi,
  minterAbi,
  mockERC20Abi,
  mockERC20BNBAbi,
  multiCallAbi,
  multiFeeDistributionAbi,
  muonAbi,
  pairAbi,
  rewardsAPIAbi,
  routerAbi,
  royaltyAbi,
  stakingAbi,
  ThenianAbi,
  veDistAbi,
  veTHEAbi,
  veTHEApiAbi,
  voterAbi,
  voterTestNetAbi,
  wbnbAbi,
  weightedGaugeAbi,
  weightedPoolAbi,
  weightedPoolFactoryAbi,
  weightedPoolFeesAbi,
  weightedPoolRouterAbi,
  weightedPoolRouterSimulatorAbi,
  weightedPoolVaultAbi,
} from '@/constant/abi'
import {
  multiAccountAbi,
  oldTcSpotAbi,
  tcManagerAbi,
  tcPerpetualAbi,
  tcPerpetualManagerAbi,
  tcPerpRewarderAbi,
  tcSpotAbi,
  thenaIdAbi,
} from '@/constant/abi/core'
import {
  algebraAbiV2,
  defiedgeStrategyAbi,
  fusionQuoterAbi,
  fusionRouterAbi,
  gammaClearingAbi,
  gammaHypervisorAbi,
  gammaHypervisorAbiV3,
  gammaUniProxyAbi,
  gaugeSimpleAbi,
  ichiVaultAbi,
  vaultDepositGaurdAbi,
} from '@/constant/abi/fusion'
import Contracts from '@/constant/contracts'
import { algebraFactoryMainNetV2Abi } from '@/constant/v2-mainnet-abi'
import { algebraFactoryTestNetV2Abi } from '@/constant/v2-testnet-abi'
import { algebraFactoryV3Abi, nonfungiblePositionManagerV3Abi } from '@/constant/v3-abi'

export const getContract = (abi, addressOrAddressMap, chainId) => {
  if (!addressOrAddressMap || !abi || !chainId) return null
  let address
  if (typeof addressOrAddressMap === 'string') address = addressOrAddressMap
  else address = addressOrAddressMap[chainId]
  if (!address) return null
  return { address, abi }
}

/** **************************************************************************************************
                                            Common
  ************************************************************************************************** */

export const getERC20Contract = (address, chainId) =>
  getContract(chainId !== 97 ? ERC20Abi : mockERC20Abi, address, chainId)

export const getTheContract = chainId => getContract(chainId !== 97 ? ERC20Abi : mockERC20Abi, Contracts.THE, chainId)

export const getWBNBContract = chainId =>
  getContract(chainId !== 97 ? wbnbAbi : mockERC20BNBAbi, Contracts.WBNB, chainId)

export const getMulticallContract = chainId => getContract(multiCallAbi, Contracts.multiCall, chainId)

export const getGaugeSimpleContract = (address, chainId) => getContract(gaugeSimpleAbi, address, chainId)

/** **************************************************************************************************
                                            Solidly
  ************************************************************************************************** */

export const getRouterContract = chainId => getContract(routerAbi, Contracts.solidlyRouter, chainId)

export const getVeTHEContract = chainId => getContract(veTHEAbi, Contracts.veTHE, chainId)

export const getVeDistContract = chainId => getContract(veDistAbi, Contracts.veDist, chainId)

export const getMinterContract = () => getContract(minterAbi, Contracts.minter, ChainId.BSC)

export const getVoterContract = chainId =>
  getContract(chainId !== 97 ? voterAbi : voterTestNetAbi, Contracts.voter, chainId)

export const getGaugeContract = (address, chainId) => getContract(gaugeAbi, address, chainId)

export const getBribeContract = (address, chainId) => getContract(bribeAbi, address, chainId)

export const getPairContract = (address, chainId) => getContract(pairAbi, address, chainId)

export const getGlobalFactoryContract = chainId => getContract(globalFactoryAbi, Contracts.globalFactory, chainId)

/** **************************************************************************************************
                                            API contracts
 ************************************************************************************************** */

export const getVeTHEAPIContract = chainId => getContract(veTHEApiAbi, Contracts.veTHEAPI, chainId)

export const getRewardsAPIContract = chainId => getContract(rewardsAPIAbi, Contracts.rewardsAPI, chainId)

/** **************************************************************************************************
                                          theNFT (THENIANs)
 ************************************************************************************************** */
export const getTheNftContract = () => getContract(ThenianAbi, Contracts.theNFT, ChainId.BSC)

export const getNftStakingContract = () => getContract(stakingAbi, Contracts.nftStaking, ChainId.BSC)

export const getRoyaltyContract = () => getContract(royaltyAbi, Contracts.royalty, ChainId.BSC)

/** **************************************************************************************************
                                          DIBS
 ************************************************************************************************** */
export const getDibsContract = () => getContract(dibsAbi, Contracts.dibs, ChainId.BSC)

export const getDibsLotteryContract = () => getContract(dibsLotteryAbi, Contracts.dibsLottery, ChainId.BSC)

export const getMuonContract = () => getContract(muonAbi, Contracts.muon, ChainId.BSC)

/** **************************************************************************************************
                                          FUSION (Algebra)
 ************************************************************************************************** */

export const getAlgebraNPMContract = chainId =>
  getContract(algebraAbiV2, Contracts.nonfungiblePositionManagerV2, chainId)

export const getFusionRouterContract = chainId => getContract(fusionRouterAbi, Contracts.fusionRouter, chainId)

export const getFusionQuoterContract = chainId => getContract(fusionQuoterAbi, Contracts.fusionQuoter, chainId)

/** **************************************************************************************************
                                            Gamma
 ************************************************************************************************** */

export const getGammaUNIProxyContract = (chainId, version = 3) => {
  if (version === 3) {
    return getContract(gammaUniProxyAbi, Contracts.gammaUniProxyV3, chainId)
  }

  return getContract(gammaUniProxyAbi, Contracts.gammaUniProxy, chainId)
}

export const getMultiFeeDistributionContract = (address, chainId) =>
  getContract(multiFeeDistributionAbi, address, chainId)

export const getGammaClearingContract = (address, chainId) => getContract(gammaClearingAbi, address, chainId)

export const getGammaHyperVisorContract = (address, chainId, version) => {
  if (version === 3) {
    return getContract(gammaHypervisorAbiV3, address, chainId)
  }

  return getContract(gammaHypervisorAbi, address, chainId)
}

/** **************************************************************************************************
                                            Defiedge
  ************************************************************************************************** */

export const getDefiedgeStrategyContract = (address, chainId) => getContract(defiedgeStrategyAbi, address, chainId)

/** **************************************************************************************************
                                            ICHI
  ************************************************************************************************** */

export const getVaultDepositContract = chainId =>
  getContract(vaultDepositGaurdAbi, Contracts.vaultDepositGuard, chainId)

export const getIchiVaultContract = (address, chainId) => getContract(ichiVaultAbi, address, chainId)

/** **************************************************************************************************
                                            TC (Trading Competition)
  ************************************************************************************************** */

export const getTCContract = () => getContract(tcManagerAbi, Contracts.tcManager, ChainId.BSC)

export const getTCPerpetualManagerContract = () =>
  getContract(tcPerpetualManagerAbi, Contracts.tcPerpetualManager, ChainId.BSC)

export const getTcSpotContract = address => getContract(tcSpotAbi, address, ChainId.BSC)
export const getOldTcSpotContract = address => getContract(oldTcSpotAbi, address, ChainId.BSC)

export const getTcPerpetualContract = address => getContract(tcPerpetualAbi, address, ChainId.BSC)

/** **************************************************************************************************
                                            Thena ID
  ************************************************************************************************** */

export const getThenaIDContract = () => getContract(thenaIdAbi, Contracts.thenaId, ChainId.BSC)
/** **************************************************************************************************
                                            DibsRewarder
  ************************************************************************************************** */

export const getDibsRewarderContract = chainId => getContract(dibsRewarderAbi, Contracts.dibsRewarder, chainId)

export const getMultiAccountContract = () => getContract(multiAccountAbi, Contracts.multiAccount, ChainId.BSC)

export const getTCPerpRewarderContract = () => getContract(tcPerpRewarderAbi, Contracts.tcPerpRewarder, ChainId.BSC)

/** ******************************************************************************************************
                                          VotingEscrow
******************************************************************************************************* */
// export const getVotingEScrowContract = () => getContract(votingEscrowAbi, Contracts.votingEscrow, 97)
// export const getVotingEScrowContract = () => getContract(votingEscrowAbi, Contracts.votingEscrow, 97)

/** ******************************************************************************************************
                                          Claimer
******************************************************************************************************* */
export const getClaimerContract = chainId => getContract(claimerAbi, Contracts.claimer, chainId)

/** ******************************************************************************************************
                                          ALGEBRA_POOL_DEPLOYER_TESTNET
******************************************************************************************************* */
// export const getAlgebraPoolDeployerContract = () =>
//   getContract(algebraPoolDeployerAbi, Contracts.ALGEBRA_POOL_DEPLOYER_TESTNET, 97)
// export const getAlgebraPoolDeployerContract = () =>
//   getContract(algebraPoolDeployerAbi, Contracts.ALGEBRA_POOL_DEPLOYER_TESTNET, 97)

/** ******************************************************************************************************
                                          ALGEBRA_FACTORY_TESTNET
******************************************************************************************************* */
export const getAlgebraFactoryContract = (chainId = 56, version = 3) => {
  if (version === 3) {
    return getContract(algebraFactoryV3Abi, Contracts.algebraFactoryV3, chainId)
  }

  return getContract(
    chainId === 97 ? algebraFactoryTestNetV2Abi : algebraFactoryMainNetV2Abi,
    Contracts.algebraFactoryV2,
    chainId,
  )
}

/** ******************************************************************************************************
                                          ALGEBRA_COMMUNITY_VAULT_TESTNET
******************************************************************************************************* */
// export const getAlgebraCommunityVaultContract = () =>
//   getContract(algebraCommunityVaultAbi, Contracts.ALGEBRA_COMMUNITY_VAULT_TESTNET, 97)
// export const getAlgebraCommunityVaultContract = () =>
//   getContract(algebraCommunityVaultAbi, Contracts.ALGEBRA_COMMUNITY_VAULT_TESTNET, 97)

/** ******************************************************************************************************
                                          ALGEBRA_VAULT_FACTORY_STUB_TESTNET
******************************************************************************************************* */
// export const getAlgebraVaultFactoryStubContract = () =>
//   getContract(algebraVaultFactoryStubAbi, Contracts.ALGEBRA_VAULT_FACTORY_STUB_TESTNET, 97)
// export const getAlgebraVaultFactoryStubContract = () =>
//   getContract(algebraVaultFactoryStubAbi, Contracts.ALGEBRA_VAULT_FACTORY_STUB_TESTNET, 97)

/** ******************************************************************************************************

/** ******************************************************************************************************
                                          QUOTER_TESTNET
******************************************************************************************************* */
// export const getQuoterContract = () => getContract(quoterAbi, Contracts.QUOTER_TESTNET, 97)
// export const getQuoterContract = () => getContract(quoterAbi, Contracts.QUOTER_TESTNET, 97)

/** ******************************************************************************************************
                                          QUOTER_V2_TESTNET
******************************************************************************************************* */
// export const getQuoterV2Contract = () => getContract(quoterV2Abi, Contracts.QUOTER_V2_TESTNET, 97)
// export const getQuoterV2Contract = () => getContract(quoterV2Abi, Contracts.QUOTER_V2_TESTNET, 97)

/** ******************************************************************************************************
                                          QUOTER_V2_TESTNET
******************************************************************************************************* */
// export const getSwapRouterContract = () => getContract(swapRouterAbi, Contracts.SWAP_ROUTER_TESTNET, 97)
// export const getSwapRouterContract = () => getContract(swapRouterAbi, Contracts.SWAP_ROUTER_TESTNET, 97)

/** ******************************************************************************************************
                                          NONFUNGIBLE_POSITION_MANAGER_TESTNET
******************************************************************************************************* */

export const getPositionManagerContract = (chainId = 56, version = 3) => {
  const addressMap = version === 3 ? Contracts.nonfungiblePositionManagerV3 : Contracts.nonfungiblePositionManagerV2

  return {
    abi: nonfungiblePositionManagerV3Abi,
    address: addressMap[chainId],
  }
}

export const getFarmingCenterContract = chainId => ({
  abi: farmCenterAbi,
  address: Contracts.farmingCenter[chainId],
})

export const getInsentiveContract = chainId => ({
  abi: incentiveMakerAbi,
  address: Contracts.incentiveMaker[chainId],
})

// export const getNonfungiblePositionManagerContractV2 = chainId =>
//   getContract(nonfungiblePositionManagerAbi, Contracts.nonfungiblePositionManagerV2, chainId)
// export const getNonfungiblePositionManagerContractV3 = chainId => ({
//   // getContract(nonfungiblePositionManagerV3Abi, Contracts.nonfungiblePositionManagerV3, chainId)
//   abi: nonfungiblePositionManagerV3Abi,
//   address: Contracts.nonfungiblePositionManagerV3[chainId],
// })

/** ******************************************************************************************************
                                          ALGEBRA_INTERFACE_MULTICALL_TESTNET
******************************************************************************************************* */
// export const getAlgebraInterfaceMultiCallContract = () =>
//   getContract(algebraInterfaceMultiCallAbi, Contracts.ALGEBRA_INTERFACE_MULTICALL_TESTNET, 97)
// export const getAlgebraInterfaceMultiCallContract = () =>
//   getContract(algebraInterfaceMultiCallAbi, Contracts.ALGEBRA_INTERFACE_MULTICALL_TESTNET, 97)

/** ******************************************************************************************************
                                          ALGEBRA_ETERNAL_FARMING_TESTNET
******************************************************************************************************* */
// export const getAlgebraEternalFarmingContract = () =>
//   getContract(algebraEternalFarmingAbi, Contracts.ALGEBRA_ETERNAL_FARMING_TESTNET, 97)
// export const getAlgebraEternalFarmingContract = () =>
//   getContract(algebraEternalFarmingAbi, Contracts.ALGEBRA_ETERNAL_FARMING_TESTNET, 97)

/** ******************************************************************************************************
                                          FARMING_CENTER_TESTNET
******************************************************************************************************* */
// export const getFarmingCenterContract = () => getContract(farmingCenterAbi, Contracts.FARMING_CENTER_TESTNET, 97)
// export const getFarmingCenterContract = () => getContract(farmingCenterAbi, Contracts.FARMING_CENTER_TESTNET, 97)

/** ******************************************************************************************************
                                          Weighted Pool
******************************************************************************************************* */
export const getWeightedPoolFactoryContract = chainId =>
  getContract(weightedPoolFactoryAbi, Contracts.weightedPoolFactory, chainId)

export const getWeightedPoolContract = (address, chainId) => getContract(weightedPoolAbi, address, chainId)

export const getWeightedPoolVaultContract = chainId =>
  getContract(weightedPoolVaultAbi, Contracts.weightedPoolVault, chainId)

export const getWeightedPoolRouterContract = chainId =>
  getContract(weightedPoolRouterAbi, Contracts.weightedPoolRouter, chainId)
export const getWeightedPoolRouterSimulatorContract = chainId =>
  getContract(weightedPoolRouterSimulatorAbi, Contracts.weightedPoolRouterSimulator, chainId)

export const getWeightedPoolFeesContract = (address, chainId) => getContract(weightedPoolFeesAbi, address, chainId)

export const getWeightedGaugeContract = (address, chainId) => getContract(weightedGaugeAbi, address, chainId)
