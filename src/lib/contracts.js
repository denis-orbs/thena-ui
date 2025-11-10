import { ChainId } from 'thena-sdk-core'

import {
  emergencyRouterAbi,
  ERC20Abi,
  GaugeABI,
  pairAbi,
  routerAbi,
  royaltyAbi,
  stakingAbi,
  ThenianAbi,
  veDistAbi,
  veTHEAbi,
  voterAbi,
  voterV2Abi,
  votingIncentivesAbi,
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
import { FarmCenterABI } from '@/constant/abi/FarmCenterABI'
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
import { IncentiveMakerABI } from '@/constant/abi/IncentiveMakerABI'
import { MultiFeeDistributionABI } from '@/constant/abi/MultiFeeDistributionABI'
import Contracts from '@/constant/contracts'

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

export const getWBNBContract = chainId => getContract(wbnbAbi, Contracts.WBNB, chainId)

export const getGaugeSimpleContract = (address, chainId) => getContract(gaugeSimpleAbi, address, chainId)

/** **************************************************************************************************
                                            Solidly
  ************************************************************************************************** */

export const getRouterContract = chainId => getContract(routerAbi, Contracts.solidlyRouter, chainId)

export const getVeTHEContract = chainId => getContract(veTHEAbi, Contracts.veTHE, chainId)

export const getVeDistContract = chainId => getContract(veDistAbi, Contracts.veDist, chainId)

export const getVoterContract = (chainId, version = 3) => {
  if (version === 2) {
    return {
      address: '0x3A1D0952809F4948d15EBCe8d345962A282C4fCb',
      abi: voterV2Abi,
    }
  }
  return getContract(voterAbi, Contracts.voter, chainId)
}

export const getVotingIncentivesContract = (address, chainId) => getContract(votingIncentivesAbi, address, chainId)

export const getGaugeContract = (address, chainId) => getContract(GaugeABI, address, chainId)

export const getPairContract = (address, chainId) => getContract(pairAbi, address, chainId)

/** **************************************************************************************************
                                          theNFT (THENIANs)
 ************************************************************************************************** */
export const getTheNftContract = () => getContract(ThenianAbi, Contracts.theNFT, ChainId.BSC)

export const getNftStakingContract = () => getContract(stakingAbi, Contracts.nftStaking, ChainId.BSC)

export const getRoyaltyContract = () => getContract(royaltyAbi, Contracts.royalty, ChainId.BSC)

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
  getContract(MultiFeeDistributionABI, address, chainId)

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

export const getMultiAccountContract = () => getContract(multiAccountAbi, Contracts.multiAccount, ChainId.BSC)

export const getTCPerpRewarderContract = () => getContract(tcPerpRewarderAbi, Contracts.tcPerpRewarder, ChainId.BSC)

/** ******************************************************************************************************
                                          NONFUNGIBLE_POSITION_MANAGER
******************************************************************************************************* */

export const getFarmingCenterContract = chainId => ({
  abi: FarmCenterABI,
  address: Contracts.FarmingCenter[chainId],
})

export const getIncentiveContract = chainId => ({
  abi: IncentiveMakerABI,
  address: Contracts.IncentiveMaker[chainId],
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

export const getEmergencyRouterContract = chainId => getContract(emergencyRouterAbi, Contracts.emergencyRouter, chainId)
