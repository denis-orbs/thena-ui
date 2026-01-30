import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { decodeEventLog, erc20Abi, maxUint256 } from 'viem'

import { IchiFarmingABI } from '@/abis/ichi/IchiFarmingABI'
import { IchiGaugeABI } from '@/abis/ichi/IchiGaugeABI'
import { IchiVaultV2ABI } from '@/abis/ichi/IchiVaultV2ABI'
import { IchiVaultV3ABI } from '@/abis/ichi/IchiVaultV3ABI'
import { VaultDepositGaurdABI } from '@/abis/ichi/VaultDepositGaurdABI'
import { HASH, ICHI_TYPES, TXN_STATUS } from '@/constant'
import Contracts from '@/constant/contracts'
import { FARM_CONFIG, NEW_ICHI_STRATEGIES } from '@/constant/ichiVaults'
import useWallet from '@/hooks/useWallet'
import { readCall, simulateCall, waitCall } from '@/lib/contractActions'
import { getERC20Contract, getGaugeContract, getMultiFeeDistributionContract, getWBNBContract } from '@/lib/contracts'
import { errorToast, warnToast } from '@/lib/notify'
import { useChainSettings } from '@/state/settings/hooks'
import { useTxn } from '@/state/transactions/hooks'
import { fromWei, isInvalidAmount, toWei } from '@/utils/utils'

import { fetchOdosQuote, simulateOdosSwap } from '../useSwap'

const getIchiVaultContract = (address, version = 2) => {
  if (version === 3) {
    return {
      address,
      abi: IchiVaultV3ABI,
    }
  }
  return {
    address,
    abi: IchiVaultV2ABI,
  }
}

export const findNewIchiStrategy = (address, allowOldPool = false) =>
  NEW_ICHI_STRATEGIES.find(config => {
    if (allowOldPool) {
      return (
        config.pool.toLowerCase() === address.toLowerCase() || config.oldPool.toLowerCase() === address.toLowerCase()
      )
    }
    return config.pool.toLowerCase() === address.toLowerCase()
  })

const getVaultDepositContract = (chainId, version = 2, isNewIchiStrategy = false, isFarming = false) => {
  if (version === 3) {
    const address = isFarming
      ? !isNewIchiStrategy
        ? Contracts.vaultDepositGuardV3Farming[chainId]
        : Contracts.vaultDepositGuardV3FarmingNew[chainId]
      : Contracts.vaultDepositGuardV3Fee[chainId]

    return {
      address,
      abi: VaultDepositGaurdABI,
    }
  }

  return {
    address: Contracts.vaultDepositGuard[chainId],
    abi: VaultDepositGaurdABI,
  }
}

export const useIchiManage = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn, updateTxn, closeTxn } = useTxn()
  const t = useTranslations()

  const onIchiAdd = useCallback(
    async (vault, amount, slippage) => {
      const vaultContract = getIchiVaultContract(vault.address)
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
      const amountToApprove = toWei(amount, depositToken.decimals).minus(allowance)

      setPending(true)
      startTxn({
        key,
        title: `${t('Deposit')} ${depositToken.symbol}`,
        transactions: {
          ...(amountToApprove.gt(0) && {
            [approveuuid]: {
              desc: `${t('Approve')} ${depositToken.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [supplyuuid]: {
            desc: `${t('Deposit')} ${depositToken.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      if (amountToApprove.gt(0)) {
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

      if (isInvalidAmount(lpAmount)) {
        setPending(false)
        errorToast('Error', 'Deposit Not Allowed Description')
        closeTxn()
        return
      }

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
    [networkId, account, startTxn, t, writeTxn, endTxn, closeTxn],
  )

  const onIchiAddAndStake = useCallback(
    async ({ vault, amount, amountToWrap, slippage }, callback) => {
      const vaultContract = getIchiVaultContract(vault.address)
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
      const approveLpId = uuidv4()
      const stakeuuid = uuidv4()
      const depositToken = token0.address === vault.allowed.address ? token0 : token1
      const tokenContract = getERC20Contract(depositToken.address, networkId)
      const depositGuardAddress = Contracts.vaultDepositGuard[networkId]
      const allowance = await readCall(tokenContract, 'allowance', [account, depositGuardAddress], networkId)
      const amountToApprove = toWei(amount, depositToken.decimals).minus(allowance)

      setPending(true)
      startTxn({
        key,
        title: 'Deposit and Stake',
        transactions: {
          ...(amountToWrap && {
            [wrapuuid]: {
              desc: t('Wrap'),
              status: TXN_STATUS.WAITING,
              hash: null,
            },
          }),
          ...(amountToApprove.gt(0) && {
            [approveuuid]: {
              desc: `${t('Approve')} ${depositToken.symbol}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [supplyuuid]: {
            desc: `${t('Deposit')} ${depositToken.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          },
          [approveLpId]: {
            desc: `${t('Approve')} LP`,
            status: TXN_STATUS.START,
            hash: null,
          },
          [stakeuuid]: {
            desc: `${t('Stake')} LP`,
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
      if (amountToApprove.gt(0)) {
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

      if (isInvalidAmount(lpAmount)) {
        setPending(false)
        errorToast('Error', 'Deposit Not Allowed Description')
        closeTxn()
        return
      }

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
      const lpAllowance = await readCall(vaultContract, 'allowance', [account, vault.gauge.address], networkId)
      const lpBalance = await readCall(vaultContract, 'balanceOf', [account], networkId)
      const amountToApproveLP = BigNumber(lpBalance).minus(lpAllowance)

      if (amountToApproveLP.gt(0)) {
        if (!(await writeTxn(key, approveLpId, vaultContract, 'approve', [vault.gauge.address, maxUint256]))) {
          setPending(false)
          return
        }
      } else {
        updateTxn({ key, uuid: approveLpId, status: TXN_STATUS.SUCCESS })
      }

      // Stake LP
      const gaugeContract = {
        address: vault.gauge.address,
        abi: IchiGaugeABI,
      }
      if (!(await writeTxn(key, stakeuuid, gaugeContract, 'deposit', [lpBalance]))) {
        setPending(false)
        return
      }

      endTxn({
        key,
        final: 'Liquidity Added and Staked',
      })
      setPending(false)
      if (callback) callback()
    },
    [networkId, account, startTxn, t, writeTxn, endTxn, closeTxn, updateTxn],
  )

  return { onIchiAdd, onIchiAddAndStake, pending }
}

export const useIchiRemove = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn } = useTxn()
  const t = useTranslations()

  const onIchiRemove = useCallback(
    async ({ pool, amount, version, callback, isStaked = true, hasRewards = false }) => {
      const key = uuidv4()
      const removeuuid = uuidv4()
      const claimuuid = uuidv4()
      const unstakeuuid = uuidv4()
      const isFarming = pool.title === ICHI_TYPES[0] && version === 3
      const isSingleSided = pool.title === ICHI_TYPES[3] && version === 2

      const isRemoveAll = pool?.staked
        ? pool?.account?.gaugeBalance?.eq(amount)
        : pool?.account?.walletBalance?.eq(amount)

      startTxn({
        key,
        title: 'Remove Liquidity',
        transactions: {
          ...((isFarming || isSingleSided) &&
            isStaked && {
              [unstakeuuid]: {
                desc: t(hasRewards && isSingleSided ? 'Unstake and Harvest' : 'Unstake'),
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
          ...(hasRewards &&
            !isSingleSided && {
              [claimuuid]: {
                desc: t('Claim Rewards'),
                status: TXN_STATUS.START,
                hash: null,
              },
            }),
          [removeuuid]: {
            desc: t('Remove Liquidity'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })
      setPending(true)

      const vaultContract = getIchiVaultContract(pool.address, version)
      if (isFarming) {
        // Use hardcoded farming contract address from FARM_CONFIG
        // The vault contract's farmingContract will be set to 0, so we can't read it
        const farmConfig = FARM_CONFIG.find(config => config.pool.toLowerCase() === pool.address.toLowerCase()) // if found => old Ichi strategies
        const newFarmConfig = findNewIchiStrategy(pool.address) // if found => new Ichi strategies
        if (!farmConfig && !newFarmConfig) {
          errorToast('Error', 'Farming contract not found for this pool')
          setPending(false)
          return
        }
        const farmContractAddress = farmConfig?.farming || newFarmConfig?.farming
        const farmingContract = {
          address: farmContractAddress,
          abi: IchiFarmingABI,
        }
        const multiFeeDistributionContract = getMultiFeeDistributionContract(farmContractAddress, networkId)
        // For Ichi farming pools, users MUST unstake before withdrawing
        if (isStaked) {
          if (!(await writeTxn(key, unstakeuuid, farmingContract, 'unstake', [toWei(amount).toFixed(0)]))) {
            setPending(false)
            return
          }
        }

        if (hasRewards) {
          if (!(await writeTxn(key, claimuuid, multiFeeDistributionContract, 'getAllRewards', []))) {
            setPending(false)
            return
          }
        }
      } else if (isSingleSided && isStaked) {
        const gaugeContract = getGaugeContract(pool.gauge.address, networkId)
        const params = hasRewards ? [] : [toWei(amount, pool.decimals).toFixed(0)]
        const func = hasRewards ? 'withdrawAllAndHarvest' : 'withdraw'
        if (!(await writeTxn(key, unstakeuuid, gaugeContract, func, params))) {
          setPending(false)
          return
        }
      }
      if (!(await writeTxn(key, removeuuid, vaultContract, 'withdraw', [toWei(amount).toFixed(0), account]))) {
        setPending(false)
        return
      }
      endTxn({ key, final: 'Liquidity Remove Successful' })
      callback(isRemoveAll)
      setPending(false)
    },
    [account, startTxn, writeTxn, endTxn, networkId, t],
  )

  return { onIchiRemove, pending }
}

export const useIchiManageV3 = () => {
  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn, updateTxn, closeTxn } = useTxn()
  const t = useTranslations()

  const addIchiPool = useCallback(
    async ({ vault, amount, amountToWrap, slippage }, callback) => {
      const isNewIchiStrategy = findNewIchiStrategy(vault.address) // if found => new Ichi strategies
      if (!isNewIchiStrategy) {
        errorToast('Error', 'Old Ichi strategies are not supported yet')
        setPending(false)
        return
      }
      // eslint-disable-next-line no-unused-vars
      const { token0, token1, address: vaultAddress, isFarming = false } = vault
      const vaultContract = getIchiVaultContract(vaultAddress, 3)

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
      const depositContract = getVaultDepositContract(networkId, 3, Boolean(isNewIchiStrategy), isFarming)

      const allowance = await readCall(tokenContract, 'allowance', [account, depositContract.address], networkId)
      const amountToApprove = toWei(amount, depositToken.decimals).minus(allowance)

      const transactions = {}
      if (amountToWrap) {
        transactions[wrapuuid] = {
          desc: t('Wrap'),
          status: TXN_STATUS.WAITING,
          hash: null,
        }
      }

      if (amountToApprove.gt(0)) {
        transactions[approveuuid] = {
          desc: `${t('Approve')} ${depositToken.symbol}`,
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      transactions[supplyuuid] = {
        desc: `${t('Deposit')} ${depositToken.symbol}`,
        status: TXN_STATUS.START,
        hash: null,
      }

      if (isFarming) {
        transactions[approve1uuid] = {
          desc: `${t('Approve')} LP`,
          status: TXN_STATUS.START,
          hash: null,
        }
        transactions[stakeuuid] = {
          desc: `${t('Stake')} LP`,
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      startTxn({ key, transactions, title: 'Deposit' })
      setPending(true)

      // Wrap BNB
      if (amountToWrap) {
        const wbnbContract = getWBNBContract(networkId)
        if (!(await writeTxn(key, wrapuuid, wbnbContract, 'deposit', [], toWei(amountToWrap).dp(0).toString(10)))) {
          setPending(false)
          return
        }
      }

      // Approve deposit token
      if (amountToApprove.gt(0)) {
        if (!(await writeTxn(key, approveuuid, tokenContract, 'approve', [depositContract.address, maxUint256]))) {
          setPending(false)
          return
        }
      }

      // Deposit
      const vaultDeployerAddress = Contracts.vaultDeployer[networkId]
      const depositAmount = toWei(amount, depositToken.decimals).dp(0).toString(10)
      let lpAmount = await simulateCall(
        depositContract,
        'forwardDepositToICHIVault',
        [vaultAddress, vaultDeployerAddress, depositToken.address, depositAmount, '0', account],
        networkId,
      )
      lpAmount = new BigNumber(lpAmount)
        .times(Math.floor((100 - slippage) * 1000))
        .div(100000)
        .dp(0)
        .toString(10)

      if (isInvalidAmount(lpAmount)) {
        setPending(false)
        errorToast('Error', 'Deposit Not Allowed Description')
        closeTxn()
        return
      }

      if (
        !(await writeTxn(key, supplyuuid, depositContract, 'forwardDepositToICHIVault', [
          vaultAddress,
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

      if (isFarming) {
        // Approve LP
        const farmingAddress = await readCall(vaultContract, 'farmingContract', [], networkId)
        const allowance1 = await readCall(vaultContract, 'allowance', [account, farmingAddress], networkId)
        const lpBalance = await readCall(vaultContract, 'balanceOf', [account], networkId)
        const liquidityToApprove = BigNumber(lpBalance).minus(allowance1)

        if (liquidityToApprove.gt(0)) {
          if (!(await writeTxn(key, approve1uuid, vaultContract, 'approve', [farmingAddress, maxUint256]))) {
            setPending(false)
            return
          }
        } else {
          updateTxn({ key, uuid: approve1uuid, status: TXN_STATUS.SUCCESS })
        }

        // Stake LP
        const farmingContract = {
          address: farmingAddress,
          abi: IchiFarmingABI,
        }
        if (!(await writeTxn(key, stakeuuid, farmingContract, 'stake', [lpBalance, account]))) {
          setPending(false)
          return
        }
      }

      endTxn({ key, final: 'Liquidity Added' })
      setPending(false)
      if (callback) callback()
    },
    [networkId, account, startTxn, t, writeTxn, endTxn, closeTxn, updateTxn],
  )

  const stakeIchiPool = useCallback(
    async ({ vaultAddress, amount, callback }) => {
      const key = uuidv4()
      const approveId = uuidv4()
      const stakeId = uuidv4()

      const transactions = {}
      transactions[approveId] = {
        desc: `${t('Approve')} LP`,
        status: TXN_STATUS.START,
        hash: null,
      }
      transactions[stakeId] = {
        desc: `${t('Stake')} LP`,
        status: TXN_STATUS.START,
        hash: null,
      }

      startTxn({ key, transactions, title: 'Stake' })
      setPending(true)

      const isNewIchiStrategy = findNewIchiStrategy(vaultAddress) // if found => new Ichi strategies
      if (!isNewIchiStrategy) {
        errorToast('Error', 'Old Ichi strategies are not supported yet')
        setPending(false)
        return
      }

      const vaultContract = getIchiVaultContract(vaultAddress, 3)
      const farmingAddress = await readCall(vaultContract, 'farmingContract', [], networkId)
      const allowance = await readCall(vaultContract, 'allowance', [account, farmingAddress], networkId)
      const lpBalance = await readCall(vaultContract, 'balanceOf', [account], networkId)
      const isValidAmount = toWei(amount).lte(lpBalance)
      const amountToApprove = toWei(lpBalance).minus(allowance)

      if (!isValidAmount) {
        warnToast('Invalid Amount')
        setPending(false)
        return
      }

      if (amountToApprove.gt(0)) {
        if (!(await writeTxn(key, approveId, vaultContract, 'approve', [farmingAddress, maxUint256]))) {
          setPending(false)
          return
        }
      } else {
        updateTxn({ key, uuid: approveId, status: TXN_STATUS.SUCCESS })
      }

      // Stake LP
      const farmingContract = {
        address: farmingAddress,
        abi: IchiFarmingABI,
      }
      if (!(await writeTxn(key, stakeId, farmingContract, 'stake', [toWei(amount).toFixed(0), account]))) {
        setPending(false)
        return
      }

      endTxn({ key, final: 'Stake Liquidity Successful' })
      callback()
      setPending(false)
    },
    [account, endTxn, networkId, startTxn, t, updateTxn, writeTxn],
  )

  return { addIchiPool, stakeIchiPool, pending }
}

export const useMigrationIchi = () => {
  const t = useTranslations()

  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn, updateTxn, closeTxn, sendTxn } = useTxn()

  const migrateIchi = useCallback(
    async ({ positionV2, strategy, callback }) => {
      if (!positionV2 || !strategy) return

      const { address: vaultAddressV2, gauge, token0, token1 } = positionV2
      const { address: vaultAddressV3, allowed: depositToken, isFarming } = strategy

      const isNewIchiStrategy = findNewIchiStrategy(vaultAddressV3) // if found => new Ichi strategies
      if (!isNewIchiStrategy) {
        errorToast('Error', 'Old Ichi strategies are not supported yet')
        setPending(false)
        return false
      }

      const gaugeContract = getGaugeContract(gauge.address, networkId)
      const depositGuardContract = getVaultDepositContract(networkId, 3, isFarming)
      const vaultContractV2 = getIchiVaultContract(vaultAddressV2, 2)
      const vaultContractV3 = getIchiVaultContract(vaultAddressV3, 3)

      const key = uuidv4()
      const unstakedId = uuidv4()
      const removeId = uuidv4()
      const approveSwapId = uuidv4()
      const swapId = uuidv4()
      const approveId = uuidv4()
      const supplyId = uuidv4()
      const approveLPId = uuidv4()
      const stakeId = uuidv4()

      const stakedBalance = positionV2.account?.gaugeBalance
      const totalLp = positionV2.account?.totalLp
      const swapToken = depositToken.address === token0.address ? token1 : token0

      const slippage = 0.5

      const routerAddress = Contracts.odos[networkId]
      const swapTokenContract = getERC20Contract(swapToken.address, networkId)
      const allowanceSwap = await readCall(swapTokenContract, 'allowance', [account, routerAddress], networkId)

      const transactions = {}
      if (stakedBalance.gt(0)) {
        transactions[unstakedId] = {
          desc: `${t('Unstake')} V2`,
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      transactions[removeId] = {
        desc: `${t('Remove Liquidity')} V2`,
        status: TXN_STATUS.START,
        hash: null,
      }

      transactions[approveSwapId] = {
        desc: `${t('Approve')} ${swapToken.symbol}`,
        status: TXN_STATUS.START,
        hash: null,
      }

      transactions[swapId] = {
        desc: t('Swap [symbolA] for [symbolB]', { symbolA: swapToken.symbol, symbolB: depositToken.symbol }),
        status: TXN_STATUS.START,
        hash: null,
      }

      transactions[approveId] = {
        desc: `${t('Approve')} ${depositToken.symbol}`,
        status: TXN_STATUS.START,
        hash: null,
      }

      transactions[supplyId] = {
        desc: `${t('Deposit')} ${depositToken.symbol}`,
        status: TXN_STATUS.START,
        hash: null,
      }

      if (isFarming) {
        transactions[approveLPId] = {
          desc: `${t('Approve')} LP`,
          status: TXN_STATUS.START,
          hash: null,
        }
        transactions[stakeId] = {
          desc: `${t('Stake')} LP`,
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      startTxn({ key, transactions, title: 'Migrate' })
      setPending(true)

      // MARK: UNSTAKE AND WITHDRAW FROM V2
      if (stakedBalance.gt(0)) {
        if (!(await writeTxn(key, unstakedId, gaugeContract, 'withdrawAllAndHarvest', []))) {
          setPending(false)
          return
        }
      }

      const withdrawTx = await writeTxn(key, removeId, vaultContractV2, 'withdraw', [
        toWei(totalLp).toFixed(0),
        account,
      ])
      if (!withdrawTx) {
        setPending(false)
        return
      }
      const withdrawReceipt = await waitCall(withdrawTx)
      const events = withdrawReceipt.logs
      const transferEvent = events.filter(e => e.topics[0] === HASH.TRANSFER)
      const transferAmounts = transferEvent.reduce((acc, o) => {
        const decodeData = decodeEventLog({
          abi: erc20Abi,
          data: o.data,
          topics: o.topics,
        })

        const address = o.address.toLowerCase()
        if (!acc[address]) {
          acc[address] = 0n
        }
        acc[address] += decodeData.args.value

        return acc
      }, {})

      // MARK: APPROVE + SWAP BY ODOS
      const isApproved = BigNumber(allowanceSwap).gte(transferAmounts[swapToken.address])
      if (!isApproved) {
        const tx = await writeTxn(key, approveSwapId, swapTokenContract, 'approve', [routerAddress, maxUint256])
        if (!tx) {
          setPending(false)
          return
        }
      } else {
        updateTxn({ key, uuid: approveSwapId, status: TXN_STATUS.SUCCESS, hash: '' })
        setPending(false)
      }

      updateTxn({ key, uuid: swapId, status: TXN_STATUS.PENDING, hash: null })
      const quote = await fetchOdosQuote({
        inputAmount: transferAmounts[swapToken.address].toString(),
        inputToken: swapToken.address,
        outputToken: depositToken.address,
        networkId,
        account,
        slippage,
      })

      const { to, data, value } = await simulateOdosSwap(account, quote.pathId, () => {
        setPending(false)
      })
      const swapTx = await sendTxn(key, swapId, to, data, value)
      if (!swapTx) {
        setPending(false)
        return
      }

      const swapReceipt = await waitCall(swapTx)
      const swapEvent = swapReceipt.logs.filter(
        e => e.topics[0] === HASH.TRANSFER && e.address.toLowerCase() === depositToken.address.toLowerCase(),
      )
      const swapedAmount = swapEvent.reduce((sum, e) => {
        const decodeData = decodeEventLog({
          abi: erc20Abi,
          data: e.data,
          topics: e.topics,
        })
        sum += decodeData.args.value
        return sum
      }, 0n)

      // MARK: APPROVE + DEPOSIT TOKEN
      const depositAmount = swapedAmount + transferAmounts[depositToken.address]

      const tokenContract = getERC20Contract(depositToken.address, networkId)
      const allowance = await readCall(tokenContract, 'allowance', [account, depositGuardContract.address], networkId)
      const isStakeToApproved = BigNumber(allowance).gte(depositAmount)

      if (!isStakeToApproved) {
        if (!(await writeTxn(key, approveId, tokenContract, 'approve', [depositGuardContract.address, maxUint256]))) {
          setPending(false)
          return
        }
      } else {
        updateTxn({ key, uuid: approveId, status: TXN_STATUS.SUCCESS })
        setPending(false)
      }

      const vaultDeployerAddress = Contracts.vaultDeployer[networkId]
      let lpAmount = await simulateCall(
        depositGuardContract,
        'forwardDepositToICHIVault',
        [vaultAddressV3, vaultDeployerAddress, depositToken.address, depositAmount, '0', account],
        networkId,
      )
      lpAmount = new BigNumber(lpAmount)
        .times(Math.floor((100 - slippage) * 1000))
        .div(100000)
        .dp(0)
        .toString(10)

      if (isInvalidAmount(lpAmount)) {
        setPending(false)
        errorToast('Error', 'Deposit Not Allowed Description')
        closeTxn()
        return
      }

      if (
        !(await writeTxn(key, supplyId, depositGuardContract, 'forwardDepositToICHIVault', [
          vaultAddressV3,
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

      if (isFarming) {
        // MARK: APPROVE LP AND FARMING
        const farmingAddress = await readCall(vaultContractV3, 'farmingContract', [], networkId)
        const allowance1 = await readCall(vaultContractV3, 'allowance', [account, farmingAddress], networkId)
        const lpBalance = await readCall(vaultContractV3, 'balanceOf', [account], networkId)
        const amountLiquidityToApprove = toWei(lpBalance).minus(allowance1)

        if (amountLiquidityToApprove.gt(0)) {
          if (!(await writeTxn(key, approveLPId, vaultContractV3, 'approve', [farmingAddress, maxUint256]))) {
            setPending(false)
            return
          }
        } else {
          updateTxn({ key, uuid: approveLPId, status: TXN_STATUS.SUCCESS })
        }

        // Stake LP
        const farmingContract = {
          address: farmingAddress,
          abi: IchiFarmingABI,
        }
        if (!(await writeTxn(key, stakeId, farmingContract, 'stake', [lpBalance, account]))) {
          setPending(false)
          return
        }
      }

      callback()
      endTxn({ key, final: 'Migrate Successful' })
      setPending(false)
    },
    [networkId, account, t, startTxn, writeTxn, sendTxn, endTxn, updateTxn, closeTxn],
  )

  return { migrateIchi, pending }
}

// for ich V2 withdraw
export const useIchiWithdraw = () => {
  const t = useTranslations()

  const [pending, setPending] = useState(false)
  const { account } = useWallet()
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const withdrawIchi = useCallback(
    async ({ positionV2, callback }) => {
      if (!positionV2) return

      const { address: vaultAddressV2, gauge } = positionV2
      const gaugeContract = getGaugeContract(gauge.address, networkId)
      const vaultContractV2 = getIchiVaultContract(vaultAddressV2, 2)

      const key = uuidv4()
      const unstakedId = uuidv4()
      const removeId = uuidv4()

      const stakedBalance = positionV2.account?.gaugeBalance
      const totalLp = positionV2.account?.totalLp

      const transactions = {}
      if (stakedBalance.gt(0)) {
        transactions[unstakedId] = {
          desc: t('Unstake'),
          status: TXN_STATUS.START,
          hash: null,
        }
      }

      transactions[removeId] = {
        desc: t('Remove Liquidity'),
        status: TXN_STATUS.START,
        hash: null,
      }

      startTxn({ key, transactions, title: 'Withdraw' })
      setPending(true)

      if (stakedBalance.gt(0)) {
        if (!(await writeTxn(key, unstakedId, gaugeContract, 'withdrawAllAndHarvest', []))) {
          setPending(false)
          return
        }
      }

      const withdrawTx = await writeTxn(key, removeId, vaultContractV2, 'withdraw', [
        toWei(totalLp).toFixed(0),
        account,
      ])
      if (!withdrawTx) {
        setPending(false)
        return
      }

      callback()
      endTxn({ key, final: 'Withdraw Successfully' })
      setPending(false)
    },
    [account, endTxn, networkId, startTxn, t, writeTxn],
  )

  return { withdrawIchi, pending }
}

export const useIchiClaim = () => {
  const t = useTranslations()

  const [pending, setPending] = useState(false)
  const { networkId } = useChainSettings()
  const { startTxn, endTxn, writeTxn } = useTxn()

  const onIchiClaim = useCallback(
    async pool => {
      const key = uuidv4()
      const claimId = uuidv4()
      startTxn({
        key,
        title: t('Harvest Rewards'),
        transactions: {
          [claimId]: {
            desc: t('Harvest Rewards'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      setPending(true)
      const ichiVault = getIchiVaultContract(pool.address, pool.account?.version)

      // Use hardcoded farming contract address from FARM_CONFIG for Ichi farming pools
      // The vault contract's farmingContract will be set to 0, so we can't read it
      const oldFarm = FARM_CONFIG.find(config => config.pool.toLowerCase() === pool.address.toLowerCase())

      // some pools are back new Ichi strategies, so we need to find the new farming contract address
      const newFarm = findNewIchiStrategy(pool.address)
      if (!oldFarm && !newFarm) {
        errorToast('Error', 'Farming contract not found for this pool')
        setPending(false)
        return
      }

      let farmContractAddress
      if (oldFarm) {
        farmContractAddress = oldFarm.farming
      } else {
        farmContractAddress = await readCall(ichiVault, 'farmingContract', [], networkId)
      }

      const multiFeeDistributionContract = getMultiFeeDistributionContract(farmContractAddress, networkId)
      if (!(await writeTxn(key, claimId, multiFeeDistributionContract, 'getAllRewards', []))) {
        setPending(false)
        return
      }

      // callback()
      endTxn({ key, final: 'Harvest Successful' })
      setPending(false)
    },
    [startTxn, writeTxn, endTxn, networkId, t],
  )

  return { onIchiClaim, pending }
}
