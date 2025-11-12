import { ChainId } from 'thena-sdk-core'

import {
  emergencyRouterAbi,
  ERC20Abi,
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
import { FarmingCenterABI } from '@/constant/abi/integral/FarmingCenterABI'
import { IncentiveMakerABI } from '@/constant/abi/integral/IncentiveMakerABI'
import { SolidlyRouterABI } from '@/constant/abi/solidly/SolidlyRouterABI'
import { NFTStakingABI } from '@/constant/abi/thenft/NFTStakingABI'
import { RoyaltyABI } from '@/constant/abi/thenft/RoyaltyABI'
import { TheNFTABI } from '@/constant/abi/thenft/TheNFTABI'
import { GaugeABI } from '@/constant/abi/ve/GaugeABI'
import { MultiFeeDistributionABI } from '@/constant/abi/ve/MultiFeeDistributionABI'
import { VeDistABI } from '@/constant/abi/ve/VeDistABI'
import { VeTHEABI } from '@/constant/abi/ve/VeTHEABI'
import { VoterV3ABI } from '@/constant/abi/ve/VoterV3ABI'
import { WbnbABI } from '@/constant/abi/WbnbABI'
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

export const getWBNBContract = chainId => getContract(WbnbABI, Contracts.WBNB, chainId)

export const getGaugeSimpleContract = (address, chainId) => getContract(gaugeSimpleAbi, address, chainId)

/** **************************************************************************************************
                                            Solidly
  ************************************************************************************************** */

export const getSolidlyRouterContract = chainId => getContract(SolidlyRouterABI, Contracts.SolidlyRouter, chainId)

export const getVeTHEContract = chainId => getContract(VeTHEABI, Contracts.veTHE, chainId)

export const getVeDistContract = chainId => getContract(VeDistABI, Contracts.veDist, chainId)

export const getVoterV3Contract = chainId => getContract(VoterV3ABI, Contracts.VoterV3, chainId)

export const getGaugeContract = (address, chainId) => getContract(GaugeABI, address, chainId)

/** **************************************************************************************************
                                          theNFT (THENIANs)
 ************************************************************************************************** */
export const getTheNftContract = () => getContract(TheNFTABI, Contracts.theNFT, ChainId.BSC)

export const getNftStakingContract = () => getContract(NFTStakingABI, Contracts.nftStaking, ChainId.BSC)

export const getRoyaltyContract = () => getContract(RoyaltyABI, Contracts.royalty, ChainId.BSC)

/** **************************************************************************************************
                                          FUSION (Algebra)
 ************************************************************************************************** */

export const getFusionRouterContract = chainId => getContract(fusionRouterAbi, Contracts.fusionRouter, chainId)

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
  abi: FarmingCenterABI,
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
