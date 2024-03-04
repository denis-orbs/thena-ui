'use client'

import dayjs from 'dayjs'
import React, { useMemo, useState } from 'react'

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
import { formatAmount, goToDoc } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import { useChainSettings } from '@/state/settings/hooks'
import { InfoCirclePrimary, InfoCircleWhite } from '@/svgs'

import CreateLockModal from './createLockModal'
import ManageModal from './manageModal'
import NotConnected from '../NotConnected'

const sortOptions = [
  {
    label: 'Lock veTHE ID',
    value: 'id',
    width: 'lg:w-[18%]',
    isDesc: true,
  },
  {
    label: 'Lock Value',
    value: 'value',
    width: 'lg:w-[18%]',
    isDesc: true,
  },
  {
    label: 'Locked Amount',
    value: 'amount',
    width: 'lg:w-[18%]',
    isDesc: true,
  },
  {
    label: 'Lock Expire',
    value: 'expire',
    width: 'lg:w-[18%]',
    isDesc: true,
  },
  {
    label: 'Votes Used',
    value: 'used',
    width: 'lg:flex-1',
    isDesc: true,
  },
  {
    label: '',
    value: 'action',
    width: 'lg:w-[150px]',
    disabled: true,
  },
]

export default function LockPage() {
  const [sort, setSort] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const { account } = useWallet()
  const { veTHEs, isLoading, updateVeTHEs } = useVeTHEsContext()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const assets = useAssets()
  const { networkId } = useChainSettings()
  const theAsset = useMemo(() => assets.find(asset => asset.address === Contracts.THE[networkId]), [assets, networkId])
  const selected = useMemo(() => veTHEs.find(veTHE => veTHE.id === selectedId), [veTHEs, selectedId])
  const { onWithdrawLock, pending } = useWithdrawLock()

  const sortedData = useMemo(
    () =>
      veTHEs.sort((a, b) => {
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
        expire: (
          <div className='flex flex-col'>
            <Paragraph>{dayjs.unix(veTHE.lockedEnd).format('MMM D, YYYY')}</Paragraph>
            <TextSubHeading>{veTHE.expire}</TextSubHeading>
          </div>
        ),
        used: (
          <Paragraph className={veTHE.votedCurrentEpoch ? 'text-success-600' : 'text-error-600'}>
            {veTHE.votedCurrentEpoch ? 'Yes' : 'No'}
          </Paragraph>
        ),
        action: veTHE.voting_amount.isZero() ? (
          <SecondaryButton
            disabled={pending}
            onClick={() => {
              onWithdrawLock(veTHE, () => {
                updateVeTHEs()
              })
            }}
          >
            Withdraw
          </SecondaryButton>
        ) : (
          <EmphasisButton
            className='w-full lg:w-fit'
            onClick={() => {
              setSelectedId(veTHE.id)
              setIsManageOpen(true)
            }}
          >
            Manage
          </EmphasisButton>
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(sortedData), theAsset],
  )

  const openModal = () => {
    setIsCreateOpen(true)
  }

  return (
    <div className='flex flex-col gap-4'>
      <h2>Lock</h2>
      {account ? (
        <div className='flex flex-col'>
          <div className='flex flex-col gap-4'>
            <Info className='justify-between lg:p-8'>
              <InfoCirclePrimary className='h-4 w-4 min-w-fit lg:h-8 lg:w-8' />
              <p>
                Lock THE into veTHE to earn and govern. Vote with veTHE to earn bribes and trading fees. veTHE can be
                transferred, merged and split. You can hold multiple positions.
              </p>
              <TertiaryButton
                className='min-w-fit'
                onClick={() => goToDoc('https://thena.gitbook.io/thena/the-tokenomics/vethe')}
              >
                Learn More
              </TertiaryButton>
            </Info>
          </div>
          <div className='mb-4 mt-10 flex items-center justify-between'>
            <TextHeading className='text-xl'>Locked Positions</TextHeading>
            {veTHEs.length > 0 && <PrimaryButton onClick={openModal}>Create Lock</PrimaryButton>}
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
                <h2>No veTHE found</h2>
                <Paragraph className='mt-3 text-center'>You have no voting power.</Paragraph>
              </div>
              <PrimaryButton onClick={openModal}>Get veTHE</PrimaryButton>
            </div>
          )}
        </div>
      ) : (
        <NotConnected />
      )}
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
