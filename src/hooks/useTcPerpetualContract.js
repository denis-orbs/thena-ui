import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { gql } from 'graphql-request'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import { encodeFunctionData, maxUint256 } from 'viem'

import { TC_MARKET_TYPES, TXN_STATUS } from '@/constant'
import useWallet from '@/hooks/useWallet'
import { readCall } from '@/lib/contractActions'
import {
  getERC20Contract,
  getMultiAccountContract,
  getTcPerpetualContract,
  getTCPerpRewarderContract,
} from '@/lib/contracts'
import { v4Client } from '@/lib/graphql'
import { EVENT_TYPES } from '@/lib/tradingCompetition/utils'
import { fromWei, isInvalidAmount } from '@/lib/utils'
import { useTxn } from '@/state/transactions/hooks'

const V4_TC_PARTICIPANTS_CLAIM = gql`
  query V4_TC_PARTICIPANTS_CLAIM($tcAddress: String!, $userId: String!) {
    tcParticipants(where: { tradingCompetition: { tcAddress_eq: $tcAddress }, participant: { id_eq: $userId } }) {
      winAmounts
    }
  }
`

const fetchTcParticipant = async (tcAddress, userId) => {
  try {
    const { tcParticipants } = await v4Client.request(V4_TC_PARTICIPANTS_CLAIM, {
      tcAddress,
      userId,
    })
    if (tcParticipants && Array.isArray(tcParticipants) && tcParticipants.length) {
      return tcParticipants[0]
    }
    return undefined
  } catch (error) {
    return { error: true }
  }
}

export const useTCPerpetualInfor = (tcAddress, type = TC_MARKET_TYPES.PERPETUAL, eventType = '') => {
  const [loaded, setLoaded] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isWinner, setIsWinner] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [balance, setBalance] = useState(0)
  const [isWithdrawable, setIsWithdrawable] = useState(false)
  const [tradingCompetition, setTradingCompetition] = useState(undefined)
  const [withdrawCooldown, setWithdrawCooldown] = useState(0)
  const [isClaimable, setIsClaimable] = useState(undefined)

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
          let bal = 0
          try {
            const tcPerpetualContract = getTcPerpetualContract(tcAddress)
            const multiAccountContract = getMultiAccountContract()
            const symmioAccount = await readCall(tcPerpetualContract, 'getAccountOf', [account])

            // get balance to withdraw
            bal = await readCall(multiAccountContract, 'balanceOf', [symmioAccount])

            // if balance to withdraw = 0, get balance to deallocate
            if (!bal) {
              bal = await readCall(multiAccountContract, 'allocatedBalanceOfPartyA', [symmioAccount])
            }
            setBalance(new BigNumber(bal))
          } catch (error) {
            setBalance(0)
          }

          if (new BigNumber(bal).toNumber() > 0) {
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

  const { data: tcParticipant } = useQuery({
    queryKey: ['getUserTotalVolume', tcAddress, account, isRegistered, type, eventType],
    queryFn: () => fetchTcParticipant(tcAddress?.toLowerCase(), account?.toLowerCase()),
    refetchInterval: 30000,
    enabled: Boolean(
      type === TC_MARKET_TYPES.PERPETUAL && eventType === EVENT_TYPES.ENDED && tcAddress && account && isRegistered,
    ),
    gcTime: 0,
  })

  const checkClaimable = useCallback(async () => {
    const checkAfterFiveMinutes =
      (dayjs().unix() - new BigNumber(tradingCompetition?.timestamp?.endTimestamp).toNumber()) / 60
    if (checkAfterFiveMinutes < 5) {
      setIsClaimable(false)
      return
    }

    if (!tcParticipant) {
      setIsClaimable(false)
      return
    }

    if (!(tcParticipant.winAmounts || []).some(winAmount => !isInvalidAmount(winAmount))) {
      setIsClaimable(false)
      return
    }

    const tcId = new BigNumber(tradingCompetition?.id).toNumber()
    const tcPerpRewarderContract = getTCPerpRewarderContract()
    const claimedList = await Promise.all(
      (tradingCompetition?.prize?.totalPrize || []).map((_, index) => {
        const isClaimed = readCall(tcPerpRewarderContract, 'claimed', [
          account,
          tcId,
          tradingCompetition?.prize?.token?.[index],
        ])
        return isClaimed
      }),
    )
    if (claimedList.some(item => !isInvalidAmount(item))) {
      setIsClaimable(false)
      return
    }

    setIsClaimable(true)
  }, [account, tcParticipant, tradingCompetition])

  useEffect(() => {
    getUserData()
  }, [getUserData])

  useEffect(() => {
    checkWithdrawableTCPerp()
  }, [checkWithdrawableTCPerp])

  useEffect(() => {
    getWithdrawCooldown()
  }, [getWithdrawCooldown])

  useEffect(() => {
    checkClaimable()
  }, [checkClaimable])

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
    isClaimable,
    checkClaimable,
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
        title: `${t('Deposit And Allocate')}`,
        transactions: {
          ...(!isApprovedWinningToken && {
            [approveTokenuuid]: {
              desc: `${t('Approve')} USDT`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [deposituuid]: {
            desc: t('Deposit And Allocate'),
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
        final: 'Deposit And Allocate Successful',
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

export const MUON_BSC_URLS = ['/crypto-v3-shield-deus-finance/v1/', '/crypto-v3-shield2-deus-finance/v1/']

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

      let fullUrls = []
      if (typeof window !== 'undefined') {
        const baseUrl = window.location.origin
        fullUrls = MUON_BSC_URLS.map(path => new URL(path, baseUrl).href)
      }

      let checkError = null

      for (const url of fullUrls) {
        try {
          const MuonURL = new URL(url)
          MuonURL.searchParams.set('app', 'symmio')
          MuonURL.searchParams.append('method', 'uPnl_A')
          requestParams.forEach(param => {
            MuonURL.searchParams.append(`params[${param[0]}]`, param[1])
          })

          let response = await fetch(MuonURL)

          if (response.ok) {
            checkError = null
            response = await response.json()
            result = response.result
            success = response.success
            if (success) {
              break // Exit the loop if successful
            }
          } else {
            checkError = response.statusText
          }
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

      if (checkError) {
        throw new Error(checkError)
      }

      if (!success) {
        throw new Error('Error')
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

async function getMuonToClaimReward(account, tcId) {
  let res
  try {
    const query = `app=thena_tc&method=position&params[owner]=${account}&params[tcId]=${tcId}`
    const muonURL = `https://api-muon.thena.fi/v1/?${query}`
    const response = await fetch(muonURL)
    res = await response.json()
  } catch (error) {
    console.log(error)
  }
  return res
}

export const useClaimRewardTCPerp = () => {
  const { startTxn, endTxn, writeTxn, closeTxn } = useTxn()
  const { account } = useWallet()
  const t = useTranslations()
  const [pending, setPending] = useState(false)

  const claimReward = useCallback(
    async ({ tcId }) => {
      const key = uuidv4()
      const claimuuid = uuidv4()

      const tcPerpRewarderContract = getTCPerpRewarderContract()
      if (!tcPerpRewarderContract) return

      setPending(true)

      const toastId = toast.loading('requesting data from Muon...', {
        autoClose: 5000,
        closeButton: true,
      })

      const muonRes = await getMuonToClaimReward(account, tcId)
      if (!muonRes?.success) {
        toast.update(toastId, {
          autoClose: 5000,
          closeButton: true,
          render: 'request failed',
          isLoading: false,
          type: 'error',
        })
        return
      }

      toast.update(toastId, {
        autoClose: 5000,
        closeButton: true,
        render: 'Muon responded',
        isLoading: false,
        type: 'success',
      })

      const muonResult = muonRes.result
      const data = [
        Number(tcId),
        muonResult.data.result.position,
        muonResult.data.result.tiecounter,
        muonResult.data.timestamp,
        muonResult.reqId,
        {
          signature: muonResult.signatures[0].signature,
          owner: muonResult.signatures[0].owner,
          nonce: muonResult.data.init.nonceAddress,
        },
        muonResult?.nodeSignature,
      ]

      startTxn({
        key,
        title: `${t('Claim Rewards')}`,
        transactions: {
          [claimuuid]: {
            desc: t('Claim Rewards'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      const isSuccess = await writeTxn(key, claimuuid, tcPerpRewarderContract, 'claim', data)

      if (!isSuccess) {
        setPending(false)
        closeTxn()
        return false
      }

      endTxn({
        key,
        final: 'Claim Successful',
      })

      setPending(false)
      return true
    },
    [account, closeTxn, endTxn, startTxn, t, writeTxn],
  )

  return { claimReward, pending }
}

export const useIncreasePrizeTCPerp = () => {
  const { startTxn, endTxn, writeTxn, closeTxn } = useTxn()
  const { account, chainId } = useWallet()
  const t = useTranslations()
  const [pending, setPending] = useState(false)

  const increasePrize = useCallback(
    async (tokenAddress, amount, tcId) => {
      const key = uuidv4()
      const approveTokenuuid = uuidv4()
      const increasePrizeuuid = uuidv4()
      const tcPerpRewarderContract = getTCPerpRewarderContract()

      const tokenContract = getERC20Contract(tokenAddress, chainId)
      const allowance = await readCall(tokenContract, 'allowance', [account, tcPerpRewarderContract.address])
      const isApprovedToken = fromWei(allowance).gte(fromWei(amount))

      setPending(true)
      startTxn({
        key,
        title: t('Increase Prize Pool'),
        transactions: {
          ...(!isApprovedToken && {
            [approveTokenuuid]: {
              desc: `${t('Approve')} ${t('Token')}`,
              status: TXN_STATUS.START,
              hash: null,
            },
          }),
          [increasePrizeuuid]: {
            desc: t('Increase Prize Pool'),
            status: TXN_STATUS.START,
            hash: null,
          },
        },
      })

      if (!isApprovedToken) {
        const isSuccess = await writeTxn(key, approveTokenuuid, tokenContract, 'approve', [
          tcPerpRewarderContract.address,
          maxUint256,
        ])
        if (!isSuccess) {
          setPending(false)
          return false
        }
      }

      const isSuccess = await writeTxn(key, increasePrizeuuid, tcPerpRewarderContract, 'externalFill', [
        tcId,
        tokenAddress,
        amount,
      ])
      if (!isSuccess) {
        setPending(false)
        closeTxn()
        return false
      }

      endTxn({
        key,
        final: 'Increase Successful',
      })
      setPending(false)
      return true
    },
    [account, chainId, closeTxn, endTxn, startTxn, t, writeTxn],
  )

  return { pending, increasePrize }
}
