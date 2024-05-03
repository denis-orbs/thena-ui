import BigNumber from 'bignumber.js'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import CheckBox from '@/components/checkbox'
import NextImage from '@/components/image/NextImage'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import useDebounce from '@/hooks/useDebounce'
import { useGiftThenaId, useMintThenaId, useUSDTCostPerToken, useValidateUserName } from '@/hooks/useThenaIdContract'
import { cn, formatAmount, fromWei } from '@/lib/utils'
import { CheckCircleIcon } from '@/svgs'

export default function ThenaIdModal({ tab, targetAddress, onClose }) {
  const t = useTranslations()
  const [type, setType] = useState(tab)
  const [thenaId, setThenaId] = useState('')
  const [address, setAddress] = useState(targetAddress)
  const assets = useAssets()
  const [errors, setErrors] = useState({})
  const [estimateCost, setEstimateCost] = useState()
  const { costPerToken, loading } = useUSDTCostPerToken()

  // Only allowed USDT
  const USDTAsset = useMemo(
    () =>
      assets.find(item => item.address.toLowerCase() === '0x55d398326f99059fF775485246999027B3197955'.toLowerCase()),
    [assets],
  )

  const { loading: gifting, giftThenaId } = useGiftThenaId()
  const { loading: minting, buyThenaId } = useMintThenaId()

  const debounceThenaId = useDebounce(thenaId, 500)

  const { validate } = useValidateUserName()

  useEffect(() => {
    const calculateCost = thenaIdLength => {
      if (costPerToken[new BigNumber(thenaIdLength).toNumber() - 1]) {
        return costPerToken[new BigNumber(thenaIdLength).toNumber() - 1]
      }
      if (new BigNumber(thenaIdLength).toNumber() > costPerToken.length) {
        return costPerToken[costPerToken.length - 1]
      }
      return undefined
    }
    if (debounceThenaId) {
      validate(debounceThenaId).then(data => {
        const errorMessages = {}
        if (!data.valid) {
          errorMessages.thenaId = t('Invalid Thena Id', { thenaId: debounceThenaId })
        }
        if (!data.available) {
          errorMessages.thenaId = t('Thena Id Is Taken', { thenaId: debounceThenaId })
        }
        if (!errorMessages.thenaId) {
          setEstimateCost(calculateCost(data.length))
        } else {
          setEstimateCost(undefined)
        }
        setErrors(errorMessages)
      })
    } else {
      setErrors({})
      setEstimateCost(undefined)
    }
  }, [costPerToken, debounceThenaId, errors, t, validate])

  const onMint = useCallback(async () => {
    if (!Object.keys(errors).length) {
      if (type === 'gift') {
        await giftThenaId(thenaId, address)
      } else {
        await buyThenaId(thenaId, estimateCost)
      }
    }
  }, [errors, type, giftThenaId, thenaId, address, buyThenaId, estimateCost])

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

                <Input
                  onChange={e => {
                    setThenaId(e.target.value)
                  }}
                  type='text'
                  value={thenaId || ''}
                  placeholder='Type Your Id'
                  TrailingIcon={!errors?.thenaId && debounceThenaId.length ? <CheckCircleIcon /> : null}
                  classNames={{
                    input: errors?.thenaId ? 'border-error-500' : undefined,
                  }}
                />
                {errors?.thenaId && (
                  <Paragraph className='ml-1 mt-1 text-sm text-error-500'>{errors?.thenaId}</Paragraph>
                )}
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
                {estimateCost && USDTAsset && (
                  <div className='flex items-center gap-2'>
                    <NextImage src={USDTAsset?.logoURI} alt='' className='h-5 w-5' />
                    <Paragraph>
                      {formatAmount(fromWei(estimateCost, USDTAsset?.decimals))} {USDTAsset?.symbol}
                    </Paragraph>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='mt-3 flex w-full flex-row justify-center gap-4'>
        <EmphasisButton
          className='w-full py-3.5 text-white lg:px-16 lg:py-3'
          disabled={!thenaId || loading || gifting || minting}
          onClick={onMint}
        >
          {t('Mint Now')}
        </EmphasisButton>
      </ModalFooter>
    </Modal>
  )
}
