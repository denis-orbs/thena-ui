import BigNumber from 'bignumber.js'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import { ChainId } from 'thena-sdk-core'

import { Alert } from '@/components/alert'
import { EmphasisButton, ErrorButton, PrimaryButton } from '@/components/buttons/Button'
import CheckBox from '@/components/checkbox'
import NextImage from '@/components/image/NextImage'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import {
  useBatchGiftThenaId,
  useBatchMintThenaId,
  useGiftThenaId,
  useMintThenaId,
  useTraitsAndProofs,
  useUSDTCostPerToken,
} from '@/hooks/useThenaIdContract'
import { cn, formatAmount, fromWei, isInvalidAmount } from '@/lib/utils'
import { useChainSettings } from '@/state/settings/hooks'

import ThenaIdInput from './ThenaIdInput'

const DEFAULT_THENAID_DATA = {
  id: 1,
  username: '',
  errorMessage: '',
  cost: undefined,
}

export default function ThenaIdModal({ tab, targetAddress, onClose, defaultThenaIdsData = undefined }) {
  const { networkId, updateNetwork } = useChainSettings()
  const t = useTranslations()
  const [type, setType] = useState(tab)
  const [thenaIds, setThenaIds] = useState(defaultThenaIdsData || [DEFAULT_THENAID_DATA])
  const [address, setAddress] = useState(targetAddress)
  const assets = useAssets()
  const { costPerToken, loading } = useUSDTCostPerToken()
  const { getTraitsAndProofs } = useTraitsAndProofs()

  // Only allowed USDT
  const USDTAsset = useMemo(
    () =>
      assets.find(item => item.address.toLowerCase() === '0x55d398326f99059fF775485246999027B3197955'.toLowerCase()),
    [assets],
  )

  const isValid = useMemo(() => thenaIds.every(item => item.username && !item.errorMessage && item.cost), [thenaIds])
  const totalCost = useMemo(
    () => thenaIds.reduce((sum, curr) => (curr.cost ? sum.plus(curr.cost) : sum), new BigNumber(0)),
    [thenaIds],
  )

  const { loading: gifting, giftThenaId } = useGiftThenaId()
  const { loading: minting, buyThenaId } = useMintThenaId()
  const { loading: batchMinting, batchMintThenaId } = useBatchMintThenaId()
  const { loading: batchGifting, batchGiftThenaId } = useBatchGiftThenaId()

  const isMinting = useMemo(
    () => gifting || minting || batchGifting || batchMinting,
    [batchMinting, batchGifting, gifting, minting],
  )

  const onMint = useCallback(async () => {
    if (!isValid) {
      return
    }
    if (type === 'gift') {
      if (thenaIds.length === 1) {
        await giftThenaId(thenaIds[0].username, address, thenaIds[0].cost)
      } else {
        await batchGiftThenaId(
          thenaIds.map(item => item.username),
          address,
          totalCost,
        )
      }
    } else if (thenaIds.length === 1) {
      await buyThenaId(thenaIds[0].username, thenaIds[0].cost)
    } else {
      await batchMintThenaId(
        thenaIds.map(item => item.username),
        totalCost,
      )
    }
  }, [isValid, type, thenaIds, batchGiftThenaId, address, giftThenaId, batchMintThenaId, totalCost, buyThenaId])

  const onChangeThenaItem = useCallback(
    (id, { errorMessage, cost, username }) => {
      setThenaIds(prev =>
        prev.map(item => {
          if (item.id === id) {
            return {
              id: item.id,
              username,
              errorMessage,
              cost,
            }
          }
          return item
        }),
      )
      if (username) {
        getTraitsAndProofs(username)
      }
    },
    [getTraitsAndProofs],
  )

  return (
    <Modal isOpen={!!tab} title='Mint Thena Id' closeModal={onClose} fontSizeTitle='text-xl' width={550}>
      <ModalBody className='p-2'>
        <div className='rounded-lg'>
          <div className='mt-[9px] grid grid-cols-1 items-center gap-4 md:grid-cols-2 lg:mt-2.5'>
            <div
              onClick={() => setType('get')}
              className={cn(
                'flex min-h-[180px] cursor-pointer items-center gap-2.5 rounded-lg border border-primary-800 p-6',
                type === 'get' ? 'bg-primary-900' : '',
              )}
            >
              <CheckBox className='min-w-[21px]' checked={type === 'get'} />
              <div className='flex flex-col gap-2'>
                <TextHeading>{t('Mint')}</TextHeading>
                <Paragraph className='text-sm'>{t('Mint Desc')}</Paragraph>
              </div>
            </div>
            <div
              onClick={() => setType('gift')}
              className={cn(
                'flex min-h-[180px] cursor-pointer items-center gap-2.5 rounded-lg border border-primary-800 p-6',
                type === 'gift' ? 'bg-primary-900' : '',
              )}
            >
              <CheckBox className='min-w-[21px]' checked={type === 'gift'} />
              <div className='flex flex-col gap-2'>
                <TextHeading>{t('Send As Gift')}</TextHeading>
                <Paragraph className='text-sm'>{t('Send Desc')}</Paragraph>
              </div>
            </div>
          </div>
          <div className='mt-5 flex w-full flex-col justify-center'>
            <div className='w-full'>
              <div className='w-full'>
                <LabelTooltip label={type === 'get' ? 'Your Thena Id' : 'Thena Id'} />
                {thenaIds.map(thenaItem => (
                  <ThenaIdInput
                    key={thenaItem.id}
                    onChange={value => onChangeThenaItem(thenaItem.id, value)}
                    costPerToken={costPerToken}
                    defaultThenaId={thenaItem.username || ''}
                  />
                ))}
              </div>

              <div className='mt-4 flex items-center justify-center space-x-3 md:mt-6'>
                <PrimaryButton
                  onClick={() => {
                    if (thenaIds.length >= 2) {
                      setThenaIds(thenaIds.slice(0, -1))
                    }
                  }}
                  disabled={thenaIds.length === 1}
                  className='bg-red-600 p-[0.5rem] hover:bg-red-600'
                >
                  <Image src='/svgs/minus-v2.svg' alt='' width={20} height={20} />
                </PrimaryButton>
                <PrimaryButton
                  onClick={() => {
                    if (thenaIds.length < 10) {
                      setThenaIds([
                        ...thenaIds,
                        {
                          ...DEFAULT_THENAID_DATA,
                          id: thenaIds.length + 1,
                        },
                      ])
                    }
                  }}
                  className='bg-green-600 p-[0.5rem] hover:bg-green-600'
                  disabled={thenaIds.length >= 10}
                >
                  <Image src='/svgs/plus-v2.svg' alt='' width={20} height={20} />
                </PrimaryButton>
              </div>
              {type === 'gift' && (
                <div className='mt-5 w-full'>
                  <LabelTooltip label='Wallet Address' />

                  <Input
                    onChange={e => {
                      setAddress(e.target.value)
                    }}
                    type='text'
                    value={address || ''}
                    placeholder=''
                    required
                  />
                </div>
              )}
              <div className='flex:col mt-5 flex w-full items-center justify-between'>
                <LabelTooltip label='Total Price' className='mb-0' />
                {totalCost && !isInvalidAmount(totalCost) && USDTAsset && (
                  <div className='flex items-center gap-2'>
                    <NextImage src={USDTAsset?.logoURI} alt='' className='h-5 w-5' />
                    <Paragraph>
                      {formatAmount(fromWei(totalCost, USDTAsset?.decimals))} {USDTAsset?.symbol}
                    </Paragraph>
                  </div>
                )}
              </div>
              {networkId !== ChainId.BSC && (
                <div className='mt-5'>
                  <Alert>
                    <p className='text-sm'>{t('Minting Wrong Chain')}</p>
                    <ErrorButton className='text-nowrap p-2 text-xs' onClick={() => updateNetwork(ChainId.BSC)}>
                      {t('Switch Chain')}
                    </ErrorButton>
                  </Alert>
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='mt-3 flex w-full flex-row justify-center gap-4'>
        <EmphasisButton
          className='w-full py-3.5 text-white lg:px-16 lg:py-3'
          disabled={!isValid || loading || isMinting || networkId !== ChainId.BSC}
          onClick={onMint}
        >
          {t('Mint Now')}
        </EmphasisButton>
      </ModalFooter>
    </Modal>
  )
}
