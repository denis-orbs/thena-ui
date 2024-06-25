import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import { encodeFunctionData, maxUint256 } from 'viem'

import { TC_MARKET_TYPES, TXN_STATUS } from '@/constant'
import { readCall } from '@/lib/contractActions'
import { getERC20Contract, getMultiAccountContract, getTcPerpetualContract } from '@/lib/contracts'
import { fromWei, isInvalidAmount } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useTxn } from '@/state/transactions/hooks'

export const useTCPerpetualInfor = (tcAddress, type = TC_MARKET_TYPES.PERPETUAL) => {
  const [loaded, setLoaded] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isWinner, setIsWinner] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [balance, setBalance] = useState(0)
  const [isWithdrawable, setIsWithdrawable] = useState(false)
  const [tradingCompetition, setTradingCompetition] = useState(undefined)
  const [withdrawCooldown, setWithdrawCooldown] = useState(0)

  const { account } = useWallet()

  const getUserData = useCallback(async () => {
    setLoaded(false)

    if (tcAddress) {
      if (!account || type !== TC_MARKET_TYPES.PERPETUAL) {
        setIsRegistered(false)
        setIsWinner(false)
        setIsOwner(false)
        setLoaded(true)

        return
      }
      const tcPerpetualContract = getTcPerpetualContract(tcAddress)

      try {
        const res0 = await readCall(tcPerpetualContract, 'isRegistered', [account])
        if (res0) {
          setIsRegistered(true)
        }
      } catch (error) {
        setIsRegistered(false)
      }

      let res1
      try {
        res1 = await readCall(tcPerpetualContract, 'tradingCompetition', [])
        setTradingCompetition(res1)
        if (res1 && String(res1.owner).toLowerCase() === account.toLowerCase()) {
          setIsOwner(true)
        }
      } catch (error) {
        setTradingCompetition(undefined)
        setIsOwner(false)
      }

      setLoaded(true)
    }
  }, [account, tcAddress, type])

  const checkWithdrawableTCPerp = useCallback(async () => {
    if (type === TC_MARKET_TYPES.PERPETUAL) {
      if (tradingCompetition) {
        const isTcEnded = Number(tradingCompetition.timestamp.endTimestamp) < dayjs().unix()
        if (isTcEnded) {
          const tcPerpetualContract = getTcPerpetualContract(tcAddress)
          let bal = 0
          try {
            bal = await readCall(tcPerpetualContract, 'getBalanceOfUser', [account])
            if (!bal) {
              const multiAccountContract = getMultiAccountContract()
              const symmioAccount = await readCall(tcPerpetualContract, 'getAccountOf', [account])
              bal = await readCall(multiAccountContract, 'balanceOf', [symmioAccount])
            }
            setBalance(new BigNumber(bal).toNumber())
          } catch (error) {
            setBalance(0)
          }

          if (bal > 0) {
            setIsWithdrawable(true)
          } else {
            setIsWithdrawable(false)
          }
        }
      }
    }
  }, [account, tcAddress, tradingCompetition, type])

  const getWithdrawCooldown = useCallback(async () => {
    try {
      const tcPerpContract = getTcPerpetualContract(tcAddress)
      const symmioAccount = await readCall(tcPerpContract, 'getAccountOf', [account])
      if (!symmioAccount) return
      const multiAccountContract = getMultiAccountContract()
      const res = await readCall(multiAccountContract, 'withdrawCooldownOf', [symmioAccount])
      setWithdrawCooldown(new BigNumber(res).toNumber())
    } catch (error) {
      setWithdrawCooldown(0)
    }
  }, [account, tcAddress])

  useEffect(() => {
    getUserData()
  }, [getUserData])

  useEffect(() => {
    checkWithdrawableTCPerp()
  }, [checkWithdrawableTCPerp])

  useEffect(() => {
    getWithdrawCooldown()
  }, [getWithdrawCooldown])

  return {
    loaded,
    isRegistered,
    isWinner,
    isOwner,
    refetch: getUserData,
    balance,
    isWithdrawable,
    checkWithdrawableTCPerp,
    withdrawCooldown,
    getWithdrawCooldown,
  }
}

export const useJoinTCPerpetual = () => {
  const { startTxn, endTxn, writeTxn, closeTxnModal } = useTxn()
  const { account, chainId } = useWallet()
  const t = useTranslations()
  const [pending, setPending] = useState(false)

  const joinTCPerpetual = useCallback(
    async (data, name) => {
      const key = uuidv4()
      const joinuuid = uuidv4()
      const tcPerpetualContract = getTcPerpetualContract(data.tcAddress)
      const winningTokenContract = getERC20Contract(data.competitionRules.winningToken.address, chainId)

      const tokens = {
        [data.competitionRules.winningToken.address]: {
          amount: fromWei(data.competitionRules.startingBalance),
          decimals: 18,
          symbol: data.competitionRules.winningToken.symbol,
          contract: winningTokenContract,
        },
      }
      const transactions = {}

      for (let i = 0; i < data.entryFeeUpdate.length; i++) {
        if (!isInvalidAmount(data.entryFeeUpdate[i])) {
          if (tokens[data.prizeUpdate.token[i].address]) {
            const feeAmount = fromWei(data.entryFeeUpdate[i], data.prizeUpdate.token[i].decimals).plus(
              tokens[data.prizeUpdate.token[i].address].amount,
            )
            tokens[data.prizeUpdate.token[i].address].amount = feeAmount
          } else {
            const feeTokenContract = getERC20Contract(data.prizeUpdate.token[i].address, chainId)
            tokens[data.prizeUpdate.token[i].address] = {
              amount: fromWei(data.entryFeeUpdate[i], data.prizeUpdate.token[i].decimals),
              decimals: data.prizeUpdate.token[i].decimals,
              symbol: data.prizeUpdate.token[i].symbol,
              contract: feeTokenContract,
            }
          }
        }
      }

      for (let i = 0; i < Object.keys(tokens).length; i++) {
        const address = Object.keys(tokens)[i]
        const approveFeeuuid = uuidv4()
        const allowance = await readCall(tokens[address].contract, 'allowance', [account, data.tcAddress])

        const isApprovedFee = fromWei(allowance, tokens[address].decimals).gte(
          tokens[address].amount,
          tokens[address].decimals,
        )

        if (!isApprovedFee) {
          tokens[address].id = approveFeeuuid
          transactions[approveFeeuuid] = {
            desc: `${t('Approve')} ${tokens[address].symbol}`,
            status: TXN_STATUS.START,
            hash: null,
          }
        }
      }
      transactions[joinuuid] = {
        desc: t('Join Competition'),
        status: TXN_STATUS.START,
        hash: null,
      }
      setPending(true)
      startTxn({
        key,
        title: t('Join Competition'),
        transactions,
      })
      for (let i = 0; i < Object.keys(tokens).length; i++) {
        const address = Object.keys(tokens)[i]
        if (tokens[address].id) {
          const isSuccess = await writeTxn(key, tokens[address].id, tokens[address].contract, 'approve', [
            data.tcAddress,
            maxUint256,
          ])

          if (!isSuccess) {
            setPending(false)
            return false
          }
        }
      }

      const isSuccess = await writeTxn(key, joinuuid, tcPerpetualContract, 'addAccount', [name])
      if (!isSuccess) {
        setPending(false)
        return false
      }

      endTxn({
        key,
        final: 'Join TC Successful',
      })
      setPending(false)
      closeTxnModal()
      return true
    },
    [account, chainId, closeTxnModal, endTxn, startTxn, t, writeTxn],
  )

  return {
    pending,
    joinTCPerpetual,
  }
}

export const useDepositToTCPerp = () => {
  const { startTxn, endTxn, writeTxn, closeTxn } = useTxn()
  const { account, chainId } = useWallet()
  const t = useTranslations()
  const [pending, setPending] = useState(false)

  const deposit = useCallback(
    async data => {
      const key = uuidv4()
      const approveTokenuuid = uuidv4()
      const deposituuid = uuidv4()
      const tcPerpetualContract = getTcPerpetualContract(data.tcAddress)

      const winningTokenContract = getERC20Contract(data.winningToken.address, chainId)
      const allowance = await readCall(winningTokenContract, 'allowance', [account, data.tcAddress])
      const isApprovedWinningToken = fromWei(allowance).gte(fromWei(data.amount))
      const getAccountOf = await readCall(tcPerpetualContract, 'getAccountOf', [account])
      setPending(true)
      startTxn({
        key,
        title: `${t('Deposit')}`,
        transactions: {
          ...(!isApprovedWinningToken && {
            [approveTokenuuid]: {
              desc: `${t('Approve')} USDT`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [deposituuid]: {
            desc: t('Deposit'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      if (!isApprovedWinningToken) {
        const isSuccess = await writeTxn(key, approveTokenuuid, winningTokenContract, 'approve', [
          data.tcAddress,
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      const isSuccess = await writeTxn(key, deposituuid, tcPerpetualContract, 'depositAndAllocateForAccount', [
        getAccountOf,
        data.amount,
      ])
      if (!isSuccess) {
        setPending(false)
        closeTxn()
        return false
      }

      endTxn({
        key,
        final: 'Deposit Successful',
      })
      setPending(false)
      return true
    },
    [account, chainId, closeTxn, endTxn, startTxn, t, writeTxn],
  )

  return { pending, deposit }
}

export const useWithdrawToTCPerp = () => {
  const { startTxn, endTxn, writeTxn, closeTxn, closeTxnModal } = useTxn()
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const { account } = useWallet()

  const withdrawTCPerp = useCallback(
    async ({ tcAddress, amount }) => {
      const key = uuidv4()
      const withdrawuuid = uuidv4()
      const tcPerpContract = getTcPerpetualContract(tcAddress)

      const symmioAccount = await readCall(tcPerpContract, 'getAccountOf', [account])

      if (!symmioAccount) {
        return
      }

      setLoading(true)
      startTxn({
        key,
        title: t('Withdraw Deposit'),
        transactions: {
          [withdrawuuid]: {
            desc: t('Withdraw Deposit'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      const isSuccess = await writeTxn(key, withdrawuuid, tcPerpContract, 'withdrawFromAccount', [
        symmioAccount,
        amount,
      ])
      if (!isSuccess) {
        setLoading(false)
        closeTxn()
        return false
      }
      endTxn({
        key,
        final: 'Withdraw Successful',
      })
      setLoading(false)
      closeTxnModal()
      return true
    },
    [account, closeTxn, closeTxnModal, endTxn, startTxn, t, writeTxn],
  )

  return { loading, withdrawTCPerp }
}

export const MUON_BSC_URLS = ['https://crypto-v3-shield.deus.finance/v1/', 'https://crypto-v3-shield2.deus.finance/v1/']

export const APP_NAME = 'symmio'

function getRequestParams(account, chainId, contractAddress) {
  if (!account) return new Error('Param `account` is missing.')
  if (!chainId) return new Error('Param `chainId` is missing.')
  if (!contractAddress) return new Error('Param `contractAddress` is missing.')

  return [
    ['partyA', account],
    ['chainId', chainId.toString()],
    ['symmio', contractAddress],
  ]
}

export const useDeallocateTCPerp = () => {
  const { startTxn, endTxn, sendTxn } = useTxn()
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const { account, chainId } = useWallet()

  const deallocate = useCallback(
    async (tcAddress, balance) => {
      setLoading(true)
      const multiAccountContract = getMultiAccountContract()
      const tcPerpContract = getTcPerpetualContract(tcAddress)

      const symmioAccount = await readCall(tcPerpContract, 'getAccountOf', [account])

      if (!symmioAccount) {
        return
      }

      const toastId = toast.loading('requesting data from Muon...', {
        autoClose: 5000,
        closeButton: true,
      })
      let result
      let success
      const requestParams = getRequestParams(symmioAccount, chainId, multiAccountContract.address)

      if (requestParams instanceof Error) throw new Error(requestParams.message)

      for (const url of MUON_BSC_URLS) {
        try {
          const MuonURL = new URL(url)
          MuonURL.searchParams.set('app', 'symmio')
          MuonURL.searchParams.append('method', 'uPnl_A')
          requestParams.forEach(param => {
            MuonURL.searchParams.append(`params[${param[0]}]`, param[1])
          })

          let response = await fetch(MuonURL)
          if (response.ok) {
            response = await response.json()
          } else {
            throw new Error(response.statusText)
          }
          result = response.result
          success = response.success

          break // Exit the loop if successful
        } catch (error) {
          console.log('Retrying with the next URL...')
          toast.update(toastId, {
            autoClose: 5000,
            closeButton: true,
            render: 'request failed',
            isLoading: false,
            type: 'error',
          })
        }
      }

      if (!success) {
        throw new Error('')
      }

      toast.update(toastId, {
        autoClose: 5000,
        closeButton: true,
        render: 'Muon responded',
        isLoading: false,
        type: 'success',
      })

      const { reqId } = result
      const timestamp = new BigNumber(result.data.timestamp)
      const upnl = new BigNumber(result.data.result.uPnl)
      const gatewaySignature = result.nodeSignature
      const signature = new BigNumber(result.signatures[0].signature)
      const { owner } = result.signatures[0]
      const nonce = result.data.init.nonceAddress

      const generatedSignature = {
        reqId,
        timestamp,
        upnl,
        gatewaySignature,
        sigs: { signature, owner, nonce },
      }

      const key = uuidv4()
      const deallocateuuid = uuidv4()

      startTxn({
        key,
        title: t('Deallocate'),
        transactions: {
          [deallocateuuid]: {
            desc: t('Deallocate'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      const deallocateAbi = [
        {
          inputs: [
            {
              internalType: 'uint256',
              name: 'amount',
              type: 'uint256',
            },
            {
              components: [
                {
                  internalType: 'bytes',
                  name: 'reqId',
                  type: 'bytes',
                },
                {
                  internalType: 'uint256',
                  name: 'timestamp',
                  type: 'uint256',
                },
                {
                  internalType: 'int256',
                  name: 'upnl',
                  type: 'int256',
                },
                {
                  internalType: 'bytes',
                  name: 'gatewaySignature',
                  type: 'bytes',
                },
                {
                  components: [
                    {
                      internalType: 'uint256',
                      name: 'signature',
                      type: 'uint256',
                    },
                    {
                      internalType: 'address',
                      name: 'owner',
                      type: 'address',
                    },
                    {
                      internalType: 'address',
                      name: 'nonce',
                      type: 'address',
                    },
                  ],
                  internalType: 'struct SchnorrSign',
                  name: 'sigs',
                  type: 'tuple',
                },
              ],
              internalType: 'struct SingleUpnlSig',
              name: 'upnlSig',
              type: 'tuple',
            },
          ],
          name: 'deallocate',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ]

      const proxiedData = encodeFunctionData({
        abi: deallocateAbi,
        functionName: 'deallocate',
        args: [balance, generatedSignature],
      })

      const _callAbi = [
        {
          inputs: [
            { internalType: 'address', name: 'account', type: 'address' },
            { internalType: 'bytes[]', name: '_callDatas', type: 'bytes[]' },
          ],
          name: '_call',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ]
      const data = encodeFunctionData({
        abi: _callAbi,
        functionName: '_call',
        args: [symmioAccount, [proxiedData]],
      })

      const res = await sendTxn(key, deallocateuuid, tcAddress, data)

      if (!res) {
        setLoading(false)
        return false
      }

      setLoading(false)
      endTxn({
        key,
        final: 'Deallocated Successful',
      })

      return res
    },
    [account, chainId, endTxn, sendTxn, startTxn, t],
  )

  return { loading, deallocate }
}
