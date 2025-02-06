import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Input from '@/components/input'
import { TextHeading } from '@/components/typography'
import { createVeTHEAutomationContract, setSelectedVeTHE } from '@/state/veTHEAutomationContract/action'

import VeTHEDropdownData from '../VeTHEDropdownData'

function Step1Details() {
  const t = useTranslations()
  const dispatch = useDispatch()
  const { veTHESelected, createData } = useSelector(state => state.veTHEAutomationContract)

  const setVeTHESelected = useCallback(
    data => {
      if (data) {
        dispatch(
          setSelectedVeTHE({
            veTHESelected: {
              ...data,
              amount: data.amount.toString(),
              rebase_amount: data.rebase_amount.toString(),
              voting_amount: data.voting_amount.toString(),
            },
          }),
        )
        dispatch(
          createVeTHEAutomationContract({
            createData: {
              ...createData,
              veTHEId: data.id,
            },
          }),
        )
      }
    },
    [createData, dispatch],
  )

  const updateContractName = useCallback(
    event => {
      const contractName = event.target.value
      dispatch(
        createVeTHEAutomationContract({
          createData: {
            ...createData,
            contractName,
          },
        }),
      )
    },
    [createData, dispatch],
  )

  return (
    <div className='space-y-9'>
      <div className='space-y-6'>
        <div className='space-y-3'>
          <TextHeading>{t('Your veTHE ID')}</TextHeading>
          <VeTHEDropdownData veTHESelected={veTHESelected} setVeTHESelected={setVeTHESelected} />
        </div>

        <div className='space-y-3'>
          <TextHeading>{t('Contract Name')}</TextHeading>
          <Input val={createData?.contractName} type='text' placeholder='Name' onChange={updateContractName} />
        </div>
      </div>
    </div>
  )
}

export default Step1Details
