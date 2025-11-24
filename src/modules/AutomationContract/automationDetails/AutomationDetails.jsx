import dayjs from 'dayjs'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import Box from '@/components/box'
import IconGroup from '@/components/icongroup'
import { Paragraph, TextHeading } from '@/components/typography'
import { AUTOMATION_STATUS, SCAN_URLS, UNKNOWN_LOGO } from '@/constant'
import { useCopyText } from '@/hooks/useCopyText'
import useWallet from '@/hooks/useWallet'
import CheckIcon from '@/icons/CheckIcon'
import { formatAddress, formatAmount } from '@/utils/utils'

import CopyArenaIcon from '~/svgs/copy-arena.svg'

const calculateNextWeek = startTime => {
  const now = Date.now() + new Date().getTimezoneOffset() * 60 * 1000
  if (startTime > now) {
    return startTime
  }
  const oneWeekInMs = 86400 * 7 * 1000

  const weeksElapsed = Math.floor((now - startTime) / oneWeekInMs)

  const nextWeek = startTime + (weeksElapsed + 1) * oneWeekInMs

  return nextWeek
}

function AutomationDetails({ contractData, transactionHash, date }) {
  const t = useTranslations()
  const { onCopy, copied } = useCopyText()
  const { account, chainId } = useWallet()

  const [nextTime, setNextTime] = useState('')

  useEffect(() => {
    const updateNextTime = () => {
      setNextTime(
        dayjs(calculateNextWeek(contractData?.settings?.executionTime)).format('MMM D, YYYY [at] HH:mm [UTC]'),
      )
    }

    updateNextTime()

    const interval = setInterval(updateNextTime, 60000)

    return () => clearInterval(interval)
  }, [contractData.settings.executionTime])

  return (
    <div className='flex flex-col gap-4'>
      <TextHeading className='font-archia text-2xl lg:text-3xl'>{t('Automation Details')}</TextHeading>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3'>
        {/* Rebase */}
        <Box className='flex flex-col gap-4'>
          <TextHeading className='font-archia text-xl lg:text-2xl'>{t('Rebase')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Weekly rebase claim')}</Paragraph>
              <TextHeading>{contractData?.settings?.isClaimEveryWeek ? t('Yes') : t('No')}</TextHeading>
            </div>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Next rebase claim')}</Paragraph>
              <TextHeading>{nextTime}</TextHeading>
            </div>
          </div>
        </Box>

        {/* Relock */}
        <Box className='flex flex-col gap-4'>
          <TextHeading className='font-archia text-xl lg:text-2xl'>{t('Relock')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Weekly relock contract')}</Paragraph>
              <TextHeading>{contractData?.settings?.isRelockEveryWeek ? t('Yes') : t('No')}</TextHeading>
            </div>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Next relock')}</Paragraph>
              <TextHeading>{nextTime}</TextHeading>
            </div>
          </div>
        </Box>

        {/* Vote Details */}
        <Box className='flex flex-col gap-4'>
          <TextHeading className='font-archia text-xl lg:text-2xl'>{t('Vote Details')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Vote each epoch')}</Paragraph>
              <TextHeading>{contractData?.votes?.isAutoVote ? t('Yes') : t('No')}</TextHeading>
            </div>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Next vote')}</Paragraph>
              <TextHeading>{nextTime}</TextHeading>
            </div>
            <div className='flex max-h-[120px] flex-col gap-3 overflow-y-auto'>
              {(contractData?.votes?.pairs || []).map((pair, index) => (
                <div key={`${pair?.pair?.address}_${index}`} className='flex flex-row justify-between'>
                  <div className='flex flex-row gap-3'>
                    <IconGroup
                      className='*:not-first:-ml-2'
                      classNames={{
                        image: 'outline-2 w-7 h-7',
                      }}
                      logo1={pair?.pair?.token0?.logoURI || UNKNOWN_LOGO}
                      logo2={pair?.pair?.token1?.logoURI || UNKNOWN_LOGO}
                    />
                    <div className='flex flex-row gap-[6px]'>
                      <TextHeading>{pair?.pair?.symbol || 'UNKNOWN'}</TextHeading>
                      <Paragraph className='text-sm'>{t(pair?.pair?.type || '')}</Paragraph>
                    </div>
                  </div>
                  <TextHeading>{pair.weight}%</TextHeading>
                </div>
              ))}
            </div>
          </div>
        </Box>

        {/* Registration */}
        <Box className='flex flex-col gap-4'>
          <TextHeading className='font-archia text-xl lg:text-2xl'>{t('Registration')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-row justify-between gap-1.5'>
              <Paragraph>{t('Owner address')}</Paragraph>
              <TextHeading className='flex flex-row gap-1'>
                {account && contractData.status !== AUTOMATION_STATUS.PENDING ? (
                  <>
                    <Link href={`${SCAN_URLS[chainId]}/address/${account}`} target='_blank' rel='nofollow noopener'>
                      {formatAddress(account)}
                    </Link>
                    <div
                      onClick={e => onCopy(e, account, 'ownerAddress')}
                      className='h-5 w-5 cursor-pointer stroke-neutral-200'
                    >
                      {copied === 'ownerAddress' ? <CheckIcon className='stroke-success-500' /> : <CopyArenaIcon />}
                    </div>
                  </>
                ) : (
                  <>-</>
                )}
              </TextHeading>
            </div>
            <div className='flex flex-row justify-between gap-1.5'>
              <Paragraph>{t('Date')}</Paragraph>
              {date ? <TextHeading>{dayjs.unix(date).format('MMM D, YYYY [at] HH:mm [UTC]')}</TextHeading> : <>-</>}
            </div>
            <div className='flex flex-row justify-between gap-1.5'>
              <Paragraph>{t('Transaction Hash')}</Paragraph>

              <TextHeading className='flex flex-row gap-1'>
                {contractData.status !== AUTOMATION_STATUS.PENDING && transactionHash ? (
                  <>
                    <Link href={`${SCAN_URLS[chainId]}/tx/${transactionHash}`} target='_blank' rel='nofollow noopener'>
                      {formatAddress(transactionHash)}
                    </Link>
                    <div
                      onClick={e => onCopy(e, transactionHash, 'transactionHash')}
                      className='h-5 w-5 cursor-pointer stroke-neutral-200'
                    >
                      {copied === 'transactionHash' ? <CheckIcon className='stroke-success-500' /> : <CopyArenaIcon />}
                    </div>
                  </>
                ) : (
                  <>-</>
                )}
              </TextHeading>
            </div>
            <div className='flex flex-row justify-between gap-1.5'>
              <Paragraph>{t('Forwarder address')}</Paragraph>
              <TextHeading className='flex flex-row items-center gap-1'>
                {contractData.status !== AUTOMATION_STATUS.PENDING ? (
                  <>
                    <Link
                      href={`${SCAN_URLS[chainId]}/address/${contractData.forwarder}`}
                      target='_blank'
                      rel='nofollow noopener'
                    >
                      {formatAddress(contractData.forwarder)}
                    </Link>
                    <div
                      onClick={e => onCopy(e, contractData.forwarder, 'forwarderAddress')}
                      className='h-5 w-5 cursor-pointer stroke-neutral-200'
                    >
                      {copied === 'forwarderAddress' ? <CheckIcon className='stroke-success-500' /> : <CopyArenaIcon />}
                    </div>
                  </>
                ) : (
                  <>-</>
                )}
              </TextHeading>
            </div>
          </div>
        </Box>

        {/* Contract */}
        <Box className='flex flex-col gap-4'>
          <TextHeading className='font-archia text-xl lg:text-2xl'>{t('Contract')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-row justify-between gap-1.5'>
              <Paragraph>{t('Contract address')}</Paragraph>
              <TextHeading className='flex flex-row items-center gap-1'>
                {contractData.status !== AUTOMATION_STATUS.PENDING ? (
                  <>
                    <Link
                      href={`${SCAN_URLS[chainId]}/address/${contractData.address}`}
                      target='_blank'
                      rel='nofollow noopener'
                    >
                      {formatAddress(contractData.address)}
                    </Link>
                    <div
                      onClick={e => onCopy(e, contractData.address, 'contractAddress')}
                      className='h-5 w-5 cursor-pointer stroke-neutral-200'
                    >
                      {copied === 'contractAddress' ? <CheckIcon className='stroke-success-500' /> : <CopyArenaIcon />}
                    </div>
                  </>
                ) : (
                  <>-</>
                )}
              </TextHeading>
            </div>
            <div className='flex flex-row justify-between gap-1.5'>
              <Paragraph>{t('Gas limit')}</Paragraph>
              <TextHeading className='flex flex-row gap-1'>
                {' '}
                {contractData.status !== AUTOMATION_STATUS.PENDING ? (
                  <>{formatAmount(contractData.gasLimit)}</>
                ) : (
                  <>-</>
                )}
              </TextHeading>
            </div>
          </div>
        </Box>

        {/* Execution */}
        <Box className='flex flex-col gap-4'>
          <TextHeading className='font-archia text-xl lg:text-2xl'>{t('Execution')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-row justify-between gap-1.5'>
              <Paragraph>{t('Automation execution time')}</Paragraph>
              <TextHeading>
                {contractData.status !== AUTOMATION_STATUS.PENDING ? (
                  <>{dayjs(contractData?.settings?.executionTime).format('MMM D, YYYY [at] HH:mm [UTC]')}</>
                ) : (
                  <>-</>
                )}
              </TextHeading>
            </div>
            <div className='flex flex-row justify-between gap-1.5'>
              <Paragraph>{t('Next execution')}</Paragraph>
              <TextHeading>
                {contractData.status !== AUTOMATION_STATUS.PENDING ? (
                  <>
                    {dayjs(calculateNextWeek(contractData?.settings?.executionTime)).format(
                      'MMM D, YYYY [at] HH:mm [UTC]',
                    )}
                  </>
                ) : (
                  <>-</>
                )}
              </TextHeading>
            </div>
          </div>
        </Box>
      </div>
    </div>
  )
}

export default AutomationDetails
