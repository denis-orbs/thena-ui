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
import { EmphasisButton, OutlinedButton, PrimaryButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { LOCALES, NotShowDiscoverArenaModal, ThenaAuthToken } from '@/constant'
import { SizeTypes } from '@/constant/type'
import { useTHEStory } from '@/context/THEStoryContext'
import usePrices from '@/hooks/usePrices'
import { useSignWallet } from '@/hooks/useSignWallet'
import useWallet from '@/hooks/useWallet'
import { useWindowSize } from '@/hooks/useWindowSize'
import { cn, formatAmount, goToDoc, isSmallScreen } from '@/lib/utils'
import { LiquidityHubSeekingBetterPriceModal } from '@/modules/LiquidityHub/components'
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
          <Paragraph className='mt-3 text-neutral-50'>
            Bridge service will be entering maintenance mode on{' '}
            <span className='font-bold text-primary-600'>March 19, 2025 at 10:00 AM UTC</span> to align with the BNB
            Chain's Pascal Hard Fork upgrade. It is best advised not to use the bridge until the update is completed.
            Thank you for your patience and understanding.
          </Paragraph>
        </div>
      </ModalBody>
      <ModalFooter className='mt-2 flex items-center justify-center gap-2 py-4'>
        <PrimaryButton className='w-32' onClick={onClose}>
          OK
        </PrimaryButton>
        <Link href='https://thena.zkbridge.com/' target='_blank'>
          <EmphasisButton className='w-full text-neutral-100' onClick={onClose}>
            Proceed Anyway
          </EmphasisButton>
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

  const selected = useMemo(() => chains[networkId === ChainId.BSC ? 0 : 1], [networkId])

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
        key={`dropdown-${idx}`}
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
          // if (item.label === 'Bridge') {
          //   return (
          //     <div key={`chain-${idx}`} onClick={() => setShowBridgePopup(true)}>
          //       {element}
          //     </div>
          //   )
          // }
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

  const selected = useMemo(() => chains[networkId === ChainId.BSC ? 0 : 1], [networkId])

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
        onClickHandler: () => {
          push('/dashboard')
        },
      },
      {
        label: t('Arena'),
        active: pathname.includes('/arena'),
        onClickHandler: () => {
          push('/arena')
        },
      },
      {
        label: 'THE Story',
        active: pathname.includes('/story'),
        onClickHandler: () => {
          push('/story')
        },
      },
      {
        label: 'More',
        active: pathname.includes('/analytics') || pathname.includes('/protocols'),
        sub:
          networkId === ChainId.BSC
            ? [
                {
                  heading: t('Analytics'),
                  subheading: t('See platform data'),
                  onClickHandler: () => push('/analytics'),
                },
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
                  heading: 'T2E',
                  subheading: t('Trade2Earn (Ended)'),
                  onClickHandler: () => {
                    push('/trade-to-earn')
                  },
                },
              ]
            : [
                {
                  heading: t('Analytics'),
                  subheading: t('See platform data'),
                  onClickHandler: () => push('/analytics'),
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
                  heading: 'T2E',
                  subheading: t('Trade2Earn (Ended)'),
                  onClickHandler: () => {
                    push('/trade-to-earn')
                  },
                },
              ],
      },
    ],
    [t, pathname, networkId, push],
  )

  const submenus = useMemo(() => {
    const subs = [
      {
        label: 'My Assets',
        active: pathname === '/dashboard',
        onClickHandler: () => {
          push('/dashboard')
        },
      },
      {
        label: 'Lock',
        active: pathname === '/dashboard/lock',
        onClickHandler: () => {
          push('/dashboard/lock')
        },
      },
      {
        label: 'Vote',
        active: pathname === '/dashboard/vote',
        onClickHandler: () => {
          push('/dashboard/vote')
        },
      },
      {
        label: 'Rewards',
        active: pathname === '/dashboard/rewards',
        onClickHandler: () => {
          push('/dashboard/rewards')
        },
      },
      {
        label: 'theNFT',
        active: pathname === '/dashboard/thenft',
        onClickHandler: () => {
          push('/dashboard/thenft')
        },
      },
    ]
    return networkId === ChainId.OPBNB ? subs.slice(0, 1) : subs
  }, [pathname, networkId, push])

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
      <header className='fixed top-0 z-50 inline-flex h-[64px] w-full flex-col items-start justify-start bg-opacity-20 backdrop-blur-2xl lg:h-[92px]'>
        <div className='flex items-center justify-between self-stretch p-4 backdrop-blur-xl lg:px-10 lg:pb-6 lg:pt-3'>
          <div className='relative inline-flex items-center gap-6 xl:gap-12 2xl:gap-24'>
            <Logo className='h-6 w-[106px] cursor-pointer' onClick={() => onLogoClick()} />
            <div className='relative hidden items-center justify-center gap-1 lg:inline-flex'>
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
            <LanguageSelect />
            <OutlinedButton className='hidden 2xl:flex' onClick={() => window.open('https://alpha.thena.fi', '_blank')}>
              {t('Enter ALPHA')}
            </OutlinedButton>
            {!isSmallScreen() && <ConnectButton className='flex' />}
            <Notification />
            <TextIconButton className='lg:hidden' Icon={HamburgerIcon} onClick={() => setIsOpen(true)} />
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
        <LiquidityHubSeekingBetterPriceModal />
      </header>
      {pathname.startsWith('/dashboard') && (
        <div className='fixed top-[64px] z-[45] w-full bg-neutral-900 p-4 backdrop-blur-2xl lg:top-[92px] lg:flex lg:px-60 lg:py-5'>
          <Tabs data={submenus} size={SizeTypes.Medium} />
        </div>
      )}
      {pathname.includes('/arena') && (
        <div className='fixed top-[64px] z-[45] w-full bg-neutral-900 py-4 backdrop-blur-2xl lg:top-[92px] lg:py-5'>
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
        <div className='fixed top-[64px] z-[45] w-full bg-neutral-900 py-4 backdrop-blur-2xl max-sm:overflow-x-scroll lg:top-[92px] lg:py-5'>
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
