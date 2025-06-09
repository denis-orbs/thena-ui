import { useTranslations } from 'next-intl'
import React, { useCallback, useState } from 'react'

import { EmphasisButton, PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { DEPOSIT_TYPE, TC_MARKET_TYPES, TC_PARTICIPANTS, TC_STEPS, WIN_TYPE } from '@/constant'
import { useUserInfo } from '@/context/userInfoContext'
import { warnToast } from '@/lib/notify'
import { isInvalidAmount } from '@/lib/utils'

import Detail from './Detail'
import Prize from './Prize'
import Tag from './Tag'
import Time from './Time'
import Token from './Token'
import WarningModal from './WarningModal'

function Create({ step = 1, setStep, showModalCreateCompetition, handleClose = () => {}, data, setData }) {
  const t = useTranslations()
  const [isEntryFee, setIsEntryFee] = useState(data.entryFee.some(item => !isInvalidAmount(item)))
  const [isStartingBalance, setIsStartingBalance] = useState(false)
  const [showModalWarning, setShowModalWarning] = useState(false)
  const { userInfo } = useUserInfo()

  const getErrorMsg = useCallback(
    val => {
      let error = ''
      const { market } = data
      const isSpotType = market === TC_MARKET_TYPES.SPOT

      switch (val) {
        case 0:
          error = !data.name ? 'Invalid Name' : !data.description ? 'Invalid Description' : ''
          break

        case 1: {
          const {
            maxParticipants,
            timestamp: { registrationStart },
          } = data

          if (Number(maxParticipants) < TC_PARTICIPANTS.MIN || Number(maxParticipants) > TC_PARTICIPANTS.MAX) {
            error = 'Invalid Max Participants'
          } else if (registrationStart < new Date().getTime()) {
            error = 'Invalid Registration Start'
          }

          break
        }

        case 2: {
          const { winningToken, tradingTokens, startingBalance, pairIds } = data.competitionRules

          if (isSpotType) {
            if (tradingTokens.length < 2) {
              error = 'Invalid Tradable Tokens'
            }
            if (!winningToken) {
              error = 'Invalid Winning Token'
            }
          } else if (!pairIds.length) {
            error = 'Invalid Pair Tokens'
          } else error = ''

          if ((data.depositType || isStartingBalance) && isInvalidAmount(startingBalance)) {
            error = 'Invalid Total Deposit'
          }
          break
        }

        case 3: {
          const { weights, token } = data.prize
          const total = weights.reduce((sum, cur) => sum + cur, 0)

          const validAmountFee = data.entryFee.some(item => !isInvalidAmount(item))

          if (!token || !token.length) {
            error = 'Invalid Prize Token'
          } else if (isEntryFee && !validAmountFee) {
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
    [data, isEntryFee, isStartingBalance],
  )

  const renderComponent = () => {
    switch (step) {
      case 0:
        return <Detail data={data} setData={setData} />
      case 1:
        return <Time data={data} setData={setData} />
      case 2:
        return (
          <>
            <Token
              isStartingBalance={isStartingBalance}
              setIsStartingBalance={setIsStartingBalance}
              data={data}
              setData={setData}
            />
            {userInfo && (userInfo.isAdmin || userInfo.isSuperAdmin) && (
              <div className='mt-6'>
                <Tag data={data} setData={setData} />
              </div>
            )}
          </>
        )
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
      onAfterOpen={() => (document.body.style.overflow = 'hidden')}
      onAfterClose={() => (document.body.style.overflow = 'unset')}
    >
      <ModalBody className='p-2'>
        <div className='rounded-lg'>
          <div className='flex w-full flex-col items-center justify-center'>
            <p className='font-figtree text-[17px] leading-5 font-semibold tracking-[1.7px] text-white lg:text-xl lg:leading-6 lg:tracking-[2px]'>
              {TC_STEPS[step]}
            </p>
            <div className='mt-[9px] flex items-center gap-4 lg:mt-2.5'>
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
                    disabled={!valid && idx !== step}
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
            {t('Back')}
          </EmphasisButton>
        )}
        <PrimaryButton
          className='w-full py-3.5 text-white lg:w-auto lg:px-16 lg:py-3'
          onClick={() => {
            const errMsg = getErrorMsg(step)
            const errTime = getErrorMsg(1)
            if (errMsg) {
              warnToast(errMsg)
            } else if (errTime && step > 0) {
              warnToast(errTime)
              setStep(1)
            } else {
              if (step === 2 && data.depositType === DEPOSIT_TYPE.FREE && data.winType === WIN_TYPE.AMOUNT) {
                setShowModalWarning(true)
                return
              }
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
      <WarningModal
        open={showModalWarning}
        onClose={() => {
          setShowModalWarning(false)
        }}
        onClickNext={() => {
          setShowModalWarning(false)
          const errTime = getErrorMsg(1)
          if (errTime && step > 0) {
            warnToast(errTime)
            setStep(1)
          } else {
            setStep(3)
          }
        }}
      />
    </Modal>
  )
}

export default Create
