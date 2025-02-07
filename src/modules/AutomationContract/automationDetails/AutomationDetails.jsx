import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import React from 'react'

import Box from '@/components/box'
import IconGroup from '@/components/icongroup'
import { Paragraph, TextHeading } from '@/components/typography'
import { PAIR_TYPES, UNKNOWN_LOGO } from '@/constant'
import { useCopyText } from '@/hooks/useCopyText'
import useWallet from '@/hooks/useWallet'
import { calculateNextWeek, formatAddress, formatAmount } from '@/lib/utils'
import { ListTokenPercantage } from '@/modules/WeightedPool/TokenPercentage'
import { CheckIcon, CopyArenaIcon } from '@/svgs'

function AutomationDetails({ contractData, transactionHash }) {
  const t = useTranslations()
  const { onCopy, copied } = useCopyText()
  const { account } = useWallet()
  return (
    <div className='space-y-4'>
      <TextHeading className='font-archia text-2xl lg:text-3xl'>{t('Automation Details')}</TextHeading>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3'>
        {/* Rebase */}
        <Box className='space-y-4'>
          <TextHeading className='font-archia text-xl lg:text-2xl'>{t('Rebase')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Weekly rebase claim')}</Paragraph>
              <TextHeading>{contractData?.settings?.isClaimEveryWeek ? t('Yes') : t('No')}</TextHeading>
            </div>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Next rebase claim')}</Paragraph>
              <TextHeading>
                {dayjs(calculateNextWeek(contractData?.settings?.executionTime)).format('MMM D, YYYY [at] HH:mm [UTC]')}
              </TextHeading>
            </div>
          </div>
        </Box>

        {/* Relock */}
        <Box className='space-y-4'>
          <TextHeading className='font-archia text-xl lg:text-2xl'>{t('Relock')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Weekly relock contract')}</Paragraph>
              <TextHeading>{contractData?.settings?.isRelockEveryWeek ? t('Yes') : t('No')}</TextHeading>
            </div>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Next relock')}</Paragraph>
              <TextHeading>
                {dayjs(calculateNextWeek(contractData?.settings?.executionTime)).format('MMM D, YYYY [at] HH:mm [UTC]')}
              </TextHeading>
            </div>
          </div>
        </Box>

        {/* Vote Details */}
        <Box className='space-y-4 '>
          <TextHeading className='font-archia text-xl lg:text-2xl'>{t('Vote Details')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Vote each epoch')}</Paragraph>
              <TextHeading>{contractData?.votes?.isAutoVote ? t('Yes') : t('No')}</TextHeading>
            </div>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Next vote')}</Paragraph>
              <TextHeading>
                {dayjs(calculateNextWeek(contractData?.settings?.executionTime)).format('MMM D, YYYY [at] HH:mm [UTC]')}
              </TextHeading>
            </div>
            <div className='flex max-h-[120px] flex-col gap-3 overflow-y-auto'>
              {(contractData?.votes?.pairs || []).map((pair, index) => (
                <div key={`${pair?.pair?.address}_${index}`} className='flex flex-row justify-between'>
                  {pair?.pair?.type !== PAIR_TYPES.WEIGHTED ? (
                    <div className='flex flex-row gap-3'>
                      <IconGroup
                        className='-space-x-2'
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
                  ) : (
                    <ListTokenPercantage listToken={pair?.pair?.tokens} />
                  )}
                  <TextHeading>{pair.weight}%</TextHeading>
                </div>
              ))}
            </div>
          </div>
        </Box>

        {/* Registration */}
        <Box className='space-y-4'>
          <TextHeading className='font-archia text-xl lg:text-2xl'>{t('Registration')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Owner address')}</Paragraph>
              <TextHeading className='flex flex-row gap-1'>
                {formatAddress(account)}
                <div
                  onClick={e => onCopy(e, account, 'ownerAddress')}
                  className='h-5 w-5 cursor-pointer stroke-neutral-200'
                >
                  {copied === 'ownerAddress' ? <CheckIcon className='stroke-success-500' /> : <CopyArenaIcon />}
                </div>
              </TextHeading>
            </div>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Date')}</Paragraph>
              <TextHeading>TODO</TextHeading>
            </div>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Transaction Hash')}</Paragraph>
              <TextHeading className='flex flex-row gap-1'>
                {formatAddress(transactionHash)}
                <div
                  onClick={e => onCopy(e, transactionHash, 'transactionHash')}
                  className='h-5 w-5 cursor-pointer stroke-neutral-200'
                >
                  {copied === 'transactionHash' ? <CheckIcon className='stroke-success-500' /> : <CopyArenaIcon />}
                </div>
              </TextHeading>
            </div>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Forwarder address')}</Paragraph>
              <TextHeading className='flex flex-row items-center gap-1'>
                {formatAddress(contractData.forwarder)}
                <div
                  onClick={e => onCopy(e, contractData.forwarder, 'forwarderAddress')}
                  className='h-5 w-5 cursor-pointer stroke-neutral-200'
                >
                  {copied === 'forwarderAddress' ? <CheckIcon className='stroke-success-500' /> : <CopyArenaIcon />}
                </div>
              </TextHeading>
            </div>
          </div>
        </Box>

        {/* Contract */}
        <Box className='space-y-4'>
          <TextHeading className='font-archia text-xl lg:text-2xl'>{t('Contract')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Contract address')}</Paragraph>
              <TextHeading className='flex flex-row items-center gap-1'>
                {formatAddress(contractData.address)}
                <div
                  onClick={e => onCopy(e, contractData.address, 'contractAddress')}
                  className='h-5 w-5 cursor-pointer stroke-neutral-200'
                >
                  {copied === 'contractAddress' ? <CheckIcon className='stroke-success-500' /> : <CopyArenaIcon />}
                </div>
              </TextHeading>
            </div>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Gas limit')}</Paragraph>
              <TextHeading className='flex flex-row gap-1'>{formatAmount(contractData.gasLimit)}</TextHeading>
            </div>
          </div>
        </Box>

        {/* Execution */}
        <Box className='space-y-4'>
          <TextHeading className='font-archia text-xl lg:text-2xl'>{t('Execution')}</TextHeading>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Automation execution time')}</Paragraph>
              <TextHeading>
                {dayjs(contractData?.settings?.executionTime).format('MMM D, YYYY [at] HH:mm [UTC]')}
              </TextHeading>
            </div>
            <div className='flex flex-row justify-between'>
              <Paragraph>{t('Next execution')}</Paragraph>
              <TextHeading>
                {dayjs(calculateNextWeek(contractData?.settings?.executionTime)).format('MMM D, YYYY [at] HH:mm [UTC]')}
              </TextHeading>
            </div>
          </div>
        </Box>
      </div>
    </div>
  )
}

export default AutomationDetails
