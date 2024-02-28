import BigNumber from 'bignumber.js'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import { readCall, simulateCall } from '@/lib/contractActions'
import {
  getERC20Contract,
  getGaugeSimpleContract,
  getIchiVaultContract,
  getVaultDepositContract,
  getWBNBContract,
} from '@/lib/contracts'
import { warnToast } from '@/lib/notify'
import { formatAmount, fromWei, toWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useChainSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'

export const useIchiManage = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn, updateTxn } = useTxn()

  const onIchiAdd = useCallback(
    async (vault, amount, slippage) => {
      const vaultContract = getIchiVaultContract(vault.address, networkId)
      const { token0, token1 } = vault
      if (token0.allowed) {
        const maxRes = await readCall(vaultContract, 'deposit0Max', [], networkId)
        const deposit0Max = fromWei(maxRes, token0.decimals)
        if (deposit0Max.lt(amount)) {
          warnToast(`Maximum deposit amount of ${token0.symbol} is ${deposit0Max.toFormat(0)}.`)
          return
        }
      } else {
        const maxRes = await readCall(vaultContract, 'deposit1Max', [], networkId)
        const deposit1Max = fromWei(maxRes, token1.decimals)
        if (deposit1Max.lt(amount)) {
          warnToast(`Maximum deposit amount of ${token1.symbol} is ${deposit1Max.toFormat(0)}.`)
          return
        }
      }
      const key = uuidv4()
      const approveuuid = uuidv4()
      const supplyuuid = uuidv4()
      const depositToken = token0.allowed ? token0 : token1
      const tokenContract = getERC20Contract(depositToken.address, networkId)
      const depositGuardAddress = Contracts.vaultDepositGuard[networkId]
      const allowance = await readCall(tokenContract, 'allowance', [account, depositGuardAddress], networkId)
      const isApproved = fromWei(allowance, depositToken.decimals).gte(amount)
      setPending(true)
      startTxn({
        key,
        title: `Deposit ${depositToken.symbol} in the vault`,
        transactions: {
          ...(!isApproved && {
            [approveuuid]: {
              desc: `Approve ${depositToken.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [supplyuuid]: {
            desc: `Deposit ${depositToken.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      if (!isApproved) {
        if (!(await writeTxn(key, approveuuid, tokenContract, 'approve', [depositGuardAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }
      const depositGuardContract = getVaultDepositContract(networkId)
      const vaultDeployerAddress = Contracts.vaultDeployer[networkId]
      const depositAmount = toWei(amount, depositToken.decimals).dp(0).toString(10)
      let lpAmount = await simulateCall(
        depositGuardContract,
        'forwardDepositToICHIVault',
        [vault.address, vaultDeployerAddress, depositToken.address, depositAmount, '0', account],
        networkId,
      )
      lpAmount = new BigNumber(lpAmount)
        .times(Math.floor((100 - slippage) * 1000))
        .div(100000)
        .dp(0)
        .toString(10)

      if (
        !(await writeTxn(key, supplyuuid, depositGuardContract, 'forwardDepositToICHIVault', [
          vault.address,
          vaultDeployerAddress,
          depositToken.address,
          depositAmount,
          lpAmount,
          account,
        ]),
        networkId)
      ) {
        setPending(false)
        return
      }
      endTxn({
        key,
        final: 'Liquidity Add Successful',
      })
      setPending(false)
    },
    [account, startTxn, writeTxn, endTxn, networkId],
  )

  const onIchiAddAndStake = useCallback(
    async (vault, amount, amountToWrap, slippage) => {
      const vaultContract = getIchiVaultContract(vault.address, networkId)
      const { token0, token1 } = vault
      if (token0.address === vault.allowed.address) {
        const maxRes = await readCall(vaultContract, 'deposit0Max', [], networkId)
        const deposit0Max = fromWei(maxRes, token0.decimals)
        if (deposit0Max.lt(amount)) {
          warnToast(`Maximum deposit amount of ${token0.symbol} is ${deposit0Max.toFormat(0)}.`)
          return
        }
      } else {
        const maxRes = await readCall(vaultContract, 'deposit1Max', [], networkId)
        const deposit1Max = fromWei(maxRes, token1.decimals)
        if (deposit1Max.lt(amount)) {
          warnToast(`Maximum deposit amount of ${token1.symbol} is ${deposit1Max.toFormat(0)}.`)
          return
        }
      }
      const key = uuidv4()
      const wrapuuid = uuidv4()
      const approveuuid = uuidv4()
      const supplyuuid = uuidv4()
      const approve1uuid = uuidv4()
      const stakeuuid = uuidv4()
      const depositToken = token0.address === vault.allowed.address ? token0 : token1
      const tokenContract = getERC20Contract(depositToken.address, networkId)
      const depositGuardAddress = Contracts.vaultDepositGuard[networkId]
      const allowance = await readCall(tokenContract, 'allowance', [account, depositGuardAddress], networkId)
      const isApproved = fromWei(allowance, depositToken.decimals).gte(amount)
      setPending(true)
      startTxn({
        key,
        title: 'Deposit and stake',
        transactions: {
          ...(amountToWrap && {
            [wrapuuid]: {
              desc: `Wrap ${formatAmount(amountToWrap)} BNB for WBNB`,
              status: TXN_STATUS.WAITING,
              hash: null,
            },
          }),
          ...(!isApproved && {
            [approveuuid]: {
              desc: `Approve ${depositToken.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [supplyuuid]: {
            desc: `Deposit ${depositToken.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          },
          [approve1uuid]: {
            desc: 'Approve LP',
            status: TXN_STATUS.START,
            hash: null,
          },
          [stakeuuid]: {
            desc: 'Stake LP',
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      // Wrap BNB
      if (amountToWrap) {
        const wbnbContract = getWBNBContract(networkId)
        if (!(await writeTxn(key, wrapuuid, wbnbContract, 'deposit', [], toWei(amountToWrap).dp(0).toString(10)))) {
          setPending(false)
          return
        }
      }

      // Approve deposit token
      if (!isApproved) {
        if (!(await writeTxn(key, approveuuid, tokenContract, 'approve', [depositGuardAddress, maxUint256]))) {
          setPending(false)
          return
        }
      }

      // Deposit
      const depositGuardContract = getVaultDepositContract(networkId)
      const vaultDeployerAddress = Contracts.vaultDeployer[networkId]
      const depositAmount = toWei(amount, depositToken.decimals).dp(0).toString(10)
      let lpAmount = await simulateCall(
        depositGuardContract,
        'forwardDepositToICHIVault',
        [vault.address, vaultDeployerAddress, depositToken.address, depositAmount, '0', account],
        networkId,
      )
      lpAmount = new BigNumber(lpAmount)
        .times(Math.floor((100 - slippage) * 1000))
        .div(100000)
        .dp(0)
        .toString(10)

      if (
        !(await writeTxn(key, supplyuuid, depositGuardContract, 'forwardDepositToICHIVault', [
          vault.address,
          vaultDeployerAddress,
          depositToken.address,
          depositAmount,
          lpAmount,
          account,
        ]))
      ) {
        setPending(false)
        return
      }

      // Approve LP
      const allowance1 = await readCall(vaultContract, 'allowance', [account, vault.gauge.address], networkId)
      const lpBalance = await readCall(vaultContract, 'balanceOf', [account], networkId)
      const isVaultApproved = fromWei(allowance1).gte(lpBalance)

      if (!isVaultApproved) {
        if (!(await writeTxn(key, approve1uuid, vaultContract, 'approve', [vault.gauge.address, maxUint256]))) {
          setPending(false)
          return
        }
      } else {
        updateTxn({
          key,
          uuid: approve1uuid,
          status: TXN_STATUS.SUCCESS,
        })
      }

      // Stake LP
      const gaugeContract = getGaugeSimpleContract(vault.gauge.address, networkId)
      if (!(await writeTxn(key, stakeuuid, gaugeContract, 'deposit', [lpBalance]))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Liquidity Added and Staked',
      })
      setPending(false)
    },
    [account, startTxn, writeTxn, endTxn, updateTxn, networkId],
  )

  return { onIchiAdd, onIchiAddAndStake, pending }
}

export const useIchiRemove = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onIchiRemove = useCallback(
    async (pool, amount) => {
      const key = uuidv4()
      const removeuuid = uuidv4()
      startTxn({
        key,
        title: 'Remove position',
        transactions: {
          [removeuuid]: {
            desc: 'Remove position',
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)
      const vaultContract = getIchiVaultContract(pool.address, networkId)

      if (!(await writeTxn(key, removeuuid, vaultContract, 'withdraw', [toWei(amount).toFixed(0), account]))) {
        setPending(false)
        return
      }
      endTxn({
        key,
        final: 'Liquidity Remove Successful',
      })
      setPending(false)
    },
    [account, startTxn, writeTxn, endTxn, networkId],
  )

  return { onIchiRemove, pending }
}
