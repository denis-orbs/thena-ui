import { useTranslations } from 'next-intl'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Input from '@/components/input'
import { TextHeading } from '@/components/typography'
import { createVeTHEAutomationContract, setSelectedVeTHE } from '@/state/veTHEAutomationContract/action'

import VeTHEDropdownData from '../VeTHEDropdownData'

function Step1Details({ isEdit }) {
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

  return (
    <div className='space-y-9'>
      <div className='space-y-6'>
        <div className='space-y-3'>
          <TextHeading>{t('Your veTHE ID')}</TextHeading>
          <VeTHEDropdownData disabled={isEdit} veTHESelected={veTHESelected} setVeTHESelected={setVeTHESelected} />
        </div>

        <div className='space-y-3'>
          <TextHeading>{t('Contract Name')}</TextHeading>
          <Input
            val={veTHESelected ? `veTHE Automation - ID ${veTHESelected?.id}` : ''}
            readOnly
            type='text'
            placeholder='Name'
          />
        </div>
      </div>
    </div>
  )
}

export default Step1Details
