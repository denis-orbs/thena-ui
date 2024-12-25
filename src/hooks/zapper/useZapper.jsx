import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getAddress, maxUint256 } from 'viem'

import { TXN_STATUS } from '@/constant'
import { readCall, waitCall } from '@/lib/contractActions'
import {
  getERC20Contract,
  getFarmingCenterContract,
  getInsentiveContract,
  getPositionManagerContract,
} from '@/lib/contracts'
import { NonfungiblePositionManager } from '@/lib/fusion/entities/nonfungiblePositionManager'
import { fromWei, toWei } from '@/lib/utils'
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

export const useGetZapInRoute = ({ tickLower, tickUpper, poolId, tokenIn, amountIn, slippage = 100 }) =>
  useQuery({
    queryKey: ['zapInRoute', tickLower, tickUpper, poolId, tokenIn, amountIn, slippage],
    queryFn: async () => {
      const amount = toWei(
        new BigNumber(amountIn).decimalPlaces(tokenIn.decimals, BigNumber.ROUND_DOWN).toString(),
        tokenIn.decimals,
      )

      // TODO: replace with pool address
      const params = {
        dex: 'DEX_THENAALGEBRAINTEGRAL',
        'pool.id': '0x9ea0f51fd2133d995cf00229bc523737415ad318',
        'position.tickLower': tickLower,
        'position.tickUpper': tickUpper,
        tokenIn: tokenIn.address,
        amountIn: amount,
        slippage,
      }

      const response = await axios.get(`${BASE_ZAPPER_URL}/in/route`, {
        params,
      })
      return response.data?.data
    },
    enabled: Boolean(!!poolId && !!tickLower && !!tickUpper && !!tokenIn && !!amountIn),
  })

export const useBuildZapInRoute = () =>
  useMutation({
    mutationFn: async ({ route, sender, recipient, deadline }) => {
      const response = await axios.post(`${BASE_ZAPPER_URL}/in/route/build`, {
        body: {
          sender,
          recipient,
          route,
          deadline,
          source: 'zap-docs',
        },
      })
      return response.data
    },
  })

export const useZapperAddLiquidity = () => {
  const t = useTranslations()
  const { startTxn, writeTxn, endTxn, sendTxn } = useTxn()

  const [pending, setPending] = useState(false)
  const { account, chainId } = useWallet()

  const handleAddLiquidity = useCallback(
    async ({ token, amount, mintInfo, route, deadline = 1800000000, isFarming = false }) => {
      try {
        if (!account) {
          throw new Error('Please connect your wallet')
        }

        const key = uuidv4()
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

        let isApproved = false
        const tokenContract = getERC20Contract(token.address, chainId)
        if (token.address !== 'BNB') {
          const allowance = await readCall(tokenContract, 'allowance', [account, buildData.routerAddress])
          isApproved = fromWei(allowance, token.decimals).gte(amount)
        }

        if (token.address !== 'BNB' && !isApproved) {
          transactions[approveId] = {
            desc: 'Approving token',
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
            desc: `${t('Stake')} LP`,
            status: TXN_STATUS.START,
            hash: null,
          }
        }

        startTxn({ key, transactions, title: t('Add Liquidity') })
        setPending(true)

        // MARK: APPROVE TOKENS
        setPending(true)
        if (!isApproved) {
          if (!(await writeTxn(key, approveId, tokenContract, 'approve', [buildData.routerAddress, maxUint256]))) {
            setPending(false)
            return
          }
        }

        // MARK: ADD LIQUIDITY
        const hash = sendTxn(key, addLiquidityId, buildData.routerAddress, buildData.callData, buildData.value)
        const addTxRecieve = await waitCall(hash)

        if (isFarming) {
          const farmingCenter = getFarmingCenterContract(chainId)
          const incentiveMaker = getInsentiveContract(chainId)
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
      } catch (e) {
        setPending(false)
        throw e
      }
    },
    [account, t, startTxn, chainId, sendTxn, endTxn, writeTxn],
  )

  return { handleAddLiquidity, pending }
}
