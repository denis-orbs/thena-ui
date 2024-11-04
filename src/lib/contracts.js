import { ChainId } from 'thena-sdk-core'

import {
  bribeAbi,
  claimerAbi,
  dibsAbi,
  dibsLotteryAbi,
  dibsRewarderAbi,
  ERC20Abi,
  gaugeAbi,
  globalFactoryAbi,
  minterAbi,
  minterTestnetAbi,
  mockERC20Abi,
  mockERC20BNBAbi,
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
  voterTestNetAbi,
  votingEscrowAbi,
  votingEscrowAttachAbi,
  wbnbAbi,
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
export const getVotingEScrowContract = () => getContract(votingEscrowAbi, Contracts.votingEscrow, 97)

/** ******************************************************************************************************
                                          VotingEscrowAttach
******************************************************************************************************* */
export const getVotingEScrowAttachContract = () => getContract(votingEscrowAttachAbi, Contracts.votingEscrowAttach, 97)

/** ******************************************************************************************************
                                          Claimer
******************************************************************************************************* */
export const getClaimerContract = () => getContract(claimerAbi, Contracts.claimer, 97)

/** ******************************************************************************************************
                                          Minter
******************************************************************************************************* */
export const getMinterTestnetContract = () => getContract(minterTestnetAbi, Contracts.minter, 97)
