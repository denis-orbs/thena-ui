import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Divider from '@/components/divider'
import CircleImage from '@/components/image/CircleImage'
import Skeleton from '@/components/skeleton'
import Toggle from '@/components/toggle'
import CustomTooltip from '@/components/tooltip'
import { Paragraph, TextHeading } from '@/components/typography'
import { LINK_LOGO } from '@/constant'
import usePrices from '@/hooks/usePrices'
import InfoIcon from '@/icons/InfoIcon'
import { createVeTHEAutomationContract } from '@/state/veTHEAutomationContract/action'
import { getDefaultExecutionTime } from '@/state/veTHEAutomationContract/reducer'
import { formatAmount } from '@/utils/utils'

import SelectExecutionTime from '../SelectExecutionTime'

const SETTINGS_TYPE = {
  CLAIM: 'claim',
  RELOCK: 'relock',
  EXECUTION_TIME: 'execution',
}

function Step1Settings({ minFunds, isLoadingMinFunds }) {
  const t = useTranslations()

  const prices = usePrices()

  const { createData } = useSelector(state => state.veTHEAutomationContract)
  const dispatch = useDispatch()
  const [executionTime, setExecutionTime] = useState(createData?.settings?.executionTime || getDefaultExecutionTime())
  const updateSetting = useCallback(
    (type, value) => {
      const currentSettings = createData?.settings || {}
      const updatedSettings = (() => {
        switch (type) {
          case SETTINGS_TYPE.CLAIM:
            return {
              ...currentSettings,
              isClaimEveryWeek: !currentSettings.isClaimEveryWeek,
            }
          case SETTINGS_TYPE.RELOCK:
            return {
              ...currentSettings,
              isRelockEveryWeek: !currentSettings.isRelockEveryWeek,
            }
          case SETTINGS_TYPE.EXECUTION_TIME: {
            if (!value) return currentSettings
            return {
              ...currentSettings,
              executionTime: value,
            }
          }
          default:
            return currentSettings
        }
      })()

      if (JSON.stringify(currentSettings) !== JSON.stringify(updatedSettings)) {
        dispatch(
          createVeTHEAutomationContract({
            createData: {
              ...createData,
              settings: {
                ...updatedSettings,
                executionTime: updatedSettings.executionTime,
              },
            },
          }),
        )
      }
    },
    [createData, dispatch],
  )

  useEffect(() => {
    updateSetting(SETTINGS_TYPE.EXECUTION_TIME, executionTime)
  }, [executionTime, updateSetting])

  return (
    <div className='flex flex-col gap-4 lg:gap-6'>
      <div className='flex flex-row items-center gap-1'>
        <Toggle
          checked={createData?.settings?.isClaimEveryWeek}
          onChange={() => updateSetting(SETTINGS_TYPE.CLAIM)}
          label='Claim rebase rewards every week'
        />
        <InfoIcon data-tooltip-id='setting-claim-rebase' />
        <CustomTooltip
          className='z-40 max-w-[320px] min-w-[136px] bg-neutral-500! shadow-xl after:bg-neutral-500!'
          id='setting-claim-rebase'
          place='bottom'
        >
          {t('Automatically claim your rebase rewards every week')}
        </CustomTooltip>
      </div>
      <div className='flex items-center gap-1'>
        <Toggle
          checked={createData?.settings?.isRelockEveryWeek}
          onChange={() => updateSetting(SETTINGS_TYPE.RELOCK)}
          label='Relock veTHE every 1 Week'
        />
        <InfoIcon data-tooltip-id='settings-relock' />
        <CustomTooltip
          className='z-40 max-w-[320px] min-w-[136px] bg-neutral-500! shadow-xl after:bg-neutral-500!'
          id='settings-relock'
          place='bottom'
        >
          {t('Automatically increase your veTHE lock timestamp by one week every week')}
        </CustomTooltip>
      </div>
      <SelectExecutionTime executionTime={executionTime} updateData={setExecutionTime} />
      <Divider className='max-lg:hidden' />
      <div className='flex flex-row items-center justify-between'>
        <div className='flex flex-row items-center gap-1'>
          <TextHeading className='text-base lg:text-lg'>{t('Minimum Link Balance needed')}</TextHeading>

          <InfoIcon data-tooltip-id='setting-mind-funds' className='max-lg:hidden' />
          <CustomTooltip className='z-40' id='setting-mind-funds' place='bottom'>
            {t('This is the estimated total deposit based on your current contract settings')}
          </CustomTooltip>
        </div>
        <div className='flex flex-row items-center gap-1'>
          {isLoadingMinFunds ? (
            <>
              <Skeleton className='h-6 w-24' />
              <Skeleton className='h-6 w-24' />
            </>
          ) : (
            <>
              <Paragraph className='max-lg:hidden'>${`${formatAmount(minFunds * prices.CHAINLINK)}`}</Paragraph>
              <TextHeading>{`${formatAmount(minFunds)}`}</TextHeading>
              <CircleImage alt='CHAIN LINK logo' className='size-4' src={LINK_LOGO} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Step1Settings
