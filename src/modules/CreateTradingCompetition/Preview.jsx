import { useTranslations } from 'next-intl'
import React, { useMemo } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import { useCreateTC, useTCManagerInfo } from '@/hooks/useTCManager'
import { warnToast } from '@/lib/notify'
import { formatAmount, fromWei, toWei } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'

import Details from './Details/Details'

function Preview({ step, setStep, data, setShowModalCreateCompetition }) {
  const t = useTranslations()
  const { account } = useWallet()
  const { protocolFee, protocolFeeToken } = useTCManagerInfo()
  const { onCreate, pending } = useCreateTC()

  const mainData = useMemo(() => {
    const ownerFee = Math.floor(data.prize.weights[0] * 10)
    const weights = data.prize.weights.slice(1).map(ele => Math.round((ele / (100 - data.prize.weights[0])) * 1000))
    const totalWeight = weights.reduce((sum, cur) => sum + cur, 0)
    weights[weights.length - 1] += 1000 - totalWeight
    return {
      ...data,
      entryFee: toWei(data.entryFee, data.prize.token.decimals).dp(0).toString(10),
      owner: {
        id: account,
      },
      prize: {
        ...data.prize,
        totalPrize: toWei(data.prize.totalPrize, data.prize.token.decimals).dp(0).toString(10),
        hostContribution: toWei(data.prize.totalPrize, data.prize.token.decimals).dp(0).toString(10),
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
        startingBalance: toWei(data.competitionRules.startingBalance, data.competitionRules.winningToken.decimals)
          .dp(0)
          .toString(10),
      },
    }
  }, [data, account])

  return (
    <div className='flex flex-col-reverse md:flex-row'>
      <div className='h-fit w-full rounded-[3px] px-5 py-4 md:max-w-[324px]'>
        <p className='font-figtree text-[27px] font-semibold leading-[33px] text-white'>
          {t('Create Trading Competition')}?
        </p>
        <p className='text-lightGray mb-3 mt-2 text-base leading-[22px]'>
          {t('Create Trading Competition Description')}
        </p>
        <div className='mb-3 w-full'>
          <p className='text-lightGray text-base leading-5'>Creation Fee:</p>
          <p className='text-[25px] font-semibold leading-[30px] text-white'>
            {formatAmount(fromWei(protocolFee, protocolFeeToken?.decimals))} {protocolFeeToken?.symbol}
          </p>
        </div>
        <PrimaryButton
          isLoading={pending}
          onClick={() => {
            if (fromWei(protocolFee, protocolFeeToken?.decimals).gt(protocolFeeToken?.balance)) {
              warnToast(`Insufficient ${protocolFeeToken?.symbol} Balance `)
            } else {
              onCreate(mainData)
            }
          }}
          content='CREATE'
          className='w-full py-[15.75px]'
        >
          CREATE
        </PrimaryButton>

        <EmphasisButton
          onClick={() => {
            setStep(step - 1)
            setShowModalCreateCompetition(true)
          }}
          className='mt-3 w-full py-[15.75px]'
        >
          BACK
        </EmphasisButton>
      </div>
      <div className='flex max-h-[80vh] overflow-y-scroll'>
        <Details data={mainData} isPreview account={account} />
      </div>
      {/* <div className='bg-body border-blue fixed bottom-0 left-0 z-[100] w-full border-t px-5 py-3 lg:hidden'>
        <span className='font-figtree text-xl font-semibold leading-6 text-white'>Create Trading Competition?</span>
        <p className='text-lightGray mt-[7px] text-[15px] leading-5'>
          In order to create this trading competition you will have to pay a creation fee.
        </p>
        <div className='mt-3'>
          <span className='text-lightGray text-base leading-5'>Creation Fee:</span>
          <p className=' text-xl font-semibold leading-5 text-white '>
            {formatAmount(fromWei(protocolFee, protocolFeeToken?.decimals))} {protocolFeeToken?.symbol}
          </p>
        </div>
        <div className='mt-3 flex w-full items-center space-x-3'>
          <PrimaryButton
            isLoading={pending}
            onClick={() => {
              if (fromWei(protocolFee, protocolFeeToken?.decimals).gt(protocolFeeToken?.balance)) {
                warnToast(`Insufficient ${protocolFeeToken?.symbol} Balance `)
              } else {
                onCreate(mainData)
              }
            }}
            content='CREATE'
            className='w-full py-3.5'
          >
            CREATE
          </PrimaryButton>

          <EmphasisButton
            onClick={() => {
              setStep(step - 1)
              setShowModalCreateCompetition(true)
            }}
            className='w-full py-3.5'
          >
            BACK
          </EmphasisButton>
        </div>
      </div> */}
    </div>
  )
}

export default Preview
