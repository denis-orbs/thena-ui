import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

import { EmphasisButton } from '@/components/buttons/Button'
import CheckBox from '@/components/checkbox'
import CircleImage from '@/components/image/CircleImage'
import NextImage from '@/components/image/NextImage'
import Input from '@/components/input'
import LabelTooltip from '@/components/label/LabelTooltip'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { Paragraph, TextHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import useDebounce from '@/hooks/useDebounce'
import { useCalculateCost, useValidateUserName } from '@/hooks/useThenaIdContract'
import { cn, formatAmount } from '@/lib/utils'
import CustomTokenModal from '@/modules/TokenModal/CustomTokenModal'

export default function ThenaIdModal({ tab, targetAddress, onClose }) {
  const t = useTranslations()
  const [type, setType] = useState(tab)
  const [thenaId, setThenaId] = useState('')
  const [address, setAddress] = useState(targetAddress)
  console.log(address)
  const [token, setToken] = useState()
  const assets = useAssets()
  const [openSelectToken, setOpenSelectToken] = useState(false)
  const [invalidUsername, setInvalidUsername] = useState(false)
  const [usernameIsTaken, setUsernameIsTaken] = useState(false)
  const [estimateCost, setEstimateCost] = useState()

  const debounceToken = useDebounce(token, 500)
  const debounceThenaId = useDebounce(thenaId, 500)

  const { calculate } = useCalculateCost()
  const { validate } = useValidateUserName()

  useEffect(() => {
    if (debounceToken?.address && debounceThenaId) {
      calculate(debounceThenaId, debounceToken.address).then(cost => setEstimateCost(cost))
    }
    if (debounceThenaId) {
      validate(debounceThenaId).then(data => {
        if (data) {
          setInvalidUsername(!data.valid)
          setUsernameIsTaken(!data.available)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceThenaId, debounceToken?.address])

  const onMint = useCallback(() => {}, [])

  return (
    <Modal isOpen={!!tab} title='Mint Thena Id' closeModal={onClose} fontSizeTitle='text-xl' width={540}>
      <ModalBody className='p-2'>
        <div className='rounded-lg'>
          <div className='mt-[9px] flex grid grid-cols-1 items-center gap-4 md:grid-cols-2 lg:mt-2.5'>
            <div
              onClick={() => setType('get')}
              className={cn(
                'flex min-h-[115px] cursor-pointer items-center gap-2.5 rounded-lg border border-primary-800 p-6',
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
                'flex min-h-[115px] cursor-pointer items-center gap-2.5 rounded-lg border border-primary-800 p-6',
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
                />
                {invalidUsername || usernameIsTaken ? <></> : null}
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
                  />
                </div>
              )}
              <div className='mt-5 w-full'>
                <LabelTooltip label='Select Token For Payment' />
                <div className='relative flex cursor-pointer items-center' onClick={() => setOpenSelectToken(true)}>
                  <div
                    className='w-full rounded-lg border border-neutral-700 bg-neutral-700 py-3.5 pl-4 pr-8 text-neutral-50
                  placeholder-neutral-400 transition-all duration-150 ease-out focus:border-neutral-500'
                  >
                    {token ? (
                      <div className='flex items-center space-x-1.5'>
                        <CircleImage src={token.logoURI} width={20} height={20} alt='thena token' />
                        <TextHeading>{token.symbol}</TextHeading>
                      </div>
                    ) : (
                      'Select'
                    )}
                  </div>
                  <div className='absolute bottom-0 right-3 top-0 my-auto h-5 w-5'>
                    <Image src='/svgs/chevron-down.svg' alt='down icon' width={20} height={20} />
                  </div>
                </div>
              </div>
              <div className='flex:col mt-5 flex w-full items-center justify-between'>
                <LabelTooltip label='Total Price' tooltip='' showInfoIcon className='mb-0' />
                {estimateCost && token && (
                  <div className='flex items-center gap-2'>
                    <NextImage src={token?.logoURI} alt='' className='h-5 w-5' />
                    <Paragraph>
                      {formatAmount(estimateCost)} {token?.symbol}
                    </Paragraph>
                  </div>
                )}
              </div>
            </div>
            <CustomTokenModal
              popup={openSelectToken}
              setPopup={setOpenSelectToken}
              setSelectedAsset={setToken}
              assets={assets}
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='mt-3 flex w-full flex-row justify-center gap-4'>
        <EmphasisButton className='w-full py-3.5 text-white lg:px-16 lg:py-3' onClick={onMint}>
          {t('Mint Now')}
        </EmphasisButton>
      </ModalFooter>
    </Modal>
  )
}
