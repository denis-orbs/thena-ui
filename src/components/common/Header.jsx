'use client'

import { useWeb3Modal } from '@web3modal/wagmi/react'
import { usePathname, useRouter } from 'next/navigation'
import Script from 'next/script'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChainId } from 'thena-sdk-core'
import { useDisconnect } from 'wagmi'

import { EmphasisButton, OutlinedButton, PrimaryButton, TextButton } from '@/components/buttons/Button'
import { TextIconButton } from '@/components/buttons/IconButton'
import Modal, { ModalFooter } from '@/components/modal'
import { SizeTypes } from '@/constant/type'
import { cn, formatAddress, goToDoc } from '@/lib/utils'
import useWallet from '@/lib/wallets/useWallet'
import TxnModal from '@/modules/TxnModal'
import { useChainSettings } from '@/state/settings/hooks'
import { ArrowRightIcon, ChevronDownIcon, HamburgerIcon, PowerIcon } from '@/svgs'

import Logo from '~/logo.svg'

import CircleImage from '../image/CircleImage'
import Tabs from '../tabs'
import { TextHeading, TextSubHeading } from '../typography'

const data = [
  { img: '/images/bsc.png', chainId: ChainId.BSC, label: 'BNB Chain' },
  { img: '/images/opbnb.png', chainId: ChainId.OPBNB, label: 'opBNB' },
]

function ChainSelect() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const { networkId, updateNetwork } = useChainSettings()

  const selected = useMemo(() => data[networkId === ChainId.BSC ? 0 : 1], [networkId])

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
    <div className={cn('relative hidden lg:block')} ref={wrapperRef}>
      <div
        className='flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-700 py-3 pl-3 pr-4'
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
        {data.map((item, idx) => (
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
              <TextHeading className='text-nowrap'>{item.label}</TextHeading>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChainMobileSelect() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const { networkId, updateNetwork } = useChainSettings()

  const selected = useMemo(() => data[networkId === ChainId.BSC ? 0 : 1], [networkId])

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
          <TextHeading>{selected.label}</TextHeading>
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
        {data.map((item, idx) => (
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
              <TextHeading className='text-nowrap'>{item.label}</TextHeading>
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
  const router = useRouter()
  const { push } = router
  const pathname = usePathname()
  const { open } = useWeb3Modal()
  const { account, chainId } = useWallet()
  const { disconnect } = useDisconnect()
  const { networkId, updateNetwork } = useChainSettings()

  useEffect(() => {
    if ([ChainId.BSC, ChainId.OPBNB].includes(chainId) && chainId !== networkId) {
      updateNetwork(chainId)
    }
  }, [account, chainId, networkId, updateNetwork])

  useEffect(() => {
    if (window?.MetaCRMWidget?.manualConnectWallet) {
      window.MetaCRMWidget.manualConnectWallet(account)
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
        label: 'Swap',
        active: pathname.includes('/swap'),
        sub: [
          {
            heading: 'Spot Trade',
            subheading: 'Easy & user-friendly trading interface',
            onClickHandler: () => push('/swap'),
          },
          {
            heading: 'Trade perps',
            subheading: ' Trade perpetual contracts with leverage',
            onClickHandler: () => window.open('https://alpha.thena.fi', '_blank'),
          },
          {
            heading: 'Cross-chain',
            subheading: 'Trade across different blockchains',
            onClickHandler: () => push('/swap/cross'),
          },
          {
            heading: 'Buy crypto',
            subheading: 'On-ramp from fiat to crypto',
            onClickHandler: () => push('/swap/buy'),
          },
        ],
      },
      {
        label: 'Pools',
        active: pathname.includes('/pools'),
        onClickHandler: () => {
          push('/pools')
        },
      },
      {
        label: 'Dashboard',
        active: pathname.includes('/dashboard'),
        onClickHandler: () => {
          push('/dashboard')
        },
      },
      // {
      //   label: 'Arena',
      //   active: pathname === '/arena',
      //   onClickHandler: () => {
      //     push('/arena')
      //   },
      // },
      {
        label: 'More',
        active: pathname.includes('/analytics') || pathname.includes('/protocols'),
        sub:
          networkId === ChainId.BSC
            ? [
                {
                  heading: 'Analytics',
                  subheading: 'See the data of the platform & pairs',
                  onClickHandler: () => push('/analytics'),
                },
                {
                  heading: 'Protocols',
                  subheading: 'Add bribes & voting incentives',
                  onClickHandler: () => push('/protocols'),
                },
                {
                  heading: 'Docs',
                  subheading: 'Learn more about THENA',
                  onClickHandler: () => {
                    goToDoc()
                  },
                },
              ]
            : [
                {
                  heading: 'Analytics',
                  subheading: 'See the data of the platform & pairs',
                  onClickHandler: () => push('/analytics'),
                },
                {
                  heading: 'Docs',
                  subheading: 'Learn more about THENA',
                  onClickHandler: () => {
                    goToDoc()
                  },
                },
              ],
      },
    ],
    [pathname, networkId, push],
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
  }, [pathname, push, networkId])

  const onLogoClick = () => {
    push('/')
    setIsOpen(false)
  }

  const onConnect = useCallback(() => {
    open()
  }, [open])

  const onDisconnect = useCallback(() => {
    disconnect()
  }, [disconnect])

  useEffect(() => {
    // Prefetch the dashboard page
    router.prefetch('/')
    router.prefetch('/swap')
    router.prefetch('/pools')
    router.prefetch('/dashboard')
    router.prefetch('/analytics')
    router.prefetch('/protocols')
  }, [router])

  return (
    <div>
      <header className='fixed top-0 z-50 inline-flex h-[64px] w-full flex-col items-start justify-start bg-opacity-20 backdrop-blur-2xl lg:h-[92px]'>
        <div className='flex items-center justify-between self-stretch p-4 backdrop-blur-xl lg:px-10 lg:pb-6 lg:pt-3'>
          <div className='relative inline-flex items-center gap-20'>
            <Logo className='h-6 w-[106px] cursor-pointer' onClick={() => onLogoClick()} />
            <div className='relative hidden items-center justify-center gap-1 lg:inline-flex'>
              {menus.map((item, idx) => (
                <div key={`tab-${idx}`}>
                  <div
                    className='py-3'
                    onMouseEnter={() => {
                      setOpenMenu(item.label)
                    }}
                    onMouseLeave={() => {
                      setOpenMenu(null)
                    }}
                  >
                    <span
                      className={cn(
                        'flex h-11 cursor-pointer items-center justify-center',
                        'rounded-lg px-4 py-2.5 font-medium text-neutral-200',
                        'outline outline-2 outline-offset-4 outline-transparent',
                        'transition-all duration-150 ease-out',
                        'hover:bg-neutral-800',
                        item.active && 'bg-neutral-800',
                        item.disabled && 'disabled:cursor-not-allowed disabled:outline-transparent',
                        openMenu === item.label && 'bg-neutral-800',
                      )}
                      onClick={() => item.onClickHandler && item.onClickHandler()}
                    >
                      {item.label}
                    </span>
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
            <ChainSelect />
            <OutlinedButton responsive onClick={() => window.open('https://alpha.thena.fi', '_blank')}>
              Enter ALPHA
            </OutlinedButton>
            {account ? (
              <>
                <EmphasisButton responsive className='hidden lg:inline-flex' onClick={onConnect}>
                  {formatAddress(account)}
                </EmphasisButton>
                <TextIconButton Icon={PowerIcon} onClick={onDisconnect} />
              </>
            ) : (
              <PrimaryButton responsive onClick={onConnect}>
                Connect Wallet
              </PrimaryButton>
            )}
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
                <ChainMobileSelect />
                <OutlinedButton onClick={() => window.open('https://alpha.thena.fi', '_blank')}>
                  Enter ALPHA
                </OutlinedButton>
                {account ? (
                  <>
                    <EmphasisButton onClick={onConnect}>{formatAddress(account)}</EmphasisButton>
                    <TextButton LeadingIcon={PowerIcon} onClick={onDisconnect}>
                      Disconnect
                    </TextButton>
                  </>
                ) : (
                  <PrimaryButton onClick={onConnect}>Connect Wallet</PrimaryButton>
                )}
              </ModalFooter>
            </>
          )}
        </Modal>
        <TxnModal />
      </header>
      {pathname.includes('/dashboard') && (
        <div className='fixed top-[64px] z-[45] w-full bg-neutral-900 p-4 backdrop-blur-2xl lg:top-[92px] lg:flex lg:px-60 lg:py-5'>
          <Tabs data={submenus} size={SizeTypes.Medium} />
        </div>
      )}
      <Script
        id='widget-dom-id'
        src='https://widget.metacrm.inc/static/js/widget-1-1-1.js'
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
