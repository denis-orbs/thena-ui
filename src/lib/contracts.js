import { ChainId } from 'thena-sdk-core'

import {
  algebraFactoryAbi,
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
  keeperRegistryAbi,
  linkTokenAbi,
  minterAbi,
  multiCallAbi,
  multiFeeDistributionAbi,
  muonAbi,
  nonfungiblePositionManagerV2Abi,
  nonfungiblePositionManagerV3Abi,
  pairAbi,
  routerAbi,
  royaltyAbi,
  stakingAbi,
  testnetClaimerAbi,
  ThenianAbi,
  veDistAbi,
  veTHEAbi,
  veTheAutomationAbi,
  veTheAutomationFactoryAbi,
  voterAbi,
  voterV2Abi,
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
  defiedgeStrategyAbi,
  fusionQuoterAbi,
  fusionRouterAbi,
  gammaClearingAbi,
  gammaHypervisorAbi,
  gammaHypervisorAbiV3,
  gammaUniProxyAbi,
  gaugeSimpleAbi,
  ichiFarmingAbi,
  ichiVaultAbi,
  ichiVaultAbiV3,
  vaultDepositGaurdAbi,
} from '@/constant/abi/fusion'
import Contracts, { CHAIN_ID } from '@/constant/contracts'

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

export const getERC20Contract = (address, chainId) => getContract(ERC20Abi, address, chainId)

export const getTheContract = chainId => getContract(ERC20Abi, Contracts.THE, chainId)

export const getWBNBContract = chainId => getContract(wbnbAbi, Contracts.WBNB, chainId)

export const getMulticallContract = chainId => getContract(multiCallAbi, Contracts.multiCall, chainId)

export const getGaugeSimpleContract = (address, chainId) => getContract(gaugeSimpleAbi, address, chainId)

/** **************************************************************************************************
                                            Solidly
  ************************************************************************************************** */

export const getRouterContract = chainId => getContract(routerAbi, Contracts.solidlyRouter, chainId)

export const getVeTHEContract = chainId => getContract(veTHEAbi, Contracts.veTHE, chainId)

export const getVeDistContract = chainId => getContract(veDistAbi, Contracts.veDist, chainId)

export const getMinterContract = () => getContract(minterAbi, Contracts.minter, ChainId.BSC)

export const getVoterContract = (chainId, version = 3) => {
  if (version === 2) {
    return {
      address: '0x3A1D0952809F4948d15EBCe8d345962A282C4fCb',
      abi: voterV2Abi,
    }
  }
  return getContract(voterAbi, Contracts.voter, chainId)
}

export const getGaugeContract = (address, chainId) => getContract(gaugeAbi, address, chainId)

export const getBribeContract = (address, chainId) => getContract(bribeAbi, address, chainId)

export const getPairContract = (address, chainId) => getContract(pairAbi, address, chainId)

export const getGlobalFactoryContract = chainId => getContract(globalFactoryAbi, Contracts.globalFactory, chainId)

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

export const getFusionRouterContract = chainId => getContract(fusionRouterAbi, Contracts.fusionRouter, chainId)

export const getFusionQuoterContract = chainId => getContract(fusionQuoterAbi, Contracts.fusionQuoter, chainId)

/** **************************************************************************************************
                                            Gamma
 ************************************************************************************************** */

export const getGammaUNIProxyContract = ({ chainId, version = 3, isFarming = true }) => {
  if (version === 3) {
    const addressList = isFarming ? Contracts.gammaUniProxyFarmV3 : Contracts.gammaUniProxyFeeV3
    return {
      abi: gammaUniProxyAbi,
      address: addressList[chainId],
    }
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

export const getDefiedgeStrategyContract = (address, chainId) => getContract(defiedgeStrategyAbi, address, chainId)

/** **************************************************************************************************
                                            ICHI
*************************************************************************************************** */

export const getVaultDepositContract = (chainId, version = 2, isFarming = false) => {
  if (version === 3) {
    const address = isFarming
      ? Contracts.vaultDepositGuardV3Farming[chainId]
      : Contracts.vaultDepositGuardV3Fee[chainId]

    return {
      address,
      abi: vaultDepositGaurdAbi,
    }
  }

  return getContract(vaultDepositGaurdAbi, Contracts.vaultDepositGuard, chainId)
}
export const getIchiFarmingContract = (address, chainId) => getContract(ichiFarmingAbi, address, chainId)

export const getIchiVaultContract = (address, chainId, version = 2) => {
  if (version === 3) return getContract(ichiVaultAbiV3, address, chainId)
  return getContract(ichiVaultAbi, address, chainId)
}

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
                                          Claimer
******************************************************************************************************* */
export const getClaimerContract = chainId =>
  getContract(chainId === CHAIN_ID.TEST_BSC ? testnetClaimerAbi : claimerAbi, Contracts.claimer, chainId)

/** ******************************************************************************************************
                                          ALGEBRA_FACTORY
******************************************************************************************************* */
export const getAlgebraFactoryContract = (chainId = 56, version = 3) => {
  const address = version === 3 ? Contracts.algebraFactoryV3 : Contracts.algebraFactoryV2
  return getContract(algebraFactoryAbi, address, chainId)
}

/** ******************************************************************************************************
                                          NONFUNGIBLE_POSITION_MANAGER
******************************************************************************************************* */

export const getPositionManagerContract = (chainId = 56, version = 3) => {
  if (version === 2) {
    return getContract(nonfungiblePositionManagerV2Abi, Contracts.nonfungiblePositionManagerV2, chainId)
  }
  return getContract(nonfungiblePositionManagerV3Abi, Contracts.nonfungiblePositionManagerV3, chainId)
}

export const getFarmingCenterContract = chainId => ({
  abi: farmCenterAbi,
  address: Contracts.farmingCenter[chainId],
})

export const getIncentiveContract = chainId => ({
  abi: incentiveMakerAbi,
  address: Contracts.incentiveMaker[chainId],
})

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

/** ******************************************************************************************************
                                          veTHE Automation
******************************************************************************************************* */

export const getVeTheAutomationFactoryContract = chainId =>
  getContract(veTheAutomationFactoryAbi, Contracts.veTheAutomationFactory[chainId], chainId)

export const getVeTheAutomationContract = (address, chainId) => getContract(veTheAutomationAbi, address, chainId)

export const getLinkTokenContract = chainId => getContract(linkTokenAbi, Contracts.chainlinkToken[chainId], chainId)

export const getKeeperRegistryContract = chainId =>
  getContract(keeperRegistryAbi, Contracts.keeperRegistry[chainId], chainId)
