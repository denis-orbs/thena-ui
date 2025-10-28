import BigNumber from 'bignumber.js'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import { useCallback, useMemo, useState } from 'react'

import { Alert } from '@/components/alert'
import { EmphasisButton, ErrorButton, PrimaryButton } from '@/components/buttons/Button'
import Input from '@/components/input'
import BalanceInput from '@/components/input/BalanceInput'
import LabelTooltip from '@/components/label/LabelTooltip'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { TC_MARKET_TYPES } from '@/constant'
import { useJoinTCPerpetual } from '@/hooks/useTcPerpetualContract'
import { useJoinTC } from '@/hooks/useTcSpotContract'
import { warnToast } from '@/lib/notify'
import { formatAmount, fromWei, isInvalidAmount, toWei } from '@/lib/utils'

export function JoinModal({ competition, open, onClose }) {
  const t = useTranslations()
  const {
    entryFeeUpdate,
    prizeUpdate: { token: prizeToken },
    competitionRules: { startingBalance, winningToken, minimumBalance },
    market,
  } = competition
  const [name, setName] = useState('')
  const [inputStartingBalance, setInputStartingBalance] = useState(
    formatAmount(fromWei(minimumBalance, winningToken?.decimals)),
  )

  const { push } = useRouter()

  const { joinTC, pending } = useJoinTC()
  const { joinTCPerpetual, pending: pendingPerpetual } = useJoinTCPerpetual()

  const showAlertMinimum = useMemo(
    () => formatAmount(fromWei(minimumBalance, winningToken?.decimals)) > Number(inputStartingBalance),
    [inputStartingBalance, minimumBalance, winningToken?.decimals],
  )

  const showAlertBalance = useMemo(() => {
    if (!winningToken) return false
    const depositBalance =
      isInvalidAmount(startingBalance) && market === TC_MARKET_TYPES.SPOT
        ? toWei(Number(inputStartingBalance))
        : startingBalance

    const notEnoughFee = entryFeeUpdate
      .map((e, index) => {
        if (prizeToken[index].address.toLowerCase() === winningToken?.address?.toLowerCase()) {
          const totalAmount = fromWei(entryFeeUpdate[index], prizeToken[index]?.decimals).plus(
            fromWei(depositBalance, winningToken?.decimals),
          )
          const totalBalance = new BigNumber(prizeToken[index].balance)
          return totalAmount.gt(totalBalance)
        }

        return fromWei(e, prizeToken[index]?.decimals).gt(prizeToken[index].balance)
      })
      .some(item => item)

    const notEnoughDeposit = fromWei(depositBalance, winningToken?.decimals).gt(winningToken?.balance)

    return notEnoughDeposit || notEnoughFee
  }, [entryFeeUpdate, inputStartingBalance, market, prizeToken, startingBalance, winningToken])

  const handleJoin = useCallback(async () => {
    try {
      let joined = false

      if (market === TC_MARKET_TYPES.PERPETUAL) {
        if (!name.trim()) {
          warnToast('Name is required')
          return
        }
        joined = await joinTCPerpetual(competition, name.trim())
      } else {
        joined = await joinTC(competition, toWei(Number(inputStartingBalance), winningToken?.decimals))
      }
      if (joined) {
        push(`/arena/trading-competitions/${competition.id}?first-join=true`)
        onClose()
      }
    } catch (e) {
      console.error(e)
    }
  }, [competition, inputStartingBalance, joinTC, joinTCPerpetual, market, name, onClose, push, winningToken?.decimals])

  const entryFeeArr = useMemo(() => {
    if (!entryFeeUpdate || !Array.isArray(entryFeeUpdate)) {
      return []
    }

    let entryFeeArray = entryFeeUpdate.map((item, index) => ({
      data: formatAmount(fromWei(item, prizeToken[index]?.decimals)),
      symbol: prizeToken[index]?.symbol,
      logo: prizeToken[index]?.logoURI,
    }))

    if (entryFeeArray.some(item => !isInvalidAmount(item.data))) {
      entryFeeArray = entryFeeArray.filter(item => !isInvalidAmount(item.data))
    }

    return entryFeeArray
  }, [entryFeeUpdate, prizeToken])

  const message = useMemo(() => {
    // No entry fee, deposit required
    if (entryFeeUpdate.every(isInvalidAmount)) {
      if (!isInvalidAmount(startingBalance) || !isInvalidAmount(minimumBalance)) {
        return t('Pay Deposit To Join Message', {
          depositAmount: formatAmount(fromWei(startingBalance, winningToken?.decimals)),
          depositTicker: winningToken?.symbol,
        })
      }
      return t('Free To Join Message')
    }

    // Entry fee required, no deposit required
    if (isInvalidAmount(startingBalance) && isInvalidAmount(minimumBalance)) {
      return t('Pay Entry Fee To Join Message', {
        entryFeeText: entryFeeArr.map(item => `${item.data} ${item.symbol}`).join(', '),
      })
    }

    // Entry fee and deposit required
    return t('Pay Entry Fee And Deposit To Join Message', {
      depositAmount: isInvalidAmount(startingBalance)
        ? formatAmount(fromWei(minimumBalance, winningToken?.decimals))
        : formatAmount(fromWei(startingBalance, winningToken?.decimals)),
      depositTicker: winningToken?.symbol,
      entryFeeText: entryFeeArr.map(item => `${item.data} ${item.symbol}`).join(', '),
    })
  }, [entryFeeArr, entryFeeUpdate, minimumBalance, startingBalance, t, winningToken?.decimals, winningToken?.symbol])

  const totalToken = useMemo(() => {
    const indexToken = prizeToken.findIndex(
      (token, index) => token?.symbol === winningToken?.symbol && Number(entryFeeUpdate[index]) > 0,
    )
    if (indexToken !== -1) {
      const depositBalance =
        isInvalidAmount(startingBalance) && market === TC_MARKET_TYPES.SPOT ? minimumBalance : startingBalance

      let prizeTokenArr = []

      prizeTokenArr = prizeToken.map((pt, index) => ({
        data:
          pt?.symbol === winningToken?.symbol && Number(entryFeeUpdate[index]) > 0
            ? formatAmount(
                fromWei(entryFeeUpdate[index], pt?.decimals).toNumber() +
                  fromWei(depositBalance, pt?.decimals).toNumber(),
              )
            : formatAmount(fromWei(entryFeeUpdate[index], pt?.decimals).toNumber()),
        ticker: pt?.symbol,
      }))

      if (prizeTokenArr.some(item => !isInvalidAmount(item.data))) {
        prizeTokenArr = prizeTokenArr.filter(item => !isInvalidAmount(item.data))
      }

      return prizeTokenArr.map(item => `${item.data} ${item.ticker}`).join(', ')
    }
    return ''
  }, [entryFeeUpdate, market, minimumBalance, prizeToken, startingBalance, winningToken?.symbol])

  return (
    <Modal isOpen={open} closeModal={onClose} width={540} title={t('Join Competition')}>
      <ModalBody>
        <p className='mt-1.5 w-full text-[15px] text-neutral-300 md:text-base md:leading-6'>{message}</p>
        {totalToken ? (
          <TextHeading className='my-4 block'>
            {t('This means')} <span className='underline'>{totalToken}!</span>
          </TextHeading>
        ) : null}
        {market === TC_MARKET_TYPES.PERPETUAL && (
          <div>
            <LabelTooltip label='Name' required />
            <Input
              val={name}
              onChange={e => {
                setName(e.target.value)
              }}
              placeholder='Enter your name'
              type='text'
              required
            />
          </div>
        )}
        <div className='item-centers flex flex-row justify-between gap-4'>
          <div>
            <TextHeading className='text-lg'>{t('Entry Fee')}</TextHeading>
            <div className='mt-2 flex flex-wrap items-center gap-1 text-neutral-300'>
              {entryFeeArr.map((ef, index) => (
                <span key={ef?.logo} className='flex text-nowrap'>
                  <span className='flex items-center text-nowrap'>
                    {ef?.logo && (
                      <Image
                        alt={ef?.symbol}
                        src={ef?.logo}
                        className='me-1 inline-block shrink-0'
                        width={20}
                        height={20}
                        loading='lazy'
                      />
                    )}
                    {ef.data} {ef?.symbol}
                  </span>
                  {index !== entryFeeArr.length - 1 && <span>,</span>}
                </span>
              ))}
            </div>
          </div>
          {winningToken ? (
            (!isInvalidAmount(startingBalance) ||
              (market === TC_MARKET_TYPES.SPOT && !isInvalidAmount(minimumBalance))) && (
              <div>
                <TextHeading className='text-lg'>
                  {t(isInvalidAmount(startingBalance) ? 'Minimum Deposit to Join' : 'Required Deposit to Join')}
                </TextHeading>
                <div className='mt-2 flex gap-2'>
                  <Image
                    alt={winningToken?.name}
                    src={winningToken?.logoURI}
                    className='shrink-0'
                    width={20}
                    height={20}
                    loading='lazy'
                  />
                  <Paragraph>
                    {formatAmount(
                      fromWei(
                        isInvalidAmount(startingBalance) ? minimumBalance : startingBalance,
                        winningToken?.decimals,
                      ),
                    )}{' '}
                    {winningToken?.symbol}
                  </Paragraph>
                </div>
              </div>
            )
          ) : (
            <></>
          )}
        </div>
        {isInvalidAmount(startingBalance) && winningToken && market === TC_MARKET_TYPES.SPOT && (
          <div className='mt-3 md:mt-5'>
            <TextHeading className='text-lg'>{t('Deposit')}</TextHeading>
            <BalanceInput
              autoFocus
              asset={competition?.competitionRules?.winningToken}
              amount={inputStartingBalance}
              onAmountChange={setInputStartingBalance}
            />
            {showAlertMinimum && (
              <Paragraph className='text-error-500 mt-1 ml-1 block text-sm'>
                {t('Must Be Greater Than Minimum Balance')}
              </Paragraph>
            )}
          </div>
        )}
        {showAlertBalance && (
          <div className='mt-2'>
            <Alert>
              <p>{t('Not Enough Balance To Join Message')}</p>
              <Link
                href={{
                  pathname: '/swap',
                  query: {
                    inputCurrency: 'BNB',
                    outputCurrency: winningToken?.address,
                  },
                }}
              >
                <ErrorButton className='p-2 text-xs text-nowrap'>{t('Add Balance')}</ErrorButton>
              </Link>
            </Alert>
          </div>
        )}
      </ModalBody>
      <ModalFooter className='flex w-full items-center justify-between gap-4'>
        <EmphasisButton className='w-full' onClick={onClose}>
          {t('Cancel')}
        </EmphasisButton>
        <PrimaryButton
          className='w-full'
          onClick={handleJoin}
          disabled={showAlertBalance || showAlertMinimum}
          isLoading={pending || pendingPerpetual}
        >
          {t('Join Competition')}
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  )
}
