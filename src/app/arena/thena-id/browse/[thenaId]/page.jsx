'use client'

import BigNumber from 'bignumber.js'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { gql } from 'graphql-request'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

import ThenaIdModal from '@/app/arena/profile/ThenaIdModal'
import Box from '@/components/box'
import { EmphasisButton, TertiaryButton, TextButton } from '@/components/buttons/Button'
import ImageThenaId from '@/components/image/ImageThenaId'
import { UserProfileCard } from '@/components/image/UserProfileCard'
import { TextHeading, TextSubHeading } from '@/components/typography'
import { useAssets } from '@/context/assetsContext'
import { useUSDTCostPerToken } from '@/hooks/useThenaIdContract'
import useWallet from '@/hooks/useWallet'
import dayjs from '@/lib/arenaDayjs'
import { readCall } from '@/lib/contractActions'
import { getThenaIDContract } from '@/lib/contracts'
import { v4Client } from '@/lib/graphql'
import { successToast } from '@/lib/notify'
import { formatAmount, fromWei } from '@/lib/utils'
import { ArrowLeftIcon } from '@/svgs'

import TransferModal from './TransferModal'

dayjs.extend(localizedFormat)

const V4_USER_INFO = gql`
  query V4_USER_USERNAME($id: String!) {
    userById(id: $id) {
      id
      username
    }
  }
`
const V4_USERNAME_NFTS = gql`
  query V4_USERNAME_NFTS($username: String) {
    usernameNfts(where: { name_eq: $username }) {
      id
      index
      isGift
      name
      owner {
        id
        avatar
        checkMarkIcon
        isAdmin
        isSuperAdmin
        isVerified
        nameColor
        username
      }
      timestamp
    }
  }
`

const V4_USERNAME_NFT_IS_GIFT = gql`
  query V4_USERNAME_NFT_IS_GIFT($id: String!) {
    usernameNftById(id: $id) {
      id
      index
      isGift
      name
      owner {
        id
        avatar
        checkMarkIcon
        isAdmin
        isSuperAdmin
        isVerified
        nameColor
        username
      }
      timestamp
      giftFrom {
        id
        avatar
        checkMarkIcon
        isAdmin
        isSuperAdmin
        isVerified
        nameColor
        username
      }
    }
  }
`

const fetchUsernameNft = async username => {
  try {
    const { usernameNfts } = await v4Client.request(V4_USERNAME_NFTS, { username: username.toLowerCase() })
    if (usernameNfts.length === 1) {
      const usernameNft = usernameNfts[0]
      if (usernameNft.isGift) {
        const { usernameNftById } = await v4Client.request(V4_USERNAME_NFT_IS_GIFT, {
          id: usernameNft.id.toLowerCase(),
        })
        return usernameNftById
      }
      return usernameNft
    }
    return undefined
  } catch (error) {
    return undefined
  }
}

function ThenaIdPage() {
  const router = useRouter()
  const t = useTranslations()
  const { thenaId } = useParams()
  const { costPerToken } = useUSDTCostPerToken()
  const assets = useAssets()
  const [tokenId, setTokenId] = useState('')
  const { account } = useWallet()
  const [showModal, setShowModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [attributes, setAttributes] = useState(undefined)
  const [currentUserRef, setCurrentUserRef] = useState('')

  useEffect(() => {
    async function getUserRef() {
      try {
        if (account) {
          const { userById } = await v4Client.request(V4_USER_INFO, { id: account.toLowerCase() })
          if (userById && userById.username) {
            setCurrentUserRef(userById.username)
          } else {
            setCurrentUserRef(account.toLowerCase())
          }
        }
      } catch (_) {
        setCurrentUserRef('')
      }
    }

    getUserRef()
  }, [account])

  const thenaIdFormat = useMemo(() => {
    if (thenaId) {
      return decodeURIComponent(thenaId)
    }
    return ''
  }, [thenaId])

  // Only allowed USDT
  const USDTAsset = useMemo(
    () =>
      assets?.find(item => item.address.toLowerCase() === '0x55d398326f99059fF775485246999027B3197955'.toLowerCase()),
    [assets],
  )

  const calculateCost = useCallback(
    thenaIdLength => {
      if (costPerToken) {
        if (costPerToken[new BigNumber(thenaIdLength).toNumber() - 1]) {
          return costPerToken[new BigNumber(thenaIdLength).toNumber() - 1]
        }
        if (new BigNumber(thenaIdLength).toNumber() > costPerToken.length) {
          return costPerToken[costPerToken.length - 1]
        }
      }
      return undefined
    },
    [costPerToken],
  )

  const {
    data: usernameNft,
    isLoading,
    mutate,
  } = useSWR(['username nft', thenaIdFormat], () => fetchUsernameNft(thenaIdFormat), {
    refreshInterval: 30000,
    revalidateOnMount: true,
  })

  const amountToMint = useMemo(async () => {
    const contract = getThenaIDContract()
    const length = await readCall(contract, 'getLength', [thenaIdFormat])
    const cost = calculateCost(length || 0)
    return formatAmount(fromWei(cost, USDTAsset?.decimals))
  }, [USDTAsset?.decimals, calculateCost, thenaIdFormat])

  const getTokenId = useCallback(async () => {
    if (thenaIdFormat && usernameNft) {
      const contract = getThenaIDContract()
      const tokenRes = await readCall(contract, 'usernameToTokenId', [thenaIdFormat])
      setTokenId(new BigNumber(tokenRes).toNumber())
    }
  }, [thenaIdFormat, usernameNft])

  const getImageAttributes = useCallback(async () => {
    if (typeof tokenId === 'number') {
      const contract = getThenaIDContract()
      const res = await readCall(contract, 'tokenURI', [tokenId])
      const imageAttribute = res.split('data:application/json;base64,')[1]
      const decodedData = atob(imageAttribute)
      const jsonData = JSON.parse(decodedData)
      setAttributes(jsonData?.attributes)
    }
  }, [tokenId])

  const onShare = useCallback(() => {
    let link = window.location.href
    if (currentUserRef) {
      const urlLink = new URL(link)
      urlLink.searchParams.set('r', currentUserRef)
      link = urlLink.toString()
    }
    navigator.clipboard.writeText(link)
    successToast(t('Link Has Been Copied'))
  }, [currentUserRef, t])

  useEffect(() => {
    getTokenId()
  }, [getTokenId])

  useEffect(() => {
    getImageAttributes()
  }, [getImageAttributes])

  if (!thenaId) {
    return null
  }

  return (
    <div>
      <div className='sticky top-[128px] z-20 flex min-h-11 items-center justify-between bg-[#120916] bg-opacity-20 px-1 pb-2 pt-4 backdrop-blur-2xl lg:top-[150px] lg:mb-4 lg:pt-10'>
        <TextButton className='pl-0' onClick={() => router.back()} LeadingIcon={ArrowLeftIcon}>
          {t('Back')}
        </TextButton>
      </div>
      <div className='flex flex-col gap-5 md:flex-row md:gap-10'>
        <div className='h-full w-full md:h-[300px] md:w-[300px] lg:h-[350px] lg:w-[350px] xl:h-[400px] xl:w-[400px]'>
          <ImageThenaId name={thenaIdFormat} />
        </div>
        <div className='flex-1'>
          <div className='flex flex-row items-center justify-between'>
            <Link href='/arena/thena-id/browse' className='text-green-400'>
              {t('Thena Id')}
            </Link>
            <div className='flex items-center gap-3'>
              {usernameNft?.owner?.id &&
                account &&
                usernameNft?.owner?.id?.toLowerCase() === account?.toLowerCase() && (
                  <TertiaryButton className='w-full' onClick={() => setShowTransferModal(true)}>
                    {t('Transfer')}
                  </TertiaryButton>
                )}
              <TertiaryButton className='w-full' onClick={onShare}>
                {t('Share')}
              </TertiaryButton>
            </div>
          </div>
          <TextHeading className='my-6 block break-words text-4xl'>{thenaIdFormat}.thena</TextHeading>
          {!isLoading && (
            <>
              {usernameNft ? (
                <div className='flex flex-col gap-6'>
                  <div className='flex w-full flex-row items-center'>
                    <TextSubHeading className='mr-1 block text-base'>{t('Owned By')}</TextSubHeading>
                    <UserProfileCard user={usernameNft.owner} showVerified={usernameNft.owner.isVerified} />
                  </div>
                  {usernameNft.giftFrom && (
                    <div className='flex w-full flex-row items-center'>
                      <TextSubHeading className='mr-1 block text-base'>{t('Gifted By')}</TextSubHeading>
                      <UserProfileCard user={usernameNft.giftFrom} showVerified={usernameNft.giftFrom.isVerified} />
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex flex-wrap items-center gap-1'>
                  {t('This THENA ID')}
                  {USDTAsset?.logoURI && (
                    <div className='flex items-center justify-center'>
                      <span className='font-semibold'>
                        {amountToMint} {USDTAsset?.symbol}
                      </span>
                      <Image
                        alt='token'
                        src={`${USDTAsset.logoURI ?? ''}`}
                        className='flex-shrink-0'
                        width={24}
                        height={24}
                        loading='lazy'
                      />
                    </div>
                  )}
                </div>
              )}
              <div className='mt-6'>
                {usernameNft?.owner ? (
                  usernameNft?.owner?.id.toLowerCase() !== account?.toLowerCase() ? (
                    <Link
                      href={`https://element.market/assets/bsc/0xd8cd3f2e2c97d85bcd5bd47ff3f67ed0060f5b14/${tokenId}`}
                      rel='nofollow noopener'
                      target='_blank'
                    >
                      <EmphasisButton
                        leading={<Image src='/images/icon-button-make-offer.png' width={30} height={30} />}
                      >
                        {t('Make Offer on Element')}
                      </EmphasisButton>
                    </Link>
                  ) : null
                ) : (
                  <EmphasisButton
                    className='flex items-center justify-center space-x-2'
                    onClick={() => setShowModal(true)}
                  >
                    <TextHeading>
                      {t('Mint For')} {amountToMint} {USDTAsset?.symbol}
                    </TextHeading>
                    {USDTAsset?.logoURI && (
                      <Image
                        alt='token'
                        src={`${USDTAsset.logoURI ?? ''}`}
                        className='flex-shrink-0'
                        width={24}
                        height={24}
                        loading='lazy'
                      />
                    )}
                  </EmphasisButton>
                )}
              </div>
            </>
          )}
          {attributes && (
            <>
              <div className='my-6 flex items-center justify-between'>
                <h3>{t('Traits')}</h3>
              </div>
              <div className='grid grid-cols-1 items-center gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {attributes.map(att => (
                  <Box className='flex w-full flex-col gap-4 lg:p-4' key={att.trait_type}>
                    <TextHeading className='mb-2 block text-base capitalize'>{att.trait_type}</TextHeading>
                    {att?.display_type !== 'date' ? (
                      <TextHeading className='mb-2 block text-base'>{att.value}</TextHeading>
                    ) : (
                      <TextHeading className='mb-2 block text-base'>
                        {dayjs(att.value * 1000)
                          .tz()
                          .format('MMM D, YYYY')}{' '}
                        {`${t('at')} `}
                        {dayjs(att.value * 1000)
                          .tz()
                          .format('h:mma')}
                      </TextHeading>
                    )}
                  </Box>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <ThenaIdModal
          tab='get'
          targetAddress={account}
          onClose={() => setShowModal(false)}
          defaultThenaIdsData={[
            {
              id: 1,
              username: thenaIdFormat,
              errorMessage: '',
              cost: undefined,
            },
          ]}
        />
      )}

      {showTransferModal && (
        <TransferModal
          mutate={mutate}
          tokenId={tokenId}
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  )
}

export default ThenaIdPage
