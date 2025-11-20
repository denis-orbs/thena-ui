'use client'

import { motion } from 'framer-motion'
import { compact } from 'lodash'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useTranslations } from 'next-intl'
import { useRouter } from 'nextjs-toploader/app'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { ChainId } from 'thena-sdk-core'

import DiscoverModal from '@/app/arena/DiscoverModal'
import { PrimaryButton } from '@/components/buttons/Button'
import Modal, { ModalBody, ModalFooter } from '@/components/modal'
import { BNB_LOGO, LOCALES, NotShowDiscoverArenaModal, THE_LOGO, ThenaAuthToken } from '@/constant'
import { CHAIN_ID } from '@/constant/contracts'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import usePrices from '@/hooks/usePrices'
import { useSignWallet } from '@/hooks/useSignWallet'
import { useSpaceIdBNB } from '@/hooks/useSpaceIdBNB'
import useWallet from '@/hooks/useWallet'
import { useWindowSize } from '@/hooks/useWindowSize'
import ChevronDownIcon from '@/icons/ChevronDownIcon'
import InfoIcon from '@/icons/InfoIcon'
import TxnModal from '@/modules/TxnModal'
import { useChainSettings, useLocaleSettings } from '@/state/settings/hooks'
import cn from '@/utils/classes'
import { formatAmount, goToDoc } from '@/utils/utils'

import Logo from '~/logo.svg'
import LogoMobile from '~/logo-mobile.svg'
import ChevronDownColorIcon from '~/svgs/cheveron-down-color.svg'
import ExternalIcon from '~/svgs/external.svg'
import HamburgerIcon from '~/svgs/hamburger.svg'
import LanguageIcon from '~/svgs/language.svg'
import XIcon from '~/svgs/x-close.svg'

import HeaderConnectButton from '../buttons/HeaderConnectButton'
import { TextIconButton } from '../buttons/IconButton'
import Highlight from '../highlight'
import CircleImage from '../image/CircleImage'
import Skeleton from '../skeleton'
import Tabs from '../tabs'
import { Paragraph, TextHeading, TextSubHeading } from '../typography'
import { HeaderSearch } from '../../modules/Search/HeaderSearch'

const chains = [
  { img: BNB_LOGO, chainId: ChainId.BSC, label: 'BNB Chain' },
  { img: '/images/opbnb.png', chainId: ChainId.OPBNB, label: 'opBNB' },
  // { img: '/images/bsc_test_net.png', chainId: 97, label: 'tBNB' },
  { img: '/images/bridge.png', label: 'Bridge', url: '/bridge' },
]

const langs = [
  { iso: 'en', lang: LOCALES.en, label: 'English' },
  { iso: 'es', lang: LOCALES.es, label: 'Español' },
  { iso: 'ja', lang: LOCALES.ja, label: '日本語' },
  { iso: 'ko', lang: LOCALES.ko, label: '한국어' },
  { iso: 'pt', lang: LOCALES.pt, label: 'Português' },
  { iso: 'th', lang: LOCALES.th, label: 'ภาษาไทย' },
  { iso: 'vi', lang: LOCALES.vi, label: 'Tiếng Việt' },
  { iso: 'zh', lang: LOCALES.zh_CN, label: '简体中文' },
  { iso: 'zh', lang: LOCALES.zh_TW, label: '繁體中文' },
]

function BridgeMaintainModal({ show, onClose }) {
  const windowSize = useWindowSize()

  return (
    <Modal width={windowSize.width >= 1024 ? 520 : '80%'} isOpen={show} closeModal={onClose}>
      <ModalBody className='pt-0'>
        <div className='flex w-full flex-col items-center justify-center gap-4 px-4'>
          <Highlight className='bg-primary-600'>
            <InfoIcon className='size-5 [&>path]:stroke-neutral-100' />
          </Highlight>
          <div className='mt-3'>
            <Paragraph className='text-neutral-50'>
              The current Polyhedra bridge for $THE between opBNB & BNB Chain will{' '}
              <span className='text-primary-600 font-bold'>
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

function ChainSelect({ className, t }) {
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
          'rounded-md p-2 text-neutral-300 transition-all duration-150 ease-out hover:bg-neutral-700 hover:text-neutral-50 lg:p-3',
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
          <CircleImage src={item.img} alt='' className='size-4 lg:size-5' />
          <TextHeading className='!text-xs text-nowrap lg:!text-base'>{t(item.label)}</TextHeading>
        </div>
      </div>
    ),
    [t, networkId, updateNetwork],
  )

  return (
    <div className={cn('relative', className)} ref={wrapperRef}>
      <div
        className={cn(
          'group 2sm:gap-2 2sm:px-3 2sm:py-2 flex cursor-pointer items-center gap-1 rounded-md bg-neutral-700 p-2 hover:bg-neutral-600 lg:gap-4 lg:rounded-lg lg:px-4 lg:py-3',
          open && 'bg-neutral-600',
        )}
        onClick={() => setOpen(!open)}
      >
        <CircleImage src={selected.img} alt='' className='size-4 lg:size-5' />
        <ChevronDownColorIcon
          className={cn(
            '2sm:stroke-neutral-400 size-4 stroke-neutral-100 transition-all duration-150 ease-out group-hover:stroke-neutral-200 lg:size-5',
            open ? 'rotate-180 !stroke-neutral-200' : 'rotate-0',
          )}
        />
      </div>

      <div
        className={cn(
          'visible absolute z-10 mt-2 flex-col items-start justify-start gap-1 max-md:left-0 md:right-0',
          'rounded-xl border border-neutral-600 bg-neutral-800 p-2 opacity-100 shadow',
          'transition-all duration-150 ease-out',
          !open && 'invisible opacity-0',
        )}
      >
        {chains.map((item, idx) => {
          const element = getElement(item, idx)
          if (item.url) {
            return (
              <Link href={item.url} key={`chain-${idx}`}>
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

// eslint-disable-next-line unused-imports/no-unused-vars
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
        className='flex cursor-pointer items-center justify-between rounded-lg border border-neutral-700 bg-neutral-700 py-3 pr-4 pl-3 md:gap-2'
        onClick={() => setOpen(!open)}
      >
        <div className='flex items-center gap-2'>
          <CircleImage src={selected.img} alt='' className='h-5 w-5' />
          <TextHeading>{t(selected.label)}</TextHeading>
        </div>
        <ChevronDownIcon isRevert={open} />
      </div>
      <div
        className={cn(
          'visible absolute z-10 mt-2 w-full flex-col items-start justify-start gap-1',
          'rounded-xl border border-neutral-600 bg-neutral-800 p-2 opacity-100 shadow-xs',
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

function LanguageSelect({ className }) {
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
    <div className={cn('relative cursor-pointer', className)} ref={wrapperRef}>
      <div
        className={cn(
          'max-2sm:bg-neutral-700 max-2sm:text-neutral-100 2sm:gap-2 flex items-center gap-1 rounded-md px-2 py-2 text-xs !leading-4 font-medium text-neutral-400 uppercase hover:text-neutral-100 lg:rounded-lg lg:!leading-5',
          'hover:bg-neutral-700 lg:px-4 lg:py-3 lg:text-base',
          open && 'bg-neutral-700 text-neutral-100',
        )}
        onClick={() => setOpen(!open)}
      >
        <LanguageIcon
          className={cn(
            'max-2sm:stroke-neutral-100 2sm:hidden size-4 cursor-pointer stroke-neutral-400 hover:stroke-neutral-100 lg:block lg:size-5',
            open && 'stroke-neutral-100',
          )}
        />

        {selected.iso}
      </div>
      <div
        className={cn(
          'max-2sm:left-0 2sm:right-0 visible absolute z-50 mt-1.5 flex-col items-start justify-start',
          'rounded-lg border border-neutral-600 bg-neutral-800 p-2',
          'transition-all duration-150 ease-out',
          '!shadow-custom-primary w-[129px]',
          !open && 'invisible opacity-0',
        )}
      >
        {langs.map((item, idx) => (
          <div
            className={cn(
              'inline-flex w-full cursor-pointer flex-col items-start justify-center gap-1',
              'rounded-md px-3 py-2 text-neutral-300 transition-all duration-150 ease-out hover:bg-neutral-700 hover:text-neutral-50 lg:p-3',
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
              <TextHeading className='!text-xs text-nowrap lg:!text-base lg:leading-5'>{item.label}</TextHeading>
              {locale === item.lang && <div className='bg-primary-600 h-2 w-2 rounded-full' />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Header() {
  const { isViewDown: is2SmDown } = useMediaQuery('down', 744)
  const [selected, setSelected] = useState(null)
  const [openMenu, setOpenMenu] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [toggleSearch, setToggleSearch] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const lastScrollYRef = useRef(0)
  const hideTimeoutRef = useRef(null)

  const router = useRouter()
  const { push } = router
  const pathname = usePathname()
  const { account, chainId } = useWallet()
  const { networkId, updateNetwork } = useChainSettings()
  const prices = usePrices()
  const t = useTranslations()
  const { spaceIdName } = useSpaceIdBNB(account)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const lastScrollY = lastScrollYRef.current

      if (currentScrollY < lastScrollY && currentScrollY > 300) {
        setShowBackToTop(true)

        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current)
        }

        // Hide the button after 3 seconds of inactivity
        hideTimeoutRef.current = setTimeout(() => {
          setShowBackToTop(false)
          hideTimeoutRef.current = null
        }, 3000)
      } else {
        setShowBackToTop(false)

        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current)
          hideTimeoutRef.current = null
        }
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  const scrollToTop = () => {
    setShowBackToTop(false)
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

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
        label: t('Trade'),
        active: pathname.includes('/swap'),
        onClickHandler: () => {
          push('/swap')
        },
        sub: [
          {
            heading: t('Spot Trade'),
            subheading: t('Easy and user-friendly trading interface'),
            onClickHandler: () => push('/swap'),
          },
          {
            heading: t('Perps Trade'),
            subheading: t('Easy and user-friendly trading interface'),
            onClickHandler: () => window.open('https://perps.thena.fi', '_blank'),
            isExternal: true,
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
      },
      {
        label: t('Analytics'),
        active: pathname.includes('/analytics'),
        onClickHandler: () => push('/analytics'),
      },
      {
        label: t('Content Studio'),
        active: pathname.includes('/content-studio'),
        onClickHandler: () => push('/content-studio'),
      },
      {
        label: t('More'),
        active: pathname.includes('/story') || pathname.includes('/arena') || pathname.includes('/protocols'),
        onClickHandler: () => {
          push('/protocols')
        },
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
                  isExternal: true,
                },
                {
                  heading: t('Forum'),
                  subheading: t('Discussion for governance proposals'),
                  onClickHandler: () => window.open('https://forum.thena.fi/', '_blank'),
                  isExternal: true,
                },
                {
                  heading: t('Governance'),
                  subheading: t('Vote for governance proposals'),
                  onClickHandler: () => window.open('https://governance.thena.fi/', '_blank'),
                  isExternal: true,
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
                    push('/t2e')
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
                  isExternal: true,
                },
                {
                  heading: t('Forum'),
                  subheading: t('Discussion for governance proposals'),
                  onClickHandler: () => window.open('https://forum.thena.fi/', '_blank'),
                  isExternal: true,
                },
                {
                  heading: t('Governance'),
                  subheading: t('Vote for governance proposals'),
                  onClickHandler: () => window.open('https://governance.thena.fi/', '_blank'),
                  isExternal: true,
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
                    push('/t2e')
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

  const onLogoClick = () => {
    push('/')
    setIsOpen(false)
  }

  useEffect(() => {
    router.prefetch('/swap')
    router.prefetch('/pools')
    router.prefetch('/dashboard')
    router.prefetch('/dashboard/vote')
    router.prefetch('/dashboard/rewards')
    router.prefetch('/dashboard/lock')
    router.prefetch('/analytics')
  }, [router])

  return (
    <div id='headerMaster'>
      <header
        className={cn(
          'shadow-primary max-2sm:bg-neutral-900 2sm:border-b-[2px] 2sm:backdrop-blur-[24px] fixed top-0',
          'z-50 inline-flex h-[72px] w-full flex-col items-start justify-start rounded-b-xl border-b',
          '2sm:h-[80px] border-b-neutral-600 md:h-[92px]',
        )}
      >
        <div
          className={cn(
            '2sm:backdrop-blur-xl 2sm:h-[80px] 2sm:p-6 flex h-[72px] items-center justify-between self-stretch rounded-b-xl p-4 md:h-[92px] lg:px-12',
          )}
        >
          <div className='relative inline-flex items-center gap-6 xl:gap-12 2xl:gap-24'>
            {is2SmDown ? (
              <LogoMobile className='h-10 w-10 cursor-pointer' onClick={() => onLogoClick()} />
            ) : (
              <Logo className='h-6 w-[106px] cursor-pointer' onClick={() => onLogoClick()} />
            )}
            <div className='2sm:inline-flex relative hidden items-center justify-center gap-1 text-xs lg:text-base'>
              {menus.map((item, idx) => (
                <div key={`tab-${idx}`}>
                  <div
                    className='flex items-center justify-center'
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
                          ? 'animated-border-box after:bg-[rgba(18,9,22,1)] hover:after:bg-neutral-800'
                          : '',
                        item.active && 'after:bg-neutral-800',
                        item.disabled && 'disabled:cursor-not-allowed disabled:outline-transparent',
                        openMenu === item.label && 'after:bg-neutral-800',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 cursor-pointer items-center justify-center lg:h-11',
                          'rounded-lg px-3 py-2 font-medium text-neutral-200 lg:px-4 lg:py-3',
                          'outline-2 outline-offset-4 outline-transparent',
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
                          'shadow-custom-primary rounded-xl bg-neutral-800 p-3 opacity-100',
                          'mt-1.5 transition-all duration-150 ease-out lg:mt-3',
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
                            <div className='flex w-full items-center justify-between'>
                              <TextHeading>{subitem.heading}</TextHeading>
                              {subitem.isExternal && (
                                <ExternalIcon
                                  className='h-4 w-4 stroke-neutral-50'
                                  onClick={e => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                  }}
                                />
                              )}
                            </div>
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
            <div className='2sm:hidden flex items-center gap-2 rounded-lg p-0 xl:flex xl:p-3'>
              <CircleImage src={THE_LOGO} alt='' className='h-5 w-5' />
              {prices.THE > 0 ? (
                <Paragraph className='text-sm !leading-4 font-medium lg:text-base lg:!leading-5'>
                  ${formatAmount(prices.THE)}
                </Paragraph>
              ) : (
                <Skeleton className='h-5 w-10' />
              )}
            </div>
            <LanguageSelect className='2sm:block hidden' />
            <ChainSelect t={t} className='2sm:block hidden' />
            {/* <OutlinedButton className='hidden 2xl:flex' onClick={() => window.open('https://perps.thena.fi', '_blank')}>
              {t('Enter ALPHA')}
            </OutlinedButton> */}
            <HeaderConnectButton
              className={cn(
                'flex px-3 py-2 text-xs !leading-4 text-nowrap lg:px-4 lg:py-3 lg:text-base lg:!leading-5',
                spaceIdName || userInfo?.username ? 'max-2sm:bg-transparent flex' : 'max-2sm:hidden',
                !account && is2SmDown && 'max-2sm:flex size-8! p-2!',
              )}
              isMini={!account && is2SmDown}
            />
            <div
              className='2sm:hidden flex size-8 cursor-pointer items-center justify-center rounded-md p-1 group-hover:stroke-neutral-200 group-active:stroke-neutral-200 hover:bg-neutral-700 lg:p-2'
              onClick={() => setIsOpen(true)}
            >
              <HamburgerIcon className='size-5 stroke-neutral-400' />
            </div>
          </div>
        </div>
        <Modal
          isOpen={isOpen && is2SmDown}
          closeModal={() => {
            setIsOpen(false)
          }}
          title={
            <div className='flex items-center gap-1'>
              <ChainSelect t={t} />
              <LanguageSelect />
            </div>
          }
          onClickHandler={() => {
            if (selected) {
              setSelected(null)
            } else {
              onLogoClick()
            }
          }}
          isIntl
          classNames={{ header: '!pt-4', closeButton: 'bg-neutral-700' }}
          background='#281B2E'
          backgroundColor='#281B2E'
          width='100%'
          styles={{
            smallScreen: {
              inset: '0px',
              borderRight: '1px solid #422D4C',
              borderLeft: '1px solid #422D4C',
              borderBottom: '2px solid #422D4C',
              borderRadius: '0 0 12px 12px',
              backgroundColor: '#281B2E',
              padding: '0 0 12px 0',
              overflow: 'auto',
              boxShadow: '0px 7px 32px 0px #2C002A',
            },
            overlay: {
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            },
          }}
          closeButton={
            <TextIconButton className='size-8 bg-neutral-700 !p-2' Icon={XIcon} onClick={() => setIsOpen(false)} />
          }
        >
          <div className='mt-3 inline-flex w-full flex-col items-start justify-start gap-1 px-4'>
            {menus.map((menu, idx) => (
              <React.Fragment key={`menu-${idx}`}>
                <div
                  className='inline-flex cursor-pointer items-center justify-between self-stretch rounded p-3 transition-all hover:bg-neutral-800'
                  onClick={() => {
                    if (menu.onClickHandler) {
                      menu.onClickHandler()
                      setIsOpen(false)
                    } else {
                      setSelected(menu)
                    }
                  }}
                >
                  <div className='flex flex-col gap-1'>
                    <p className='font-medium text-neutral-200'>{menu.label}</p>
                    <TextSubHeading>{menu.subheading}</TextSubHeading>
                  </div>
                  {menu.sub && (
                    <ChevronDownIcon
                      isRevert={selected?.label === menu.label}
                      className='size-4 !stroke-neutral-200 transition-transform duration-300 ease-in-out'
                      onClick={e => {
                        e.stopPropagation()
                        e.preventDefault()
                        if (selected?.label === menu.label) {
                          setSelected(null)
                        } else {
                          setSelected(menu)
                        }
                      }}
                    />
                  )}
                </div>
                {menu.sub && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={
                      selected?.label === menu.label
                        ? { opacity: 1, y: 0, height: 'auto' }
                        : { opacity: 0, y: 0, height: 0 }
                    }
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className='ml-4 flex flex-col gap-4 overflow-hidden'
                  >
                    {menu.sub.map((subitem, subidx) => (
                      <div
                        key={`submenu-${subidx}`}
                        className='cursor-pointer rounded px-4 py-2 hover:bg-neutral-800'
                        onClick={() => {
                          if (subitem.onClickHandler) {
                            subitem.onClickHandler()
                            setIsOpen(false)
                          }
                        }}
                      >
                        <div className='flex w-full items-center justify-between'>
                          <p className='font-medium text-neutral-50'>{subitem.heading}</p>
                          {subitem.isExternal && (
                            <ExternalIcon
                              className='h-4 w-4 stroke-neutral-50'
                              onClick={e => {
                                e.stopPropagation()
                                e.preventDefault()
                              }}
                            />
                          )}
                        </div>
                        <TextSubHeading>{subitem.subheading}</TextSubHeading>
                      </div>
                    ))}
                  </motion.div>
                )}
              </React.Fragment>
            ))}
            <HeaderConnectButton className='w-full' isMobile />
          </div>
        </Modal>
        <TxnModal />
      </header>

      {/* Back to Top Button */}
      <motion.button
        className='fixed bottom-11 z-[9999] flex h-11 items-center justify-center rounded-lg bg-neutral-700 px-4 py-3 shadow-lg lg:hidden'
        onClick={scrollToTop}
        initial={{ opacity: 0, scale: 0.8, y: 20, x: '-50%', left: '50%' }}
        animate={{
          opacity: showBackToTop ? 1 : 0,
          scale: showBackToTop ? 1 : 0.8,
          x: '-50%',
          left: '50%',
          y: showBackToTop ? 0 : 20,
          pointerEvents: showBackToTop ? 'auto' : 'none',
        }}
        transition={{ duration: 0.3 }}
        aria-label='Back to top'
      >
        <div className='flex h-5'>
          <ChevronDownIcon isRevert />
          <span className='ml-2 text-base leading-5 font-medium text-neutral-400'>{t('Back to Top')}</span>
        </div>
      </motion.button>
      {pathname.includes('/arena') && (
        <div className='fixed top-[72px] z-[45] w-full bg-neutral-900 py-4 backdrop-blur-2xl md:top-[92px] lg:py-5'>
          <div className='layout-menu-container flex flex-row items-center justify-between backdrop-blur-2xl'>
            {toggleSearch && is2SmDown ? (
              <HeaderSearch setToggleSearch={setToggleSearch} toggleSearch={toggleSearch} isSmallScreen={is2SmDown} />
            ) : (
              <>
                <Tabs data={arenaSubmenus} itemClassName='text-xs lg:text-base px-1 lg:px-2' />
                <HeaderSearch setToggleSearch={setToggleSearch} toggleSearch={toggleSearch} isSmallScreen={is2SmDown} />
              </>
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
      <Script
        id='widget-dom-id'
        crossOrigin='anonymous'
        src='https://widget.metacrm.inc/static/js/widget-2-8-2.js'
        integrity='sha384-I7RBRzDDERL72YpT/iLLj1Wpcc6Myj5s9EiV3Wx5Fo32SXUOJu5y8RYdOaDM85/o'
        strategy='afterInteractive'
        onLoad={() => {
          window.MetaCRMWidget.init({
            apiKey: 'mqrsxk7605j',
            autoOpenNewNotification: true,
            manualConnect: true,
          })
        }}
        onError={error => {
          console.error('Failed to load widget.js', error)
        }}
      />
    </div>
  )
}

export default Header
