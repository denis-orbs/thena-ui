import { isEmpty } from 'lodash'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useState } from 'react'

import Box from '@/components/box'
import { PrimaryButton } from '@/components/buttons/Button'
import Toggle from '@/components/toggle'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useEditAutomation } from '@/hooks/automationContract/useAutomationContract'
import SelectVotingPairsAndWeights from '@/modules/CreateVeTHEAutomation/SelectVotingPairsAndWeights'
import { updateWeight } from '@/modules/CreateVeTHEAutomation/Steps/Step2Vote'
import { ErrorMessage } from '@/modules/WeightedPool/ChooseTokenAndWeights'

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

  const [error, setError] = useState()

  const isDisabled = useMemo(() => {
    const pairs = dataEdit?.votes?.pairs || []

    if (isEmpty(pairs)) return true

    const checkInvalidPair = pairs.some(pair => !pair.pair)
    if (checkInvalidPair) return true

    const checkInvalidWeight = pairs.some(pair => pair.weight <= 0 || !pair.weight)
    if (checkInvalidWeight) {
      setError(t('InvalidWeight'))
      return true
    }

    const totalWeight = pairs.reduce((sum, pair) => sum + pair.weight, 0)

    if (totalWeight < 100 || totalWeight > 100) {
      setError(t('Total weight invalid'))
      return true
    }
  }, [dataEdit?.votes?.pairs, t])

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
              label='Relock veTHE every 1 Week'
            />
          </div>
        </div>

        {/* Vote */}
        <div className='grid grid-cols-12 gap-5 py-9 lg:gap-10'>
          <div className='col-span-full flex flex-col gap-3 lg:col-span-4'>
            <TextHeading>{t('Vote')}</TextHeading>
            <TextSubHeading>{t('Automation vote description')}</TextSubHeading>
          </div>
          <div className='col-span-full flex flex-row lg:col-span-8'>
            <div className='w-full space-y-11'>
              <SelectVotingPairsAndWeights
                data={dataEdit}
                onAddPair={onAddPair}
                onRemovePair={onRemovePair}
                updateVotingPairs={updateVotingPairs}
              />
              {Boolean(error) && <ErrorMessage className='lg:p-4' message={error} />}
              <PrimaryButton
                disabled={pendingEdit || isDisabled}
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
