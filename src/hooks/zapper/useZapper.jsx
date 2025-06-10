import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import { WBNB } from 'thena-sdk-core'
import { nearestUsableTick, TICK_SPACING, TickMath } from 'thenafi-fusion-sdk'
import { v4 as uuidv4 } from 'uuid'
import { getAddress, maxUint256 } from 'viem'

import { PAIR_TYPES, TXN_STATUS } from '@/constant'
import { gammaZapAbi, vammZapAbi } from '@/constant/abi'
import Contracts from '@/constant/contracts'
import { readCall, waitCall } from '@/lib/contractActions'
import {
  getERC20Contract,
  getFarmingCenterContract,
  getGaugeContract,
  getIncentiveContract,
  getPositionManagerContract,
  getWBNBContract,
} from '@/lib/contracts'
import { NonfungiblePositionManager } from '@/lib/fusion/entities/nonfungiblePositionManager'
import { fromWei, toWei, wrappedAddress } from '@/lib/utils'
import { Presets } from '@/state/fusion/reducer'
import { tryParseTick } from '@/state/fusion/utils'
import { useTxn } from '@/state/transactions/hooks'

import useWallet from '../useWallet'

const BASE_ZAPPER_URL = 'https://zap-api.kyberswap.com/bsc/api/v1'

// https://zap-api.kyberswap.com/bsc/api/v1/in/route?
// dex=DEX_THENAALGEBRAINTEGRAL&
// pool.id=0x9ea0f51fd2133d995cf00229bc523737415ad318&
// position.tickLower=-64200&
// position.tickUpper=64800&
// tokensIn=0x55d398326f99059ff775485246999027b3197955&
// amountsIn=10000000000000000000000&
// slippage=100

export const useGetZapInRoutePerRange = ({
  pool,
  poolId,
  tickSpacing,
  tokenIn,
  amountIn,
  slippage = 100,
  presetRanges,
}) => {
  const [token0, token1, poolPrice] = useMemo(
    () => [pool?.token0, pool?.token1, pool?._token0Price?.toSignificant(5)],
    [pool],
  )

  return useQuery({
    queryKey: ['zapInRoutePerRange', pool, poolId, tokenIn, amountIn, slippage],
    queryFn: async () => {
      const results = {}
      for (const range of presetRanges) {
        const { title, min, max } = range

        const amount = toWei(
          new BigNumber(amountIn).decimalPlaces(tokenIn.decimals, BigNumber.ROUND_DOWN).toString(),
          tokenIn.decimals,
        )
        const tickLower =
          title === Presets.FULL
            ? nearestUsableTick(TickMath.MIN_TICK, tickSpacing ?? TICK_SPACING)
            : tryParseTick(token0, token1, 3000, (Number(poolPrice) * min).toString())
        const tickUpper =
          title === Presets.FULL
            ? nearestUsableTick(TickMath.MAX_TICK, tickSpacing ?? TICK_SPACING)
            : tryParseTick(token0, token1, 3000, (Number(poolPrice) * max).toString())

        const params = {
          dex: 'DEX_THENAALGEBRAINTEGRAL',
          'pool.id': getAddress(poolId),
          'position.tickLower': tickLower,
          'position.tickUpper': tickUpper,
          tokenIn: getAddress(wrappedAddress(tokenIn)),
          amountIn: amount,
          slippage,
        }

        const response = await axios.get(`${BASE_ZAPPER_URL}/in/route`, {
          params,
          headers: {
            'X-Client-Id': 'thenakyberid',
          },
        })
        results[title] = response.data?.data
      }
      return results
    },
    enabled: Boolean(pool && tokenIn && presetRanges?.length > 0),
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  })
}

export const useGetZapInRoute = ({ tickLower, tickUpper, poolId, tokenIn, amountIn, slippage = 100 }) =>
  useQuery({
    queryKey: ['zapInRoute', tickLower, tickUpper, poolId, tokenIn, amountIn, slippage],
    queryFn: async () => {
      const amount = toWei(
        new BigNumber(amountIn).decimalPlaces(tokenIn.decimals, BigNumber.ROUND_DOWN).toString(),
        tokenIn.decimals,
      )

      const params = {
        dex: 'DEX_THENAALGEBRAINTEGRAL',
        'pool.id': getAddress(poolId),
        'position.tickLower': tickLower,
        'position.tickUpper': tickUpper,
        tokenIn: getAddress(wrappedAddress(tokenIn)),
        amountIn: amount,
        slippage,
      }

      const response = await axios.get(`${BASE_ZAPPER_URL}/in/route`, {
        params,
        headers: {
          headers: {
            'X-Client-Id': 'thenakyberid',
          },
        },
      })
      return response.data?.data
    },
    enabled: Boolean(!!poolId && !!tickLower && !!tickUpper && !!tokenIn && !!amountIn),
  })

export const useZapperAddLiquidity = () => {
  const t = useTranslations()
  const { startTxn, writeTxn, endTxn, sendTxn } = useTxn()

  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()

  const handleAddLiquidity = useCallback(
    async ({ token, amount, mintInfo, route, deadline = 1800000000, isFarming = false }, callback) => {
      try {
        if (!account) throw new Error('Please connect your wallet')

        const isBNB = token.address === 'BNB'
        if (isBNB) token = WBNB[chainId]

        const amountIn = toWei(
          new BigNumber(amount).decimalPlaces(token.decimals, BigNumber.ROUND_DOWN).toString(),
          token.decimals,
        )

        const key = uuidv4()
        const wrapId = uuidv4()
        const approveId = uuidv4()
        const addLiquidityId = uuidv4()
        const approveNft = uuidv4()
        const stakeId = uuidv4()

        const transactions = {}

        let buildData = {
          routerAddress: null,
          callData: null,
          value: null,
        }

        try {
          const response = await axios.post(
            `${BASE_ZAPPER_URL}/in/route/build`,
            {
              sender: getAddress(account),
              route,
              deadline,
              source: 'zap-docs',
            },
            {
              headers: {
                'x-client-id': 'zap-docs',
              },
            },
          )

          buildData = response.data.data
        } catch (error) {
          return
        }

        const tokenContract = getERC20Contract(token.address, chainId)
        const allowance = await readCall(tokenContract, 'allowance', [account, buildData.routerAddress])
        const isApproved = fromWei(allowance, token.decimals).gte(amount)

        if (isBNB) {
          transactions[wrapId] = {
            desc: 'Wrap BNB',
            status: TXN_STATUS.START,
            hash: null,
          }
        }

        if (!isApproved) {
          transactions[approveId] = {
            desc: `Approving ${token.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          }
        }

        transactions[addLiquidityId] = {
          desc: t(mintInfo.noLiquidity ? 'Create pool and add liquidity' : 'Add Liquidity'),
          status: TXN_STATUS.START,
          hash: null,
        }

        if (isFarming) {
          transactions[approveNft] = {
            desc: `${t('Approve')} LP`,
            status: TXN_STATUS.START,
            hash: null,
          }

          transactions[stakeId] = {
            desc: t('Earn $THE'),
            status: TXN_STATUS.START,
            hash: null,
          }
        }

        startTxn({ key, transactions, title: t('Add Liquidity') })
        setPending(true)

        if (isBNB) {
          const wbnb = getWBNBContract(chainId)
          if (!(await writeTxn(key, wrapId, wbnb, 'deposit', [], amountIn))) {
            setPending(false)
            return
          }
        }

        // MARK: APPROVE TOKENS
        setPending(true)
        if (!isApproved) {
          if (!(await writeTxn(key, approveId, tokenContract, 'approve', [buildData.routerAddress, amountIn]))) {
            setPending(false)
            return
          }
        }

        // MARK: ADD LIQUIDITY
        const hash = await sendTxn(key, addLiquidityId, buildData.routerAddress, buildData.callData, buildData.value)
        const addTxRecieve = await waitCall(hash)

        if (isFarming) {
          const farmingCenter = getFarmingCenterContract(chainId)
          const incentiveMaker = getIncentiveContract(chainId)
          const positionManger = getPositionManagerContract(chainId, 3)

          // MARK: APPROVE LP TOKEN FOR FARMING
          const decodeData = NonfungiblePositionManager.getMintedPosition(addTxRecieve, chainId)
          const nftId = decodeData.args?.tokenId
          const poolAddress = decodeData.args?.pool

          if (
            !(await writeTxn(key, approveNft, positionManger, 'approveForFarming', [
              nftId,
              true,
              farmingCenter.address,
            ]))
          ) {
            setPending(false)
            return
          }

          // MARK: STAKE LP TOKEN FOR FARMING
          const poolKey = await readCall(incentiveMaker, 'poolToKey', [poolAddress], chainId)
          if (!(await writeTxn(key, stakeId, farmingCenter, 'enterFarming', [poolKey, nftId]))) {
            setPending(false)
            return
          }
        }

        endTxn({ key, final: 'Liquidity Add Successful' })
        setPending(false)
        if (callback) callback()
      } catch (e) {
        setPending(false)
        throw e
      }
    },
    [account, t, startTxn, chainId, sendTxn, endTxn, writeTxn],
  )

  return { handleAddLiquidity, pending }
}

export const useV1Zapper = () => {
  const t = useTranslations()
  const { startTxn, writeTxn, endTxn, updateTxn } = useTxn()

  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()

  /*
   * @Param tokenDeposit: Token to deposit (WETH, BNB, USDT...)
   * @Param tokenIn:      Token in the Pair (must have in case of deposit token that is not in Pair)
   * @Param odosParams:   Amount to deposit (must have in case of deposit token that is not in Pair)
   * */
  const onAddLiquidity = useCallback(
    async (
      { tokenDeposit, tokenIn, amount, gaugeAddress, pairAddress, zapSwapSlippage, odosParams, type },
      callback,
    ) => {
      try {
        if (!account) {
          throw new Error('Please connect your wallet')
        }

        const zapAddress = type === PAIR_TYPES.CLASSIC ? Contracts.classicZap[chainId] : Contracts.stableZap[chainId]
        const key = uuidv4()
        const approveId = uuidv4()
        const wrapId = uuidv4()
        const addLiquidityId = uuidv4()
        const approveStakeId = uuidv4()
        const stakeId = uuidv4()
        const transactions = {}

        const _tokenDeposit = tokenDeposit.address === 'BNB' ? WBNB[chainId] : tokenDeposit

        const tokenContract = getERC20Contract(_tokenDeposit.address, chainId)
        const allowance = await readCall(tokenContract, 'allowance', [account, zapAddress])

        const amountIn = toWei(
          new BigNumber(amount).decimalPlaces(_tokenDeposit.decimals, BigNumber.ROUND_DOWN).toString(),
          _tokenDeposit.decimals,
        )
        const amountToApprove = amountIn.minus(allowance)

        if (tokenDeposit.address === 'BNB') {
          transactions[wrapId] = {
            desc: 'Wrap BNB',
            status: TXN_STATUS.START,
            hash: null,
          }
        }

        if (amountToApprove.gt(0)) {
          transactions[approveId] = {
            desc: `Approving ${tokenDeposit.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          }
        }

        transactions[addLiquidityId] = {
          desc: 'Add Liquidity',
          status: TXN_STATUS.START,
          hash: null,
        }

        if (gaugeAddress) {
          transactions[approveStakeId] = {
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

        startTxn({ key, transactions, title: t('Add Liquidity') })
        setPending(true)

        if (tokenDeposit.address === 'BNB') {
          const wbnb = getWBNBContract(chainId)
          if (!(await writeTxn(key, wrapId, wbnb, 'deposit', [], amountIn))) {
            setPending(false)
            return
          }
        }

        // MARK: APPROVE TOKENS
        setPending(true)
        if (amountToApprove.gt(0)) {
          if (!(await writeTxn(key, approveId, tokenContract, 'approve', [zapAddress, amountIn]))) {
            setPending(false)
            return
          }
        }

        // MARK: ADD LIQUIDITY
        let txhash = null
        if (odosParams) {
          txhash = await writeTxn(
            key,
            addLiquidityId,
            {
              address: zapAddress,
              abi: vammZapAbi,
            },
            'zapInOdos',
            [tokenIn.address, zapSwapSlippage, pairAddress, ...odosParams],
          )
        } else {
          txhash = await writeTxn(
            key,
            addLiquidityId,
            {
              address: zapAddress,
              abi: vammZapAbi,
            },
            'zapIn',
            [_tokenDeposit.address, amountIn, zapSwapSlippage, pairAddress],
          )
        }

        if (!txhash) {
          setPending(false)
          return
        }

        // MARK: ADD LIQUIDITY
        if (gaugeAddress) {
          const lpContract = getERC20Contract(pairAddress, chainId)
          const allowanceLp = await readCall(lpContract, 'allowance', [account, gaugeAddress], chainId)
          const lpBalance = await readCall(lpContract, 'balanceOf', [account], chainId)
          const isLpApproved = fromWei(allowanceLp).gte(lpBalance)

          if (isLpApproved) {
            updateTxn({ key, uuid: approveStakeId, status: TXN_STATUS.SUCCESS })
          } else if (!(await writeTxn(key, approveStakeId, lpContract, 'approve', [gaugeAddress, maxUint256]))) {
            setPending(false)
            return
          }

          const gaugeContract = getGaugeContract(gaugeAddress, chainId)
          if (!(await writeTxn(key, stakeId, gaugeContract, 'deposit', [lpBalance]))) {
            setPending(false)
            return
          }
        }

        endTxn({ key, final: 'Liquidity Add Successful' })
        setPending(false)
        if (callback) callback()
      } catch (e) {
        setPending(false)
        throw e
      }
    },
    [account, chainId, startTxn, t, writeTxn, endTxn, updateTxn],
  )

  return { onAddLiquidity, pending }
}

export const useGammaZapper = () => {
  const t = useTranslations()
  const { startTxn, writeTxn, endTxn } = useTxn()

  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()

  /*
   * @Param tokenDeposit: Token to deposit (WETH, BNB, USDT...)
   * @Param tokenIn:      Token in the Pair (must have in case of deposit token that is not in Pair)
   * @Param odosParams:   Amount to deposit (must have in case of deposit token that is not in Pair)
   * */
  const onAddLiquidity = useCallback(
    async ({ tokenDeposit, tokenIn, amount, pairAddress, zapSwapSlippage, gammaSlippage, odosParams }, callback) => {
      try {
        if (!account) {
          throw new Error('Please connect your wallet')
        }

        const zapAddress = Contracts.gammaZap[chainId]
        const wrapId = uuidv4()
        const key = uuidv4()
        const approveId = uuidv4()
        const addLiquidityId = uuidv4()
        const transactions = {}

        const _tokenDeposit = tokenDeposit.address === 'BNB' ? WBNB[chainId] : tokenDeposit
        const tokenContract = getERC20Contract(_tokenDeposit.address, chainId)

        const amountIn = toWei(
          new BigNumber(amount).decimalPlaces(_tokenDeposit.decimals, BigNumber.ROUND_DOWN).toString(),
          _tokenDeposit.decimals,
        )

        const allowance = await readCall(tokenContract, 'allowance', [account, zapAddress])
        const amountToApprove = amountIn.minus(allowance)

        if (tokenDeposit.address === 'BNB') {
          transactions[wrapId] = {
            desc: 'Wrap BNB',
            status: TXN_STATUS.START,
            hash: null,
          }
        }

        if (amountToApprove.gt(0)) {
          transactions[approveId] = {
            desc: `Approving ${tokenDeposit.symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          }
        }

        transactions[addLiquidityId] = {
          desc: 'Add Liquidity',
          status: TXN_STATUS.START,
          hash: null,
        }

        startTxn({ key, transactions, title: t('Add Liquidity') })
        setPending(true)

        if (tokenDeposit.address === 'BNB') {
          const wbnb = getWBNBContract(chainId)
          if (!(await writeTxn(key, wrapId, wbnb, 'deposit', [], amountIn))) {
            setPending(false)
            return
          }
        }

        // MARK: APPROVE TOKENS
        setPending(true)
        if (amountToApprove.gt(0)) {
          if (!(await writeTxn(key, approveId, tokenContract, 'approve', [zapAddress, amountIn]))) {
            setPending(false)
            return
          }
        }

        // MARK: ADD LIQUIDITY
        let txhash = null
        if (odosParams) {
          txhash = await writeTxn(
            key,
            addLiquidityId,
            {
              address: zapAddress,
              abi: gammaZapAbi,
            },
            'zapInOdos',
            [tokenIn.address, zapSwapSlippage, pairAddress, ...odosParams, gammaSlippage, true],
          )
        } else {
          txhash = await writeTxn(
            key,
            addLiquidityId,
            {
              address: zapAddress,
              abi: gammaZapAbi,
            },
            'zapIn',
            [_tokenDeposit.address, amountIn, zapSwapSlippage, pairAddress, gammaSlippage, true],
          )
        }

        if (!txhash) {
          setPending(false)
          return
        }

        endTxn({ key, final: 'Liquidity Add Successful' })
        setPending(false)
        if (callback) callback()
      } catch (e) {
        setPending(false)
        throw e
      }
    },
    [account, chainId, startTxn, t, endTxn, writeTxn],
  )

  return { onAddLiquidity, pending }
}
