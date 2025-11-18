import Image from 'next/image'
import React, { useCallback, useMemo, useState } from 'react'

import { useAssets } from '@/context/assetsContext'
import cn from '@/utils/classes'

const MARKET_TYPE = {
  SPOT: 'SPOT',
  PERPETUALS: 'PERPETUALS',
}

export default function BannerPreview({ parentRef, childRef, competition, isView = true, idCanvas, option, isActive }) {
  const [backgroundColors, setBackgroundColors] = useState({})
  const assets = useAssets()
  const renderBackgroundColor = useCallback(elementId => {
    const element = document.getElementById(elementId)
    if (!element) return 'transparent'

    const canvas = document.createElement('canvas')
    canvas.width = element.width
    canvas.height = element.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(element, 0, 0, element.width, element.height)
    const centerX = Math.floor(element.width / 2)
    const centerY = 15
    const pixel = ctx.getImageData(centerX, centerY, 1, 1).data
    const rgbColor = `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`
    if (pixel[3] === 0) {
      return 'rgba(255, 255, 255, 255)'
    }
    return rgbColor
  }, [])

  const tokens = useMemo(() => {
    if (competition?.market === MARKET_TYPE.SPOT) {
      return competition?.competitionRules?.tradingTokens || []
    }
    const pairIds = (competition?.competitionRules?.pairIds || []).map(
      item => item?.symbol?.replace(/USDT$/, '') || item?.symbol,
    )

    return (
      assets.filter(ele => (pairIds || []).map(sub => sub?.toLowerCase()).includes(ele?.symbol.toLowerCase())) || []
    )
  }, [
    assets,
    competition?.competitionRules?.pairIds,
    competition?.competitionRules?.tradingTokens,
    competition?.market,
  ])

  const handleImageLoad = useCallback(
    item => {
      const color = renderBackgroundColor(`option2_${item?.address}`)
      setBackgroundColors(prev => ({ ...prev, [item?.address]: color }))
    },
    [renderBackgroundColor],
  )

  const renderMore = useCallback((tokensData, pairs) => {
    if (tokensData.length < pairs.length) {
      return pairs.length - tokensData.length
    }
    return tokensData.length - 4
  }, [])

  if (tokens?.length < 1) {
    return <></>
  }

  return (
    <>
      {option === 1 && (
        <div ref={parentRef}>
          <div
            id={idCanvas}
            ref={childRef}
            className={cn(
              "relative h-[576px] w-[1024px] origin-top-left rounded-xl border-4 border-blue-400 bg-[url('/images/arena/bg-image-share-profile.png')] bg-cover p-3 xl:p-4",
              isView ? '' : 'fixed top-[100vh] left-[100vh] hidden',
              isActive ? 'box-sha box-border rounded-xl border-10 border-white shadow-2xl' : '',
            )}
          >
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl'>
              <div className='flex justify-center gap-10 rtl:flex-row-reverse'>
                {(tokens || []).slice(0, 4).map(item => (
                  <Image
                    key={item?.address}
                    id={`option1_${item?.address}`}
                    alt={item?.name}
                    className={cn(
                      'aspect-square rounded-[50%] border-10 border-neutral-600',
                      tokens.length <= 3 && competition?.competitionRules?.pairIds.length <= 3
                        ? 'h-[240px]! w-[240px]!'
                        : 'h-[192px]! w-[192px]!',
                    )}
                    style={{
                      backgroundColor: backgroundColors[item?.address] || 'transparent',
                    }}
                    src={`/logos/${item?.logoURI.replace('https://cdn.thena.fi/logos/', '')}`}
                    width={tokens.length <= 3 && competition?.competitionRules?.pairIds.length <= 3 ? 240 : 192}
                    height={tokens.length <= 3 && competition?.competitionRules?.pairIds.length <= 3 ? 240 : 192}
                    onLoadingComplete={() => handleImageLoad(item)}
                  />
                ))}
                {(tokens.length > 4 || competition?.competitionRules?.pairIds.length > tokens.length) && (
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-[50%] border-10 border-neutral-600',
                      'gradient-bg text-7xl font-bold',
                      tokens.length <= 3 && competition?.competitionRules?.pairIds.length <= 3
                        ? 'h-[240px]! w-[240px]!'
                        : 'h-[192px]! w-[192px]!',
                      isView ? '' : 'pb-8',
                    )}
                  >
                    {renderMore(tokens, competition?.competitionRules?.pairIds)}+
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className='hidden grid-cols-4' />
      <div className='hidden w-[512px]' />
      {/* 1024/3 */}
      <div className='hidden w-[341.3333333333333px]!' />
      <div className='hidden w-[256px]' />
      {option === 2 && (
        <div ref={parentRef}>
          <div
            id={idCanvas}
            ref={childRef}
            className={cn(
              'relative h-[576px] w-[1024px] origin-top-left rounded-xl bg-cover p-3 xl:p-4',
              isView ? '' : 'fixed top-[100vh] left-[100vh] hidden',
              isActive ? 'box-border rounded-xl border-10 border-white shadow-2xl' : '',
            )}
          >
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl'>
              <div
                className={cn(
                  'grid h-full w-full items-center justify-center',
                  tokens.length <= 4 ? `grid-cols-${tokens.length}` : 'grid-cols-5',
                  tokens.length <= 4 && competition?.competitionRules?.pairIds.length > tokens.length
                    ? `grid-cols-${tokens.length + 1}`
                    : '',
                )}
              >
                {(tokens || []).slice(0, 4).map(item => (
                  <div
                    key={`option2_${item?.address}`}
                    className={cn(
                      'relative flex h-full items-center justify-center px-1',
                      tokens.length <= 4 ? `!w-[${1024 / (tokens.length ?? 1)}px]` : `!w-[${1024 / 5}px]`,
                      tokens.length <= 4 && competition?.competitionRules?.pairIds.length > tokens.length
                        ? `!w-[${1024 / (tokens.length + 1)}px]`
                        : '',
                    )}
                    style={{ backgroundColor: backgroundColors[item?.address] || 'transparent' }}
                  >
                    <Image
                      id={`option2_${item?.address}`}
                      key={item?.address}
                      alt={item?.name}
                      className={cn('relative! aspect-square! h-auto! rounded-[50%] bg-transparent')}
                      src={`/logos/400x400/${item?.logoURI.replace('https://cdn.thena.fi/logos/', '')}`}
                      style={{
                        backgroundColor: backgroundColors[item?.address] || 'transparent',
                      }}
                      onLoadingComplete={() => handleImageLoad(item)}
                      layout='fill'
                      objectFit='contain'
                    />
                  </div>
                ))}
                {(tokens.length > 4 || competition?.competitionRules?.pairIds.length > tokens.length) && (
                  <div
                    className={cn(
                      'flex h-full items-center justify-center',
                      'gradient-bg text-7xl font-bold',
                      `!w-[${1024 / 5}px]`,
                      tokens.length <= 4 && competition?.competitionRules?.pairIds.length > tokens.length
                        ? `!w-[${1024 / (tokens.length + 1)}px]`
                        : '',
                      isView ? '' : 'pb-8',
                    )}
                  >
                    {renderMore(tokens, competition?.competitionRules?.pairIds)}+
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
