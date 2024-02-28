import {
  multicall,
  readContract,
  sendTransaction,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from '@wagmi/core'
import { ChainId } from 'thena-sdk-core/dist'

import { wagmiConfig } from '@/context/Web3Modal'

export const callMulti = async contracts => {
  const res = await multicall(wagmiConfig, {
    contracts,
  })
  return res.map(ele => (ele.status === 'success' ? ele.result : null))
}

export const readCall = async (contract, functionName, args = [], chainId = ChainId.BSC) =>
  await readContract(wagmiConfig, {
    ...contract,
    functionName,
    args,
    chainId,
  })

export const writeCall = async (contract, functionName, args = [], value = 0n, chainId = ChainId.BSC) =>
  await writeContract(wagmiConfig, {
    ...contract,
    functionName,
    args,
    value,
    chainId,
  })

export const sendCall = async (to, data, value = 0n, chainId = ChainId.BSC) =>
  await sendTransaction(wagmiConfig, {
    to,
    data,
    value,
    chainId,
  })

export const waitCall = async hash =>
  await waitForTransactionReceipt(wagmiConfig, {
    hash,
  })

export const simulateCall = async (contract, functionName, args = [], chainId = ChainId.BSC) => {
  const res = await simulateContract(wagmiConfig, {
    ...contract,
    functionName,
    args,
    chainId,
  })
  return res.result
}
