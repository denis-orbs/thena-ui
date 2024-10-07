import { gql } from 'graphql-request'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { INIT_VALUES } from '@/constant'
import { useTC } from '@/context/tcContext'
import { useCreateTC } from '@/hooks/useTCManager'
import useWallet from '@/hooks/useWallet'
import { v4Client } from '@/lib/graphql'
import { warnToast } from '@/lib/notify'
import { fromWei, isInvalidAmount, toWei } from '@/lib/utils'
import { useTxn } from '@/state/transactions/hooks'

import { useCreateTcTag } from '.'
import Details from './Details/Details'

const V4_ADD_TC_TEMPORARY = gql`
  mutation V4_ADD_TC_TEMPORARY($tcId: String!, $ownerId: String!) {
    addTCTemporary(input: { tcId: $tcId, ownerId: $ownerId }) {
      id
      tcId
      ownerId
    }
  }
`

const addTCTemporary = async (tcId, ownerId) => {
  try {
    await v4Client.request(V4_ADD_TC_TEMPORARY, { tcId, ownerId: ownerId?.toLowerCase() })
  } catch (error) {
    return undefined
  }
}

function Preview({ step, setStep, data, setData, setShowModalCreateCompetition, setShowPreview }) {
  const router = useRouter()
  const t = useTranslations()
  const { account } = useWallet()
  const { protocolFee, protocolFeeToken } = useTC()
  const { onCreate, pending, handleGetTCId } = useCreateTC()
  const { assignTCTag } = useCreateTcTag()
  const { closeTxnModal } = useTxn()

  const mainData = useMemo(() => {
    const ownerFee = Math.floor(data.prize.weights[0] * 10)
    const weights = data.prize.weights.slice(1).map(ele => Math.round((ele / (100 - data.prize.weights[0])) * 1000))
    const totalWeight = weights.reduce((sum, cur) => sum + cur, 0)
    weights[weights.length - 1] += 1000 - totalWeight

    const entryFee = data.entryFee.map((e, index) =>
      !isInvalidAmount(e) ? toWei(e, data.prize.token?.[index]?.decimals).dp(0).toString(10) : 0,
    )

    // eslint-disable-next-line unused-imports/no-unused-vars

    return {
      ...data,
      entryFee,
      entryFeeUpdate: entryFee,
      owner: {
        id: account,
      },
      prize: {
        ...data.prize,
        totalPrize: new Array(data.prize.token.length).fill('0'),
        ownerFee,
        weights,
      },
      prizeUpdate: {
        ...data.prize,
        totalPrize: new Array(data.prize.token.length).fill('0'),
        ownerFee,
        weights,
      },
      timestamp: {
        registrationStart: Math.floor(data.timestamp.registrationStart / 1000),
        registrationEnd: Math.floor(data.timestamp.registrationEnd / 1000),
        startTimestamp: Math.floor(data.timestamp.startTimestamp / 1000),
        endTimestamp: Math.floor(data.timestamp.endTimestamp / 1000),
      },
      competitionRules: {
        ...data.competitionRules,
        startingBalance: !isInvalidAmount(data.competitionRules.startingBalance)
          ? toWei(data.competitionRules.startingBalance, data.competitionRules.winningToken.decimals).dp(0).toString(10)
          : 0,
        pairIds: data.competitionRules.pairIds.filter(item => item !== 0),
        minimumBalance: !isInvalidAmount(data.competitionRules.minimumBalance)
          ? toWei(data.competitionRules.minimumBalance, data.competitionRules.winningToken.decimals).dp(0).toString(10)
          : 0,
      },
      tcTagAssignments: [
        {
          id: undefined,
          tcTag: data?.tag,
        },
      ],
    }
  }, [data, account])

  const handleCreateTC = async () => {
    if (fromWei(protocolFee, protocolFeeToken?.decimals).gt(protocolFeeToken?.balance)) {
      warnToast('Insufficient [Asset] Balance', { symbol: protocolFeeToken?.symbol })
    } else {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const { tag, tcTagAssignments, ...dataSubmit } = mainData
      const txHash = await onCreate(dataSubmit)
      // const txHash = '0x6a76e10a7d0903ba844394bf41f55b37d1eb1a02c8a326bf31615d575aafefda'
      if (!txHash) {
        setShowModalCreateCompetition(true)
        setStep(step - 1)
        setShowPreview(false)
      }
      if (txHash) {
        const tcId = await handleGetTCId(txHash)
        if (tcId) {
          await addTCTemporary(tcId, account)
          if (data?.tag?.id) {
            await assignTCTag({ tradingCompetitionId: tcId, tcTagId: data.tag.id }, () => {
              setShowModalCreateCompetition(false)
              setData(INIT_VALUES)
              setStep(0)
              setShowPreview(false)
              closeTxnModal()
              return router.push(`/arena/trading-competitions/${tcId}`)
            })
          }
        } else {
          setShowModalCreateCompetition(false)
          setData(INIT_VALUES)
          setStep(0)
          setShowPreview(false)
          closeTxnModal()
          return router.push(`/arena/trading-competitions/${tcId}`)
        }
      }
    }
  }

  // const previewFee = useMemo(() => {
  //   if (data.market === TC_MARKET_TYPES.SPOT) {
  //     return `${formatAmount(fromWei(protocolFee, protocolFeeToken?.decimals))} ${protocolFeeToken?.symbol}`
  //   }

  //   return `${formatAmount(fromWei(protocolFeePerpetual, protocolFeeTokenPerpetual?.decimals))} ${
  //     protocolFeeTokenPerpetual?.symbol
  //   }`
  // }, [
  //   data.market,
  //   protocolFee,
  //   protocolFeePerpetual,
  //   protocolFeeToken?.decimals,
  //   protocolFeeToken?.symbol,
  //   protocolFeeTokenPerpetual?.decimals,
  //   protocolFeeTokenPerpetual?.symbol,
  // ])

  return (
    <div className='flex flex-col-reverse md:flex-row'>
      <div className='h-fit w-full rounded-[3px] px-5 py-4 md:max-w-[324px]'>
        <p className='font-figtree text-[27px] font-semibold leading-[33px] text-white'>
          {t('Create Trading Competition')}?
        </p>
        <p className='text-lightGray mb-3 mt-2 text-base leading-[22px]'>
          {t('Create Trading Competition Description')}
        </p>
        {/* <div className='mb-3 w-full'>
          <p className='text-lightGray text-base leading-5'>{t('Creation Fee')}:</p>
          <p className='text-[25px] font-semibold leading-[30px] text-white'>{previewFee}</p>
        </div> */}
        <PrimaryButton isLoading={pending} onClick={handleCreateTC} className='w-full py-[15.75px] uppercase'>
          {t('Create')}
        </PrimaryButton>

        <EmphasisButton
          onClick={() => {
            setStep(step - 1)
            setShowModalCreateCompetition(true)
          }}
          className='mt-3 w-full py-[15.75px] uppercase'
        >
          {t('Back')}
        </EmphasisButton>
      </div>
      <div className='flex max-h-[80vh] w-full overflow-y-scroll'>
        <Details data={mainData} />
      </div>
    </div>
  )
}

export default Preview
