import { ChainId } from 'thena-sdk-core'

import { ERC20Abi } from '@/abis'
import {
  multiAccountAbi,
  oldTcSpotAbi,
  tcManagerAbi,
  tcPerpetualAbi,
  tcPerpetualManagerAbi,
  tcPerpRewarderAbi,
  tcSpotAbi,
  thenaIdAbi,
} from '@/abis/core'
import { FarmingCenterABI } from '@/abis/integral/FarmingCenterABI'
import { IncentiveMakerABI } from '@/abis/integral/IncentiveMakerABI'
import { SolidlyRouterABI } from '@/abis/solidly/SolidlyRouterABI'
import { NFTStakingABI } from '@/abis/thenft/NFTStakingABI'
import { RoyaltyABI } from '@/abis/thenft/RoyaltyABI'
import { TheNFTABI } from '@/abis/thenft/TheNFTABI'
import { GaugeABI } from '@/abis/ve/GaugeABI'
import { MultiFeeDistributionABI } from '@/abis/ve/MultiFeeDistributionABI'
import { VeDistABI } from '@/abis/ve/VeDistABI'
import { VeTHEABI } from '@/abis/ve/VeTHEABI'
import { VoterV3ABI } from '@/abis/ve/VoterV3ABI'
import { WbnbABI } from '@/abis/WbnbABI'
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
                                            Gamma
 ************************************************************************************************** */

export const getMultiFeeDistributionContract = (address, chainId) =>
  getContract(MultiFeeDistributionABI, address, chainId)

/** **************************************************************************************************
                                            ICHI
*************************************************************************************************** */

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
