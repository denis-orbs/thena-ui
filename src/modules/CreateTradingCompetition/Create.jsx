import React, { useCallback, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { TC_PARTICIPANTS, TC_STEPS } from '@/constant'
import { warnToast } from '@/lib/notify'
import { isInvalidAmount } from '@/lib/utils'

import Detail from './Detail'
import Prize from './Prize'
import Time from './Time'
import Token from './Token'

function Create({ step = 1, setStep, showModalCreateCompetition, handleClose = () => {}, data, setData }) {
  const [isEntryFee, setIsEntryFee] = useState(!isInvalidAmount(data.entryFee))

  const getErrorMsg = useCallback(
    val => {
      let error = ''

      switch (val) {
        case 0:
          error = !data.name ? 'Invalid Name' : !data.description ? 'Invalid Description' : ''
          break

        case 1: {
          const {
            maxParticipants,
            timestamp: { registrationStart },
          } = data

          error =
            Number(maxParticipants) < TC_PARTICIPANTS.MIN || Number(maxParticipants) > TC_PARTICIPANTS.MAX
              ? 'Invalid Max Participants'
              : registrationStart < new Date().getTime()
                ? 'Invalid Registration Start'
                : ''
          break
        }

        case 2: {
          const { winningToken, tradingTokens, startingBalance } = data.competitionRules

          error =
            tradingTokens.length < 2
              ? 'Invalid Tradable Tokens'
              : !winningToken
                ? 'Invalid Winning Token'
                : isInvalidAmount(startingBalance)
                  ? 'Invalid Total Deposit'
                  : ''
          break
        }

        case 3: {
          const { weights, totalPrize, token } = data.prize
          const total = weights.reduce((sum, cur) => sum + cur, 0)
          if (!token) {
            error = 'Invalid Prize Token'
          } else if (isInvalidAmount(totalPrize)) {
            error = 'Invalid Prize Amount'
          } else if (token.balance.lt(totalPrize)) {
            error = 'Not Enough Host Contribution'
          } else if (isEntryFee && isInvalidAmount(data.entryFee)) {
            error = 'Invalid Fee Amount'
          } else if (total !== 100) {
            error = 'Invalid Distribution'
          }
          break
        }

        default:
          break
      }
      return error
    },
    [data, isEntryFee],
  )

  const renderComponent = () => {
    switch (step) {
      case 0:
        return <Detail data={data} setData={setData} />
      case 1:
        return <Time data={data} setData={setData} />
      case 2:
        return <Token data={data} setData={setData} />
      case 3:
        return <Prize data={data} setData={setData} isEntryFee={isEntryFee} setIsEntryFee={setIsEntryFee} />
      default:
    }
  }

  return (
    <Modal
      isOpen={showModalCreateCompetition}
      title='Create Trading Competition'
      closeModal={handleClose}
      fontSizeTitle='text-xl'
      width={750}
    >
      <ModalBody className='p-2'>
        <div className='rounded-lg'>
          <div className='flex w-full flex-col items-center justify-center'>
            <p className='font-figtree text-[17px] font-semibold leading-5 tracking-[1.7px] text-white lg:text-xl lg:leading-6 lg:tracking-[2px]'>
              {TC_STEPS[step]}
            </p>
            <div className='mt-[9px] flex items-center space-x-4 lg:mt-2.5 lg:space-x-[17px]'>
              {TC_STEPS.map((_, idx) => {
                let valid = true
                for (let subidx = 0; subidx < idx; subidx++) {
                  if (getErrorMsg(subidx) !== '') {
                    // eslint-disable-next-line unused-imports/no-unused-vars
                    valid = false
                    break
                  }
                }
                return (
                  <PrimaryButton
                    key={idx}
                    disabled={!valid}
                    onClick={() => setStep(idx)}
                    className={`${idx === step ? '' : 'bg-neutral-700 text-neutral-500'}`}
                  >
                    {idx + 1}
                  </PrimaryButton>
                )
              })}
            </div>
          </div>
          <div className='mt-5 flex w-full flex-col items-center justify-center'>
            <div className='w-full'>{renderComponent()}</div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='flex flex-row justify-center gap-4'>
        {step > 0 && (
          <EmphasisButton
            className='w-full py-3.5 text-white lg:w-auto lg:px-16 lg:py-3'
            onClick={() => setStep(step - 1)}
          >
            Back
          </EmphasisButton>
        )}
        <PrimaryButton
          className='w-full py-3.5 text-white lg:w-auto lg:px-16 lg:py-3'
          onClick={() => {
            const errMsg = getErrorMsg(step)
            if (errMsg) {
              warnToast(errMsg)
            } else {
              setStep(step + 1)
              if (step === TC_STEPS.length - 1) {
                handleClose()
              }
            }
          }}
        >
          {step === TC_STEPS.length - 1 ? 'Preview' : 'NEXT'}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}

export default Create
