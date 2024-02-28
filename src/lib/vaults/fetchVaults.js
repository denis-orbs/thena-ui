import { gaugeSimpleAbi, ichiVaultAbi } from '@/constant/abi/fusion'
import { ICHI_VAULTS } from '@/constant/ichiVaults'

import { callMulti } from '../contractActions'
import { fromWei } from '../utils'

const fetchTotalSupply = async chainId => {
  const rawRes = await callMulti(
    ICHI_VAULTS[chainId].map(vault => ({
      address: vault.address,
      abi: ichiVaultAbi,
      functionName: 'totalSupply',
      args: [],
      chainId,
    })),
  )
  return rawRes.map(totalSupply => fromWei(totalSupply))
}

const fetchTotalAmounts = async chainId =>
  await callMulti(
    ICHI_VAULTS[chainId].map(vault => ({
      address: vault.address,
      abi: ichiVaultAbi,
      functionName: 'getTotalAmounts',
      args: [],
      chainId,
    })),
  )

const fetchGaugeReward0 = async chainId =>
  await callMulti(
    ICHI_VAULTS[chainId].map(vault => ({
      address: vault.gaugeAddress,
      abi: gaugeSimpleAbi,
      functionName: 'rewardRate',
      args: [vault.token0Address],
      chainId,
    })),
  )

const fetchGaugeReward1 = async chainId =>
  await callMulti(
    ICHI_VAULTS[chainId].map(vault => ({
      address: vault.gaugeAddress,
      abi: gaugeSimpleAbi,
      functionName: 'rewardRate',
      args: [vault.token1Address],
      chainId,
    })),
  )

const fetchGaugeReward2 = async chainId =>
  await callMulti(
    ICHI_VAULTS[chainId].map(vault => ({
      address: vault.gaugeAddress,
      abi: gaugeSimpleAbi,
      functionName: 'rewardRate',
      args: [vault.rewardAddress],
      chainId,
    })),
  )

const fetchGaugeSupply = async chainId => {
  const rawRes = await callMulti(
    ICHI_VAULTS[chainId].map(vault => ({
      address: vault.address,
      abi: ichiVaultAbi,
      functionName: 'balanceOf',
      args: [vault.gaugeAddress],
      chainId,
    })),
  )
  return rawRes.map(ele => fromWei(ele))
}

export const fetchVaultsData = async chainId => {
  if (ICHI_VAULTS[chainId].length === 0) return []
  const [totalSupply, totalAmounts, reward2, reward0, reward1, gaugeSupply] = await Promise.all([
    fetchTotalSupply(chainId),
    fetchTotalAmounts(chainId),
    fetchGaugeReward2(chainId),
    fetchGaugeReward0(chainId),
    fetchGaugeReward1(chainId),
    fetchGaugeSupply(chainId),
  ])
  return ICHI_VAULTS[chainId].map((vault, index) => ({
    ...vault,
    totalSupply: totalSupply[index],
    reserve0: totalAmounts[index][0],
    reserve1: totalAmounts[index][1],
    rewardRate2: reward2[index],
    rewardRate0: reward0[index],
    rewardRate1: reward1[index],
    gaugeSupply: gaugeSupply[index],
  }))
}
