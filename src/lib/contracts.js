import { ChainId } from 'thena-sdk-core'

import {
  bribeAbi,
  dibsAbi,
  dibsLotteryAbi,
  ERC20Abi,
  gaugeAbi,
  minterAbi,
  multiCallAbi,
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
  wbnbAbi,
} from '@/constant/abi'
import {
  algebraAbi,
  defiedgeStrategyAbi,
  fusionQuoterAbi,
  fusionRouterAbi,
  gammaClearingAbi,
  gammaHypervisorAbi,
  gammaUniProxyAbi,
  gaugeSimpleAbi,
  ichiVaultAbi,
  vaultDepositGaurdAbi,
} from '@/constant/abi/fusion'
import Contracts from '@/constant/contracts'

const getContract = (abi, addressOrAddressMap, chainId) => {
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

export const getVoterContract = chainId => getContract(voterAbi, Contracts.voter, chainId)

export const getGaugeContract = (address, chainId) => getContract(gaugeAbi, address, chainId)

export const getBribeContract = (address, chainId) => getContract(bribeAbi, address, chainId)

export const getPairContract = (address, chainId) => getContract(pairAbi, address, chainId)

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

export const getAlgebraNPMContract = chainId => getContract(algebraAbi, Contracts.nonfungiblePositionManager, chainId)

export const getFusionRouterContract = chainId => getContract(fusionRouterAbi, Contracts.fusionRouter, chainId)

export const getFusionQuoterContract = chainId => getContract(fusionQuoterAbi, Contracts.fusionQuoter, chainId)

/** **************************************************************************************************
                                            Gamma
 ************************************************************************************************** */

export const getGammaUNIProxyContract = chainId => getContract(gammaUniProxyAbi, Contracts.gammaUniProxy, chainId)

export const getGammaClearingContract = (address, chainId) => getContract(gammaClearingAbi, address, chainId)

export const getGammaHyperVisorContract = (address, chainId) => getContract(gammaHypervisorAbi, address, chainId)

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
