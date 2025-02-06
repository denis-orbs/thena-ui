import { useTranslations } from 'next-intl'
import React, { useCallback, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import Toggle from '@/components/toggle'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useEditAutomation } from '@/hooks/automationContract/useAutomationContract'
import SelectVotingPairsAndWeights from '@/modules/CreateVeTHEAutomation/SelectVotingPairsAndWeights'
import { updateWeight } from '@/modules/CreateVeTHEAutomation/Steps/Step2Vote'

const SETTINGS_TYPE = {
  CLAIM: 'claim',
  RELOCK: 'relock',
  EXECUTION_TIME: 'execution',
}

const UPDATE_TYPE = {
  AUTO: 'isAutoVote',
  PAIRS: 'pairs',
}

function EditAutomationContract({ data }) {
  const t = useTranslations()
  const [dataEdit, setDataEdit] = useState({ ...data })

  const { onEditAutomation, pending: pendingEdit } = useEditAutomation()

  const updateSetting = useCallback(
    (type, value) => {
      const currentSettings = dataEdit?.settings || {}
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
        setDataEdit({
          ...dataEdit,
          settings: updatedSettings,
        })
      }
    },
    [dataEdit],
  )

  const updateVotingPairs = useCallback(
    (type, pair, index) => {
      const currentVotes = dataEdit?.votes
      const updatedVotes = (() => {
        switch (type) {
          case UPDATE_TYPE.AUTO:
            return {
              ...currentVotes,
              isAutoVote: !currentVotes.isAutoVote,
            }
          case UPDATE_TYPE.PAIRS: {
            const updatedPairs = [...currentVotes.pairs]
            updatedPairs[index] = { ...pair, pair: { ...pair.pair, subpools: [] } }
            const newPairs = updateWeight(updatedPairs)
            return {
              ...currentVotes,
              pairs: newPairs,
            }
          }
          default:
            return currentVotes
        }
      })()

      if (JSON.stringify(currentVotes) !== JSON.stringify(updatedVotes)) {
        setDataEdit({ ...dataEdit, votes: updatedVotes })
      }
    },
    [dataEdit],
  )

  const onAddPair = useCallback(() => {
    const pairsArr = [...dataEdit.votes.pairs]
    pairsArr.push({
      lock: false,
      weight: 0,
      pair: undefined,
    })
    setDataEdit({
      ...dataEdit,
      votes: {
        ...dataEdit.votes,
        pairs: pairsArr,
      },
    })
  }, [dataEdit])

  const onRemovePair = useCallback(
    index => {
      const pairsArr = [...dataEdit.votes.pairs]
      pairsArr.splice(index, 1)
      const newPairs = updateWeight(pairsArr)
      setDataEdit({
        ...dataEdit,
        votes: {
          ...dataEdit.votes,
          pairs: newPairs,
        },
      })
    },
    [dataEdit],
  )

  return (
    <Box>
      <div className='divide-y divide-neutral-700'>
        {/* Rebase */}
        <div className='grid grid-cols-12 gap-5 pb-9 lg:gap-10'>
          <div className='col-span-full flex flex-col gap-3 lg:col-span-4'>
            <TextHeading>{t('Rebase')}</TextHeading>
            <TextSubHeading>{t('Automation rebase description')}</TextSubHeading>
          </div>
          <div className='col-span-full flex flex-row lg:col-span-8'>
            <Toggle
              checked={dataEdit?.settings?.isClaimEveryWeek}
              onChange={() => updateSetting(SETTINGS_TYPE.CLAIM)}
              label='Claim rebase rewards every week'
            />
          </div>
        </div>

        {/* Relock */}
        <div className='grid grid-cols-12 gap-5 py-9 lg:gap-10'>
          <div className='col-span-full flex flex-col gap-3 lg:col-span-4'>
            <TextHeading>{t('Relock')}</TextHeading>
            <TextSubHeading>{t('Automation relock description')}</TextSubHeading>
          </div>
          <div className='col-span-full flex flex-row lg:col-span-8'>
            <Toggle
              checked={dataEdit?.settings?.isRelockEveryWeek}
              onChange={() => updateSetting(SETTINGS_TYPE.RELOCK)}
              label='Claim rebase rewards every week'
            />
          </div>
        </div>

        {/* Vote */}
        <div className='grid grid-cols-12 gap-5 py-9 lg:gap-10'>
          <div className='col-span-full flex flex-col gap-3 lg:col-span-4'>
            <TextHeading>{t('Relock')}</TextHeading>
            <TextSubHeading>{t('Automation relock description')}</TextSubHeading>
          </div>
          <div className='col-span-full flex flex-row lg:col-span-8'>
            <div className='w-full space-y-11'>
              <SelectVotingPairsAndWeights
                data={dataEdit}
                onAddPair={onAddPair}
                onRemovePair={onRemovePair}
                updateVotingPairs={updateVotingPairs}
              />
              <PrimaryButton
                disabled={pendingEdit}
                className='w-full lg:w-fit'
                onClick={() => onEditAutomation(dataEdit)}
              >
                {t('Save Changes')}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </Box>
  )
}

export default EditAutomationContract
