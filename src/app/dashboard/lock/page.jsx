'use client'

import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { Info } from '@/components/alert'
import { EmphasisButton, PrimaryButton, SecondaryButton, TertiaryButton } from '@/components/buttons/Button'
import Highlight from '@/components/highlight'
import Spinner from '@/components/spinner'
import Table from '@/components/table'
import { Paragraph, TextHeading, TextSubHeading } from '@/components/typography'
import Contracts from '@/constant/contracts'
import { useAssets } from '@/context/assetsContext'
import { useVeTHEsContext } from '@/context/veTHEsContext'
import { useWithdrawLock } from '@/hooks/useVeThe'
import useWallet from '@/hooks/useWallet'
import { cn, formatAmount, goToDoc } from '@/lib/utils'
import AutomationButton from '@/modules/AutomationContract/AutomationButton'
import AutomationStatus from '@/modules/AutomationContract/AutomationStatus'
import AutomationsWarning from '@/modules/AutomationContract/AutomationsWarning'
import LockExpire from '@/modules/AutomationContract/LockExpire'
import { HowItWorksItem } from '@/modules/Story/HowItWorksItem'
import { useChainSettings } from '@/state/settings/hooks'
import { GiftIcon, InfoCirclePrimary, InfoCircleWhite, LockIcon, RefreshIcon } from '@/svgs'

import CreateLockModal from './createLockModal'
import ManageModal from './manageModal'
import NotConnected from '../NotConnected'

const sortOptions = [
  {
    label: 'veTHE ID',
    value: 'id',
    width: 'lg:w-[8%]',
    isDesc: true,
  },
  {
    label: 'Lock Value',
    value: 'value',
    width: 'lg:w-[15%]',
    isDesc: true,
  },
  {
    label: 'Locked Amount',
    value: 'amount',
    width: 'lg:w-[15%]',
    isDesc: true,
  },
  {
    label: 'Lock Expire',
    value: 'expire',
    width: 'lg:w-[15%]',
    isDesc: true,
  },
  {
    label: 'Votes Used',
    value: 'used',
    width: 'lg:flex-1 lg:w-[10%]',
    isDesc: true,
  },
  {
    label: 'Automation',
    value: 'automation',
    width: 'lg:w-[calc(37%-320px)]',
    disabled: true,
  },
  {
    label: '',
    value: 'action',
    width: 'lg:w-[320px]',
    disabled: true,
  },
]

export default function LockPage() {
  const [sort, setSort] = useState({})
  const { push } = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const { account } = useWallet()
  const { veTHEs, isLoading, updateVeTHEs } = useVeTHEsContext()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const assets = useAssets()
  const { networkId } = useChainSettings()
  const theAsset = useMemo(
    () => assets.find(asset => asset.address === Contracts.THE[networkId].toLowerCase()),
    [assets, networkId],
  )
  const selected = useMemo(() => veTHEs.find(veTHE => veTHE.id === selectedId), [veTHEs, selectedId])
  const { onWithdrawLock, pending } = useWithdrawLock()
  const t = useTranslations()

  const scrollRef = useRef(null)

  const sortedData = useMemo(
    () =>
      [...veTHEs].sort((a, b) => {
        let res
        switch (sort.value) {
          case 'id':
            res = (a.id - b.id) * (sort.isDesc ? -1 : 1)
            break
          case 'value':
            res = a.voting_amount
              .minus(b.voting_amount)
              .times(sort.isDesc ? -1 : 1)
              .toNumber()
            break
          case 'amount':
            res = a.amount
              .minus(b.amount)
              .times(sort.isDesc ? -1 : 1)
              .toNumber()
            break
          case 'expire':
            res = (a.lockedEnd - b.lockedEnd) * (sort.isDesc ? -1 : 1)
            break
          case 'used':
            res = (a.votedCurrentEpoch - b.votedCurrentEpoch) * (sort.isDesc ? -1 : 1)
            break

          default:
            break
        }
        return res
      }),
    [veTHEs, sort],
  )

  const finalVeTHEs = useMemo(
    () =>
      sortedData.map(veTHE => ({
        id: <Paragraph>{veTHE.id}</Paragraph>,
        value: (
          <div className='flex flex-col'>
            <Paragraph>{formatAmount(veTHE.voting_amount)}</Paragraph>
            <TextSubHeading>${formatAmount(veTHE.voting_amount.times(theAsset?.price ?? 0))}</TextSubHeading>
          </div>
        ),
        amount: (
          <div className='flex flex-col'>
            <Paragraph>{formatAmount(veTHE.amount)}</Paragraph>
            <TextSubHeading>${formatAmount(veTHE.amount.times(theAsset?.price ?? 0))}</TextSubHeading>
          </div>
        ),
        expire: <LockExpire veTHEId={veTHE.id} />,
        used: (
          <Paragraph className={veTHE.votedCurrentEpoch ? 'text-success-600' : 'text-error-600'}>
            {veTHE.votedCurrentEpoch ? t('Yes') : t('No')}
          </Paragraph>
        ),
        automation: <AutomationStatus veTHEId={veTHE.id} />,
        action: (
          <div className='flex w-full flex-row gap-3'>
            <div className=''>
              <AutomationButton veTHE={veTHE} className='w-[160px]' />
            </div>
            <div className='w-1/2 min-w-fit'>
              {veTHE.voting_amount.isZero() ? (
                <SecondaryButton
                  disabled={pending}
                  onClick={() => {
                    onWithdrawLock(veTHE, () => {
                      updateVeTHEs()
                    })
                  }}
                  className='w-full'
                >
                  {t('Withdraw')}
                </SecondaryButton>
              ) : (
                <EmphasisButton
                  className='w-full'
                  onClick={() => {
                    setSelectedId(veTHE.id)
                    setIsManageOpen(true)
                  }}
                >
                  {t('Manage')}
                </EmphasisButton>
              )}
            </div>
          </div>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData), theAsset, t],
  )

  const isNearlyExpired = useMemo(() => {
    const now = dayjs()
    return veTHEs.some(ve => {
      const lockedEnd = dayjs(ve.lockedEnd * 1000)
      return lockedEnd.subtract(14, 'days').isBefore(now)
    })
  }, [veTHEs])

  const openModal = () => {
    setIsCreateOpen(true)
  }

  const handleScroll = useCallback(() => {
    if (scrollRef && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <div className='flex flex-col gap-4'>
      <h2>{t('Lock')}</h2>
      <div>
        <Paragraph>{t('Lock description')}</Paragraph>{' '}
        <span onClick={handleScroll} className='cursor-pointer text-primary-600'>
          {t('How it Works')}
        </span>
      </div>
      {account ? (
        <div className='flex flex-col'>
          <article className={cn('my-4 flex flex-col gap-4 lg:flex-row', veTHEs.length > 0 && 'hidden lg:flex')}>
            <Info className='flex-col justify-between sm:flex-row lg:p-8'>
              <div className='flex items-center gap-4'>
                <InfoCirclePrimary className='h-4 w-4 min-w-4 lg:h-8 lg:w-8 lg:min-w-8' />
                <p>{t('Lock THE Desciption')}</p>
              </div>
              <TertiaryButton
                className='max-sm:w-full sm:min-w-fit'
                onClick={() => goToDoc('https://docs.thena.fi/thena/the-tokenomics/vethe')}
              >
                {t('Learn More')}
              </TertiaryButton>
            </Info>

            <Info className={cn('flex-col justify-between sm:flex-row lg:p-8', !isNearlyExpired && 'hidden')}>
              <div className='flex items-center gap-4'>
                <InfoCirclePrimary className='h-4 w-4 min-w-4 lg:h-8 lg:w-8 lg:min-w-8' />
                <p>{t('Warning THE claim rebase fee')}</p>
              </div>
              <PrimaryButton className='max-sm:w-full sm:min-w-fit' onClick={() => push('/dashboard/rewards')}>
                {t('Rewards')}
              </PrimaryButton>
            </Info>
          </article>
          <AutomationsWarning />
          <div className='mb-4 mt-10 flex items-center justify-between'>
            <TextHeading className='text-xl'>{t('Locked Positions')}</TextHeading>
            {veTHEs.length > 0 && <PrimaryButton onClick={openModal}>{t('Create Lock')}</PrimaryButton>}
          </div>
          {isLoading ? (
            <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-[120px]'>
              <Spinner />
            </div>
          ) : veTHEs.length > 0 ? (
            <Table
              sortOptions={sortOptions}
              data={finalVeTHEs}
              sort={sort}
              setSort={setSort}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          ) : (
            <div className='flex w-full flex-col items-center justify-center gap-4 px-6 py-[120px]'>
              <Highlight>
                <InfoCircleWhite className='h-4 w-4' />
              </Highlight>
              <div className='flex flex-col items-center gap-3'>
                <h2>{t('No veTHE found')}</h2>
                <Paragraph className='mt-3 text-center'>{t('You have no voting power')}</Paragraph>
              </div>
              <PrimaryButton onClick={openModal}>{t('Get veTHE')}</PrimaryButton>
            </div>
          )}
        </div>
      ) : (
        <NotConnected />
      )}
      <div ref={scrollRef}>
        <p className='mb-10 text-3xl font-semibold'>{t('How it Works')}?</p>
        <div className='flex flex-col justify-between md:flex-row'>
          <HowItWorksItem
            icon={LockIcon}
            title={t('Create Lock Position')}
            description={t('Create Lock Position Description')}
          />
          <HowItWorksItem
            icon={RefreshIcon}
            title={t('Automate Your Lock')}
            description={t('Automate Your Lock Description')}
          />
          <HowItWorksItem icon={GiftIcon} title={t('Earn Rewards')} description={t('Earn Rewards Description')} />
        </div>
      </div>
      <CreateLockModal
        popup={isCreateOpen}
        setPopup={setIsCreateOpen}
        theAsset={theAsset}
        updateVeTHEs={updateVeTHEs}
      />
      <ManageModal
        veTHE={selected}
        popup={isManageOpen}
        setPopup={setIsManageOpen}
        theAsset={theAsset}
        updateVeTHEs={updateVeTHEs}
      />
    </div>
  )
}
