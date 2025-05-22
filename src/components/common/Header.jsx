'use client'

import { AuthCoreEvent, getLatestAuthType, isSocialAuthType, particleAuth } from '@particle-network/auth-core'
import { useConnect as useParticleConnect } from '@particle-network/auth-core-modal'
import { compact } from 'lodash'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Script from 'next/script'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'
import { useConnect, useDisconnect } from 'wagmi'

import DiscoverModal from '@/app/arena/DiscoverModal'
import { OutlinedButton, PrimaryButton, TertiaryButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { LOCALES, NotShowBannerV3, NotShowDiscoverArenaModal, ThenaAuthToken } from '@/constant'
import { CHAIN_ID } from '@/constant/contracts'
import { SizeTypes } from '@/constant/type'
import { useTHEStory } from '@/context/THEStoryContext'
import usePrices from '@/hooks/usePrices'
import { useSignWallet } from '@/hooks/useSignWallet'
import useWallet from '@/hooks/useWallet'
import { useWindowSize } from '@/hooks/useWindowSize'
import { cn, formatAmount, goToDoc, isSmallScreen } from '@/lib/utils'
import TxnModal from '@/modules/TxnModal'
import { useChainSettings, useLocaleSettings } from '@/state/settings/hooks'
import { ArrowRightIcon, ChevronDownIcon, HamburgerIcon, InfoNeutralIcon } from '@/svgs'
import { particleWagmiWallet } from '@/wallets/particleWallet/particleWagmiWallet'

import Logo from '~/logo.svg'

import { Notification } from './Notification'
import ConnectButton from '../buttons/ConnectButton'
import Highlight from '../highlight'
import CircleImage from '../image/CircleImage'
import Skeleton from '../skeleton'
import Tabs from '../tabs'
import { Paragraph, TextHeading, TextSubHeading } from '../typography'
import { HeaderSearch } from '../../modules/Search/HeaderSearch'

const chains = [
  { img: '/images/bsc.png', chainId: ChainId.BSC, label: 'BNB Chain' },
  { img: '/images/opbnb.png', chainId: ChainId.OPBNB, label: 'opBNB' },
  // { img: '/images/bsc_test_net.png', chainId: 97, label: 'tBNB' },
  { img: '/images/bridge.png', label: 'Bridge', url: 'https://thena.zkbridge.com/' },
]

const langs = [
  { img: '/images/en.png', lang: LOCALES.en, label: 'English' },
  { img: '/images/zh.png', lang: LOCALES.zh, label: '中文' },
]

function BridgeMaintainModal({ show, onClose }) {
  const windowSize = useWindowSize()

  return (
    <Modal width={windowSize.width >= 1024 ? 520 : '80%'} isOpen={show} closeModal={onClose}>
      <ModalBody className='pt-0'>
        <div className='flex w-full flex-col items-center justify-center gap-4 px-4'>
          <Highlight className='bg-primary-600'>
            <InfoNeutralIcon className='size-5 [&>path]:stroke-neutral-100' />
          </Highlight>
          <div className='mt-3'>
            <Paragraph className='text-neutral-50'>
              The current Polyhedra bridge for $THE between opBNB & BNB Chain will{' '}
              <span className='font-bold text-primary-600'>
                stop working permanently on April 21, 2025, at 3:00 AM UTC
              </span>{' '}
              due to provider changes and network upgrades. Please complete any necessary $THE transfers before this
              time. Our own bridge solution will launch by the end of April.
            </Paragraph>
            <div className='mt-4 flex flex-col gap-1'>
              <Paragraph className='text-neutral-50'>
                The official Binance bridge remains operational and can be accessed at any time to bridge other assets:
              </Paragraph>
              <Link
                className='text-primary-600 hover:underline'
                href='https://opbnb-bridge.bnbchain.org/'
                target='_blank'
              >
                https://opbnb-bridge.bnbchain.org/
              </Link>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className='mt-2 flex items-center justify-center gap-2 py-4'>
        {/* <PrimaryButton className='w-32' onClick={onClose}>
          OK
        </PrimaryButton> */}
        <Link href='https://opbnb-bridge.bnbchain.org/' target='_blank'>
          <PrimaryButton className='w-32 text-neutral-100' onClick={onClose}>
            OK
          </PrimaryButton>
        </Link>
      </ModalFooter>
    </Modal>
  )
}

function ChainSelect({ t }) {
  const wrapperRef = useRef(null)
  const { networkId, updateNetwork } = useChainSettings()

  const [open, setOpen] = useState(false)
  const [showBridgePopup, setShowBridgePopup] = useState(false)

  const selected = useMemo(
    () => chains[networkId === ChainId.BSC ? 0 : networkId === ChainId.OPBNB ? 1 : 2],
    [networkId],
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [wrapperRef])

  const getElement = useCallback(
    (item, idx) => (
      <div
        className={cn(
          'inline-flex w-full cursor-pointer flex-col items-start justify-center gap-1',
          'rounded-md p-3 text-neutral-300 transition-all duration-150 ease-out hover:bg-neutral-700 hover:text-neutral-50',
        )}
        key={`dropdown-${idx}-${item.chainId}`}
        onClick={async () => {
          if (item.chainId && networkId !== item.chainId) {
            updateNetwork(item.chainId)
          }
          setOpen(false)
        }}
      >
        <div className='flex w-full items-center gap-2'>
          <CircleImage src={item.img} alt='' className='h-5 w-5' />
          <TextHeading className='text-nowrap'>{t(item.label)}</TextHeading>
        </div>
      </div>
    ),
    [t, networkId, updateNetwork],
  )

  return (
    <div className={cn('relative hidden lg:block')} ref={wrapperRef}>
      <div
        className='flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-700 py-3 pl-3 pr-4 lg:pl-1.5 lg:pr-2.5 xl:pl-3 xl:pr-4'
        onClick={() => setOpen(!open)}
      >
        <CircleImage src={selected.img} alt='' className='h-5 w-5' />
        <ChevronDownIcon
          className={cn('transfrom h-5 w-5 transition-all duration-150 ease-out', open ? 'rotate-180' : 'rotate-0')}
        />
      </div>
      <div
        className={cn(
          'visible absolute right-0 z-10 mt-2 flex-col items-start justify-start gap-1',
          'rounded-xl border border-neutral-600 bg-neutral-800 p-2 opacity-100 shadow',
          'transition-all duration-150 ease-out',
          !open && 'invisible opacity-0',
        )}
      >
        {chains.map((item, idx) => {
          const element = getElement(item, idx)
          if (item.label === 'Bridge') {
            return (
              <div key={`chain-${idx}`} onClick={() => setShowBridgePopup(true)}>
                {element}
              </div>
            )
          }
          if (item.url) {
            return (
              <Link href={item.url} target='_blank' key={`chain-${idx}`}>
                {element}
              </Link>
            )
          }
          return element
        })}
      </div>

      {showBridgePopup && <BridgeMaintainModal show={showBridgePopup} onClose={() => setShowBridgePopup(false)} />}
    </div>
  )
}

function ChainMobileSelect({ t }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const { networkId, updateNetwork } = useChainSettings()

  const selected = useMemo(
    () => chains[networkId === ChainId.BSC ? 0 : networkId === ChainId.OPBNB ? 1 : 2],
    [networkId],
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [wrapperRef])

  return (
    <div className={cn('relative block w-full lg:hidden')} ref={wrapperRef}>
      <div
        className='flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-neutral-700 bg-neutral-700 py-3 pl-3 pr-4'
        onClick={() => setOpen(!open)}
      >
        <div className='flex items-center gap-2'>
          <CircleImage src={selected.img} alt='' className='h-5 w-5' />
          <TextHeading>{t(selected.label)}</TextHeading>
        </div>
        <ChevronDownIcon
          className={cn('transfrom h-5 w-5 transition-all duration-150 ease-out', open ? 'rotate-180' : 'rotate-0')}
        />
      </div>
      <div
        className={cn(
          'visible absolute z-10 mt-2 w-full flex-col items-start justify-start gap-1',
          'rounded-xl border border-neutral-600 bg-neutral-800 p-2 opacity-100 shadow',
          'transition-all duration-150 ease-out',
          !open && 'invisible opacity-0',
        )}
      >
        {chains.map((item, idx) => (
          <div
            className={cn(
              'inline-flex w-full cursor-pointer flex-col items-start justify-center gap-1',
              'rounded-md p-3 text-neutral-300 transition-all duration-150 ease-out hover:bg-neutral-700 hover:text-neutral-50',
            )}
            key={`dropdown-${idx}`}
            onClick={async () => {
              if (networkId !== item.chainId) {
                updateNetwork(item.chainId)
              }
              setOpen(false)
            }}
          >
            <div className='flex items-center gap-2'>
              <CircleImage src={item.img} alt='' className='h-4 w-4' />
              <TextHeading className='text-nowrap'>{t(item.label)}</TextHeading>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// eslint-disable-next-line unused-imports/no-unused-vars
function LanguageSelect() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const { locale, updateLanguage } = useLocaleSettings()

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [wrapperRef])

  const selected = useMemo(() => langs.find(ele => ele.lang === locale), [locale])

  return (
    <div className={cn('relative')} ref={wrapperRef}>
      <CircleImage
        alt='lang'
        className='mx-2 h-5 w-5 cursor-pointer'
        src={selected.img}
        onClick={() => setOpen(!open)}
      />
      <div
        className={cn(
          'visible absolute right-0 z-10 mt-2 flex-col items-start justify-start gap-1',
          'rounded-xl border border-neutral-600 bg-neutral-800 p-2 opacity-100 shadow',
          'transition-all duration-150 ease-out',
          !open && 'invisible opacity-0',
        )}
      >
        {langs.map((item, idx) => (
          <div
            className={cn(
              'inline-flex w-full cursor-pointer flex-col items-start justify-center gap-1',
              'rounded-md p-3 text-neutral-300 transition-all duration-150 ease-out hover:bg-neutral-700 hover:text-neutral-50',
            )}
            key={`dropdown-${idx}`}
            onClick={async () => {
              if (locale !== item.lang) {
                updateLanguage(item.lang)
              }
              setOpen(false)
            }}
          >
            <div className='flex items-center gap-2'>
              <CircleImage src={item.img} alt={item.lang} className='h-5 w-5' />
              <TextHeading className='text-nowrap'>{item.label}</TextHeading>
              {locale === item.lang && <div className='h-2 w-2 rounded-full bg-primary-600' />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function V3Banner({ onClose }) {
  const router = useRouter()
  const { push } = router
  useEffect(() => {
    document.body.classList.add('has-v3-banner')
    return () => {
      document.body.classList.remove('has-v3-banner')
    }
  }, [])

  return (
    <div
      id='v3-banner'
      className='fixed left-0 top-0 z-[100] flex h-[116px] w-full items-center justify-between bg-[#2a002a] px-4 py-2 text-sm font-medium text-white md:h-[54px]'
    >
      <div className='flex flex-1 flex-col items-center justify-center gap-2 md:flex-row'>
        <span className='min-w-fit font-semibold'>🔥 THENA V3,3 is Launched!</span>
        <span className='text-center font-normal'>
          Voting begins on May 22, and $THE emissions will migrate to new gauges on May 29.
        </span>
        <TertiaryButton
          className='h-9 min-w-fit border-none text-sm md:h-11 [&>svg>path]:stroke-primary-600'
          onClick={() => push('/dashboard')}
        >
          Migrate Now <ArrowRightIcon className='ml-1 h-4 w-4' />
        </TertiaryButton>
      </div>
      <button
        onClick={onClose}
        type='button'
        data-drawer-hide='v3-banner'
        aria-controls='v3-banner'
        className='inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-neutral-400'
      >
        <svg
          aria-hidden='true'
          className='h-5 w-5'
          fill='currentColor'
          viewBox='0 0 20 20'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            fillRule='evenodd'
            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
            clipRule='evenodd'
          />
        </svg>
        <span className='sr-only'>Close</span>
      </button>
    </div>
  )
}

function Header() {
  const [selected, setSelected] = useState(null)
  const [openMenu, setOpenMenu] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [toggleSearch, setToggleSearch] = useState(false)

  const router = useRouter()
  const { push } = router
  const pathname = usePathname()
  const { account, chainId } = useWallet()
  const { networkId, updateNetwork } = useChainSettings()
  const prices = usePrices()
  const t = useTranslations()
  // start: fix social auth login
  const { connect } = useConnect()
  const { connectionStatus } = useParticleConnect()
  const { disconnect } = useDisconnect()
  const { width } = useWindowSize()

  const [showBannerMigrate, setShowBannerMigrate] = useState(
    !localStorage.getItem(NotShowBannerV3) && new Date() >= new Date('2025-05-22'),
  )
  const handleCloseV3Banner = () => {
    localStorage.setItem(NotShowBannerV3, 'true')
    window.dispatchEvent(new Event('local-storage-changed'))
    setShowBannerMigrate(false)
  }

  useEffect(() => {
    if (connectionStatus === 'connected' && isSocialAuthType(getLatestAuthType())) {
      connect({
        connector: particleWagmiWallet({ socialType: getLatestAuthType() }),
      })
    }
    const onDisconnect = () => {
      disconnect()
    }
    particleAuth.on(AuthCoreEvent.ParticleAuthDisconnect, onDisconnect)
    return () => {
      particleAuth.off(AuthCoreEvent.ParticleAuthDisconnect, onDisconnect)
    }
  }, [connect, connectionStatus, disconnect])
  // end: fix social auth login

  const { isUpcoming, isRegistered } = useTHEStory()
  const { signWallet } = useSignWallet()

  useEffect(() => {
    if (account) {
      localStorage.removeItem(ThenaAuthToken)
    }
  }, [account, signWallet])

  useEffect(() => {
    if ([ChainId.BSC, ChainId.OPBNB].includes(chainId) && chainId !== networkId) {
      updateNetwork(chainId)
    }
  }, [account, chainId, networkId, updateNetwork])

  const { data: userInfo } = useSWR(['fetchUserInfo', account])

  useEffect(() => {
    if (window?.MetaCRMWidget?.manualConnectWallet) {
      window.MetaCRMWidget.manualConnectWallet(account)
    }

    if (window?.MetaCRMTracking?.manualConnectWallet) {
      window.MetaCRMTracking.manualConnectWallet(account)
    }

    const handleConnectWidget = () => {
      window.MetaCRMWidget.manualConnectWallet(account)
    }
    document.addEventListener('MetaCRMLoaded', handleConnectWidget)

    return () => {
      document.removeEventListener('MetaCRMLoaded', handleConnectWidget)
    }
  }, [account])

  const menus = useMemo(
    () => [
      {
        label: t('Swap'),
        active: pathname.includes('/swap'),
        sub: [
          {
            heading: t('Spot Trade'),
            subheading: t('Easy and user-friendly trading interface'),
            onClickHandler: () => push('/swap'),
          },
          {
            heading: t('Trade Perps'),
            subheading: t('Trade perpetual contracts with leverage'),
            onClickHandler: () => window.open('https://alpha.thena.fi', '_blank'),
          },
          {
            heading: t('Cross-Chain'),
            subheading: t('Trade across different blockchains'),
            onClickHandler: () => {
              if (window.innerWidth > 768) {
                push('/swap/cross')
              } else {
                // Create and trigger a link element instead of using window.open
                const link = document.createElement('a')
                link.href = 'http://squidrouter.thena.fi/'
                link.target = '_blank'
                link.rel = 'noopener noreferrer' // Add security best practice
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }
            },
          },
          {
            heading: t('Buy Crypto'),
            subheading: t('On-ramp from fiat to crypto'),
            onClickHandler: () => push('/swap/buy'),
          },
        ],
      },
      {
        label: t('Pools'),
        active: pathname.includes('/pools'),
        onClickHandler: () => {
          push('/pools')
        },
      },
      {
        label: t('Dashboard'),
        active: pathname.includes('/dashboard'),
        sub: [
          {
            heading: t('veTHE'),
            subheading: t('veTHE Subheading'),
            onClickHandler: () => push('/dashboard/lock'),
          },
          {
            heading: t('theNFT'),
            subheading: t('theNFT Description'),
            onClickHandler: () => push('/dashboard/thenft'),
          },
          {
            heading: t('Vote'),
            subheading: t('Vote Subheading'),
            onClickHandler: () => {
              push('/dashboard/vote')
            },
          },
          {
            heading: t('Rewards'),
            subheading: t('Rewards Subheading'),
            onClickHandler: () => {
              push('/dashboard/rewards')
            },
          },
        ],
        onClickHandler: () => {
          push('/dashboard')
        },
      },
      {
        label: t('Analytics'),
        active: pathname.includes('/analytics'),
        onClickHandler: () => push('/analytics'),
      },
      {
        label: 'More',
        active: pathname.includes('/story') || pathname.includes('/arena') || pathname.includes('/protocols'),
        sub:
          networkId === ChainId.BSC || networkId === CHAIN_ID.TEST_BSC
            ? [
                {
                  heading: t('Protocols'),
                  subheading: t('Add gauges and voting incentives'),
                  onClickHandler: () => push('/protocols'),
                },
                {
                  heading: t('Docs'),
                  subheading: t('Learn more about THENA'),
                  onClickHandler: () => {
                    goToDoc()
                  },
                },
                {
                  heading: t('Forum'),
                  subheading: t('Discussion for governance proposals'),
                  onClickHandler: () => window.open('https://forum.thena.fi/', '_blank'),
                },
                {
                  heading: t('Governance'),
                  subheading: t('Vote for governance proposals'),
                  onClickHandler: () => window.open('https://governance.thena.fi/', '_blank'),
                },
                {
                  heading: t('Arena'),
                  subheading: t('Trading Competitions (to be updated)'),
                  onClickHandler: () => {
                    push('/arena')
                  },
                },
                {
                  heading: 'T2E',
                  subheading: t('Trade2Earn (Ended)'),
                  onClickHandler: () => {
                    push('/trade-to-earn')
                  },
                },
                {
                  heading: 'THE Story',
                  subheading: t('Campaign (Ended)'),
                  onClickHandler: () => {
                    push('/story')
                  },
                },
              ]
            : [
                {
                  heading: t('Docs'),
                  subheading: t('Learn more about THENA'),
                  onClickHandler: () => {
                    goToDoc()
                  },
                },
                {
                  heading: t('Forum'),
                  subheading: t('Discussion for governance proposals'),
                  onClickHandler: () => window.open('https://forum.thena.fi/', '_blank'),
                },
                {
                  heading: t('Governance'),
                  subheading: t('Vote for governance proposals'),
                  onClickHandler: () => window.open('https://governance.thena.fi/', '_blank'),
                },
                {
                  heading: t('Arena'),
                  subheading: t('Trading Competitions (to be updated)'),
                  onClickHandler: () => {
                    push('/arena')
                  },
                },
                {
                  heading: 'T2E',
                  subheading: t('Trade2Earn (Ended)'),
                  onClickHandler: () => {
                    push('/trade-to-earn')
                  },
                },
                {
                  heading: 'THE Story',
                  subheading: t('Campaign (Ended)'),
                  onClickHandler: () => {
                    push('/story')
                  },
                },
              ],
      },
    ],
    [t, pathname, networkId, push],
  )

  // const submenus = useMemo(() => {
  //   const subs = [
  //     {
  //       label: 'My Assets',
  //       active: pathname === '/dashboard',
  //       onClickHandler: () => {
  //         push('/dashboard')
  //       },
  //     },
  //     {
  //       label: 'Lock',
  //       active: pathname.includes('/dashboard/lock'),
  //       onClickHandler: () => {
  //         push('/dashboard/lock')
  //       },
  //     },
  //     {
  //       label: 'Vote',
  //       active: pathname === '/dashboard/vote',
  //       href: '/dashboard/vote',
  //       isLink: true,
  //     },
  //     {
  //       label: 'Rewards',
  //       active: pathname === '/dashboard/rewards',
  //       onClickHandler: () => {
  //         push('/dashboard/rewards')
  //       },
  //     },
  //     {
  //       label: 'theNFT',
  //       active: pathname === '/dashboard/thenft',
  //       onClickHandler: () => {
  //         push('/dashboard/thenft')
  //       },
  //     },
  //   ]
  //   return networkId === ChainId.OPBNB ? subs.slice(0, 1) : subs
  // }, [pathname, networkId, push])

  const arenaSubmenus = useMemo(
    () =>
      compact([
        {
          label: 'Competitions',
          active: pathname === '/arena',
          isLink: true,
          href: '/arena',
        },
        {
          label: 'Rankings',
          active: pathname === '/arena/rankings' || pathname === '/arena/rankings/competitions',
          isLink: true,
          href: '/arena/rankings/users',
          isSub: true,
          classNameSub: 'min-w-[250px]',
          sub: [
            {
              label: 'User Rankings',
              active: pathname === '/arena/rankings/users',
              isLink: true,
              href: '/arena/rankings/users',
            },
            {
              label: 'Competition Rankings',
              active: pathname === '/arena/rankings/competitions',
              isLink: true,
              href: '/arena/rankings/competitions',
            },
          ],
        },
        {
          label: 'THENA ID',
          active:
            pathname === '/arena/thena-id/mint' ||
            pathname === '/arena/thena-id/gift' ||
            pathname === '/arena/thena-id/recently-minted' ||
            pathname === '/arena/thena-id/recently-gifted' ||
            pathname.includes('/arena/thena-id/browse'),
          isLink: true,
          href: '/arena/thena-id/mint',
        },

        {
          label: 'More',
          active:
            pathname.includes('/achievements') ||
            pathname.includes('/profile') ||
            pathname.includes('/analytics') ||
            pathname.includes('/admin'),
          isSub: true,
          classNameSub: 'min-w-[150px] right-0',
          sub: [
            {
              label: 'Analytics',
              active: pathname === '/arena/analytics',
              isLink: true,
              href: '/arena/analytics',
            },
            account
              ? {
                  label: 'Achievements',
                  active: pathname === '/arena/achievements',
                  isLink: true,
                  href: '/arena/achievements',
                }
              : undefined,
            account
              ? {
                  label: 'Profile',
                  active:
                    pathname === '/arena/profile' ||
                    pathname === '/arena/profile/edit' ||
                    pathname === '/arena/profile/following' ||
                    pathname === '/arena/profile/followers',
                  isLink: true,
                  href: '/arena/profile',
                }
              : undefined,
            account && userInfo && userInfo.id && (userInfo.isAdmin || userInfo.isSuperAdmin)
              ? {
                  label: 'Admin',
                  active: pathname === '/arena/admin',
                  isLink: true,
                  href: '/arena/admin',
                }
              : undefined,
          ],
        },
      ]),
    [account, pathname, userInfo],
  )

  // isRegister, !isUpcoming
  const storySubmenus1 = useMemo(
    () =>
      compact([
        {
          label: 'Chapters',
          active: pathname === '/story',
          onClickHandler: () => {
            push('/story')
          },
        },
        {
          label: 'Profile',
          active: pathname === '/story/profile',
          onClickHandler: () => {
            push('/story/profile')
          },
        },
        {
          label: 'Leaderboard',
          active: pathname === '/story/leaderboard',
          onClickHandler: () => {
            push('/story/leaderboard')
          },
        },
        {
          label: 'Referral',
          active: pathname === '/story/referral',
          onClickHandler: () => {
            push('/story/referral')
          },
        },
        {
          label: 'Rewards',
          active: pathname === '/story/rewards',
          onClickHandler: () => {
            push('/story/rewards')
          },
        },
        account && userInfo && userInfo.id && (userInfo.isAdmin || userInfo.isSuperAdmin)
          ? {
              label: 'User Stats',
              active: pathname === '/story/userstats',
              isLink: true,
              href: '/story/userstats',
            }
          : undefined,
      ]),
    [account, pathname, push, userInfo],
  )

  // isRegister && isUpcoming
  const storySubmenus2 = useMemo(
    () =>
      compact([
        {
          label: 'Home',
          active: pathname === '/story',
          onClickHandler: () => {
            push('/story')
          },
        },
        {
          label: 'Chapters',
          active: pathname === '/story/chapters',
          onClickHandler: () => {
            push('/story/chapters')
          },
        },
      ]),
    [pathname, push],
  )

  const onLogoClick = () => {
    push('/')
    setIsOpen(false)
  }

  useEffect(() => {
    // Prefetch the dashboard page
    router.prefetch('/')
    router.prefetch('/swap')
    router.prefetch('/pools')
    router.prefetch('/dashboard')
    router.prefetch('/analytics')
    router.prefetch('/protocols')
    router.prefetch('/arena')
  }, [router])

  return (
    <div>
      {showBannerMigrate && <V3Banner onClose={handleCloseV3Banner} />}
      <header
        className={cn(
          'fixed top-0 z-50 inline-flex h-[64px] w-full flex-col items-start justify-start bg-opacity-20 backdrop-blur-2xl md:h-[92px]',
          showBannerMigrate && 'top-[116px] md:top-[54px]',
        )}
      >
        <div
          className={cn(
            'flex h-[64px] items-center justify-between self-stretch p-4 backdrop-blur-xl md:h-[92px] lg:px-10 lg:pb-6 lg:pt-6',
            !pathname.includes('/add-liquidity') && 'lg:pt-3',
          )}
        >
          <div className='relative inline-flex items-center gap-6 xl:gap-12 2xl:gap-24'>
            <Logo className='h-6 w-[106px] cursor-pointer' onClick={() => onLogoClick()} />
            <div className='relative hidden items-center justify-center gap-1 lg:inline-flex'>
              {/* {!pathname.includes('/add-liquidity') ? (

              ) : (
                <></>
              )} */}
              {menus.map((item, idx) => (
                <div key={`tab-${idx}`}>
                  <div
                    className='flex items-center justify-center py-3'
                    onMouseEnter={() => {
                      setOpenMenu(item.label)
                    }}
                    onMouseLeave={() => {
                      setOpenMenu(null)
                    }}
                  >
                    <div
                      className={cn(
                        item.isHighlight
                          ? 'animated-border-box after:bg-[rgba(18,9,22,1)] hover:after:bg-neutral-800 '
                          : '',
                        item.active && 'after:bg-neutral-800',
                        item.disabled && 'disabled:cursor-not-allowed disabled:outline-transparent',
                        openMenu === item.label && 'after:bg-neutral-800',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-11 cursor-pointer items-center justify-center',
                          'rounded-lg px-4 py-2.5 font-medium text-neutral-200 lg:px-2 xl:px-4',
                          'outline outline-2 outline-offset-4 outline-transparent',
                          'transition-all duration-150 ease-out',
                          !item.isHighlight && 'hover:bg-neutral-800',
                          !item.isHighlight && item.active && 'bg-neutral-800',
                          !item.isHighlight &&
                            item.disabled &&
                            'disabled:cursor-not-allowed disabled:outline-transparent',
                          !item.isHighlight && openMenu === item.label && 'bg-neutral-800',
                        )}
                        onClick={() => item.onClickHandler && item.onClickHandler()}
                      >
                        {item.label}
                      </span>
                    </div>
                  </div>
                  {item.sub && (
                    <div
                      className='relative'
                      onMouseEnter={() => {
                        setOpenMenu(item.label)
                      }}
                      onMouseLeave={() => {
                        setOpenMenu(null)
                      }}
                    >
                      <div
                        className={cn(
                          'visible absolute w-[344px] flex-col items-start justify-start gap-1',
                          'rounded-xl border border-neutral-600 bg-neutral-800 p-3 opacity-100 shadow',
                          'transition-all duration-150 ease-out',
                          openMenu !== item.label && 'invisible opacity-0',
                        )}
                      >
                        {item.sub.map((subitem, subidx) => (
                          <div
                            className={cn(
                              'inline-flex h-[68px] w-full cursor-pointer flex-col items-start justify-center gap-1',
                              'rounded-lg p-3 transition-all duration-150 ease-out hover:bg-neutral-700',
                            )}
                            key={`sub-${subidx}`}
                            onClick={() => {
                              if (subitem.onClickHandler) {
                                subitem.onClickHandler()
                                setOpenMenu(false)
                              }
                            }}
                          >
                            <TextHeading>{subitem.heading}</TextHeading>
                            <TextSubHeading>{subitem.subheading}</TextSubHeading>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className='inline-flex items-center gap-2'>
            <div className='flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-700 p-2 lg:py-2.5 xl:px-3'>
              <CircleImage src='https://cdn.thena.fi/assets/THE.png' alt='' className='h-4 w-4 lg:h-5 lg:w-5' />
              {prices.THE > 0 ? (
                <Paragraph className='text-xs font-medium lg:text-base'>${formatAmount(prices.THE)}</Paragraph>
              ) : (
                <Skeleton className='h-5 w-10' />
              )}
            </div>
            <ChainSelect t={t} />
            {/* <LanguageSelect /> */}
            <OutlinedButton className='hidden 2xl:flex' onClick={() => window.open('https://alpha.thena.fi', '_blank')}>
              {t('Enter ALPHA')}
            </OutlinedButton>
            {!isSmallScreen() && <ConnectButton className='flex' />}
            {!pathname.includes('/add-liquidity') || width < 1024 ? (
              <>
                {!pathname.includes('/add-liquidity') && <Notification />}
                <TextIconButton className='lg:hidden' Icon={HamburgerIcon} onClick={() => setIsOpen(true)} />
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
        <Modal
          isOpen={isOpen}
          closeModal={() => {
            setIsOpen(false)
          }}
          title={selected ? selected.label : <Logo className='h-6 w-[106px] cursor-pointer' />}
          isBack={!!selected}
          onClickHandler={() => {
            if (selected) {
              setSelected(null)
            } else {
              onLogoClick()
            }
          }}
          isIntl={!selected}
        >
          {selected ? (
            <div className='inline-flex w-full flex-col items-start justify-start gap-3 p-3'>
              {selected &&
                selected.sub.map((submenu, idx) => (
                  <div
                    className='flex h-[68px] cursor-pointer flex-col items-start justify-center gap-1 self-stretch rounded-lg p-3 transition-all hover:bg-neutral-800'
                    key={`submenu-${idx}`}
                    onClick={() => {
                      if (submenu.onClickHandler) {
                        submenu.onClickHandler()
                        setIsOpen(false)
                      }
                    }}
                  >
                    <TextHeading>{submenu.heading}</TextHeading>
                    <TextSubHeading>{submenu.subheading}</TextSubHeading>
                  </div>
                ))}
            </div>
          ) : (
            <>
              <div className='inline-flex w-full flex-col items-start justify-start gap-3 p-3'>
                {menus.map((menu, idx) => (
                  <div
                    className='inline-flex cursor-pointer items-center justify-between self-stretch rounded p-3 transition-all hover:bg-neutral-800'
                    key={`menu-${idx}`}
                    onClick={() => {
                      if (menu.onClickHandler) {
                        menu.onClickHandler()
                        setIsOpen(false)
                      } else {
                        setSelected(menu)
                      }
                    }}
                  >
                    <p className='font-medium text-neutral-200'>{menu.label}</p>
                    {menu.sub && <ArrowRightIcon className='h-4 w-4' />}
                  </div>
                ))}
              </div>
              <ModalFooter className='flex flex-col gap-2'>
                <ChainMobileSelect t={t} />
                <OutlinedButton onClick={() => window.open('https://alpha.thena.fi', '_blank')}>
                  {t('Enter ALPHA')}
                </OutlinedButton>
                <ConnectButton className='w-full' />
              </ModalFooter>
            </>
          )}
        </Modal>
        <TxnModal />
      </header>
      {/* {pathname.startsWith('/dashboard') && (
        <div className='fixed top-[64px] z-[45] w-full bg-neutral-900 p-4 backdrop-blur-2xl lg:top-[92px] lg:flex lg:px-60 lg:py-5'>
          <Tabs data={submenus} size={SizeTypes.Medium} />
        </div>
      )} */}
      {pathname.includes('/arena') && (
        <div
          className={cn(
            'fixed top-[64px] z-[45] w-full bg-neutral-900 py-4 backdrop-blur-2xl lg:top-[92px] lg:py-5',
            showBannerMigrate && 'top-[170px] lg:top-[146px]',
          )}
        >
          <div className='layout-menu-container flex flex-row items-center justify-between backdrop-blur-2xl'>
            {toggleSearch && isSmallScreen() ? (
              <HeaderSearch
                setToggleSearch={setToggleSearch}
                toggleSearch={toggleSearch}
                isSmallScreen={isSmallScreen()}
              />
            ) : (
              <>
                <Tabs data={arenaSubmenus} itemClassName='text-xs lg:text-base px-1 lg:px-2' />
                <HeaderSearch
                  setToggleSearch={setToggleSearch}
                  toggleSearch={toggleSearch}
                  isSmallScreen={isSmallScreen()}
                />
              </>
            )}
          </div>
        </div>
      )}
      {pathname.startsWith('/story') && isRegistered && (
        <div
          className={cn(
            'fixed top-[64px] z-[45] w-full bg-neutral-900 py-4 backdrop-blur-2xl max-sm:overflow-x-scroll lg:top-[92px] lg:py-5',
            showBannerMigrate && 'top-[170px] lg:top-[146px]',
          )}
        >
          <div className='layout-menu-container flex flex-row justify-between backdrop-blur-2xl'>
            {!isUpcoming && (
              <Tabs data={storySubmenus1} size={SizeTypes.Medium} itemClassName='text-xs lg:text-base px-1 lg:px-2' />
            )}
            {isUpcoming && (
              <Tabs data={storySubmenus2} size={SizeTypes.Medium} itemClassName='text-xs lg:text-base px-1 lg:px-2' />
            )}
          </div>
        </div>
      )}
      {pathname.startsWith('/arena') && (
        <DiscoverModal
          keyOpen={NotShowDiscoverArenaModal}
          text={
            <>
              <TextHeading className='font-archia text-3xl text-neutral-50 lg:text-5xl'>
                {t('Discover ARENA heading')}
              </TextHeading>
              <TextSubHeading className='text-[16px] text-neutral-300 lg:text-[18px]'>
                {t('Discover ARENA sub heading')}
              </TextSubHeading>
            </>
          }
          showLearnMore
        />
      )}

      {/* {(pathname.startsWith('/pools') || pathname.startsWith('/analytics')) && (
        <DiscoverModal
          keyOpen={NotShowDiscoverPoolsAnalyticsModal}
          text={
            <>
              <div className='inline-flex w-full items-center justify-between px-4 pb-3 pt-6 lg:px-6'>
                <div className='flex w-full'>
                  <div className='mx-auto text-center  font-archia text-xl font-semibold text-neutral-50 lg:text-3xl'>
                    {t('Warning')}
                  </div>
                </div>
              </div>
              <TextSubHeading className='text-[16px] text-neutral-300 lg:text-[18px]'>
                {t('Discover pools analytics description')}
              </TextSubHeading>
            </>
          }
          showLearnMore={false}
        />
      )} */}
      <Script
        id='widget-dom-id'
        src='https://widget.metacrm.inc/static/js/widget.js'
        onLoad={() => {
          window.MetaCRMWidget.init({
            apiKey: 'mqrsxk7605j',
          })
        }}
      />
    </div>
  )
}

export default Header
