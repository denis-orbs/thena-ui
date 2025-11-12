import gaugeSimpleAbi from '@/constant/abi/fusion/gaugeSimple.json'
import { IchiVaultV2ABI } from '@/constant/abi/ichi/IchiVaultV2ABI'
import { ICHI_VAULTS } from '@/constant/ichiVaults'

import { callMulti } from '../contractActions'
import { fromWei } from '../utils'

const fetchUserWalletBalance = async (account, chainId) => {
  const rawRes = await callMulti(
    ICHI_VAULTS[chainId].map(vault => ({
      address: vault.address,
      abi: IchiVaultV2ABI,
      functionName: 'balanceOf',
      args: [account],
      chainId,
    })),
  )
  return rawRes.map(ele => fromWei(ele))
}

const fetchUserGaugeBalance = async (account, chainId) => {
  const rawRes = await callMulti(
    ICHI_VAULTS[chainId].map(vault => ({
      address: vault.gaugeAddress,
      abi: gaugeSimpleAbi,
      functionName: 'balanceOf',
      args: [account],
      chainId,
    })),
  )
  return rawRes.map(ele => fromWei(ele))
}

const fetchUserEarned0 = async (account, chainId) =>
  await callMulti(
    ICHI_VAULTS[chainId].map(vault => ({
      address: vault.gaugeAddress,
      abi: gaugeSimpleAbi,
      functionName: 'earned',
      args: [account, vault.token0Address],
      chainId,
    })),
  )

const fetchUserEarned1 = async (account, chainId) =>
  await callMulti(
    ICHI_VAULTS[chainId].map(vault => ({
      address: vault.gaugeAddress,
      abi: gaugeSimpleAbi,
      functionName: 'earned',
      args: [account, vault.token1Address],
      chainId,
    })),
  )

const fetchUserEarned2 = async (account, chainId) =>
  await callMulti(
    ICHI_VAULTS[chainId].map(vault => ({
      address: vault.gaugeAddress,
      abi: gaugeSimpleAbi,
      functionName: 'earned',
      args: [account, vault.rewardAddress],
      chainId,
    })),
  )

export const fetchUserVaultsData = async (account, networkId) => {
  const [walletBalances, gaugeBalances, earned0, earned1, earned2] = await Promise.all([
    fetchUserWalletBalance(account, networkId),
    fetchUserGaugeBalance(account, networkId),
    fetchUserEarned0(account, networkId),
    fetchUserEarned1(account, networkId),
    fetchUserEarned2(account, networkId),
  ])

  return ICHI_VAULTS[networkId].map((vault, index) => ({
    version: vault.version,
    address: vault.address,
    walletBalance: walletBalances[index],
    gaugeBalance: gaugeBalances[index],
    totalLp: gaugeBalances[index].plus(walletBalances[index]),
    earned0: earned0[index],
    earned1: earned1[index],
    earned2: earned2[index],
  }))
}
