import Image from 'next/image'
import React, { useCallback, useState } from 'react'

import { cn } from '@/lib/utils'

export default function BannerPreview({ parentRef, childRef, competition, isView = true, idCanvas, option, isActive }) {
  const [backgroundColors, setBackgroundColors] = useState({})
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

  const handleImageLoad = useCallback(
    item => {
      const color = renderBackgroundColor(`option2_${item?.address}`)
      setBackgroundColors(prev => ({ ...prev, [item?.address]: color }))
    },
    [renderBackgroundColor],
  )

  return (
    <>
      {option === 1 && (
        <div ref={parentRef}>
          <div
            id={idCanvas}
            ref={childRef}
            className={cn(
              "relative h-[576px]  w-[1024px] origin-top-left rounded-xl bg-[url('/images/arena/bg-image-share-profile.png')] bg-cover p-3 xl:p-4",
              isView ? '' : 'fixed left-[100vh] top-[100vh] hidden',
              isActive ? 'box-sha box-border rounded-xl border-[10px] border-white shadow-2xl' : '',
            )}
          >
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl'>
              <div className='flex justify-center -space-x-10 rtl:space-x-reverse'>
                {(competition?.competitionRules?.tradingTokens || []).slice(0, 4).map(item => (
                  <Image
                    key={item?.address}
                    id={`option1_${item?.address}`}
                    alt={item?.name}
                    className={cn(
                      'aspect-square rounded-[50%] border-[10px] border-neutral-600',
                      competition?.competitionRules?.tradingTokens.length <= 3
                        ? '!h-[240px] !w-[240px]'
                        : '!h-[192px] !w-[192px]',
                    )}
                    style={{
                      backgroundColor: backgroundColors[item?.address] || 'transparent',
                    }}
                    src={`/logo-token/${item?.logoURI.replace('https://cdn.thena.fi/', '')}`}
                    width={competition?.competitionRules?.tradingTokens.length <= 3 ? 240 : 192}
                    height={competition?.competitionRules?.tradingTokens.length <= 3 ? 240 : 192}
                    onLoadingComplete={() => handleImageLoad(item)}
                  />
                ))}
                {competition?.competitionRules?.tradingTokens.length > 4 && (
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-[50%] border-[10px] border-neutral-600',
                      'gradient-bg text-7xl font-bold',
                      competition?.competitionRules?.tradingTokens.length <= 3
                        ? '!h-[240px] !w-[240px]'
                        : '!h-[192px] !w-[192px]',
                      isView ? '' : 'pb-8',
                    )}
                  >
                    {(competition?.competitionRules?.tradingTokens.length || 0) - 4}+
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {option === 2 && (
        <div ref={parentRef}>
          <div
            id={idCanvas}
            ref={childRef}
            className={cn(
              'relative h-[576px]  w-[1024px] origin-top-left rounded-xl bg-cover p-3 xl:p-4',
              isView ? '' : 'fixed left-[100vh] top-[100vh] hidden',
              isActive ? 'box-border rounded-xl border-[10px] border-white shadow-2xl' : '',
            )}
          >
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl'>
              <div
                className={cn(
                  'grid h-full w-full items-center justify-center',
                  competition?.competitionRules?.tradingTokens.length <= 4
                    ? `grid-cols-${competition?.competitionRules?.tradingTokens.length}`
                    : 'grid-cols-5',
                )}
              >
                {(competition?.competitionRules?.tradingTokens || []).slice(0, 4).map(item => (
                  <div
                    key={`option2_${item?.address}`}
                    className={cn(
                      'relative flex h-full items-center justify-center px-1',
                      competition?.competitionRules?.tradingTokens.length <= 4
                        ? `!w-[${1024 / (competition?.competitionRules?.tradingTokens.length ?? 1)}px]`
                        : `!w-[${1024 / 5}px]`,
                    )}
                    style={{ backgroundColor: backgroundColors[item?.address] || 'transparent' }}
                  >
                    <Image
                      id={`option2_${item?.address}`}
                      key={item?.address}
                      alt={item?.name}
                      className={cn('!relative !aspect-square !h-auto rounded-[50%] bg-transparent')}
                      src={`/logo-token/${item?.logoURI.replace('https://cdn.thena.fi/', '')}`}
                      style={{
                        backgroundColor: backgroundColors[item?.address] || 'transparent',
                      }}
                      onLoadingComplete={() => handleImageLoad(item)}
                      layout='fill'
                      objectFit='contain'
                    />
                  </div>
                ))}
                {competition?.competitionRules?.tradingTokens.length > 4 && (
                  <div
                    className={cn(
                      'flex h-full items-center justify-center',
                      'gradient-bg text-7xl font-bold',
                      `!w-[${1024 / 5}px]`,
                      isView ? '' : 'pb-8',
                    )}
                  >
                    {(competition?.competitionRules?.tradingTokens.length || 0) - 4}+
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
