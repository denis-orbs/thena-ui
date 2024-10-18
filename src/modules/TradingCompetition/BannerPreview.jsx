import Image from 'next/image'
import React from 'react'

import { cn } from '@/lib/utils'

export default function BannerPreview({ parentRef, childRef, competition, isView = true, idCanvas, option }) {
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
            )}
          >
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl'>
              <div className='flex justify-center -space-x-10 rtl:space-x-reverse'>
                {(competition?.competitionRules?.tradingTokens || []).slice(0, 4).map(item => (
                  <Image
                    key={item?.address}
                    alt={item?.name}
                    className={cn(
                      'rounded-[50%] border-[10px] border-neutral-600 bg-neutral-600',
                      competition?.competitionRules?.tradingTokens.length <= 3
                        ? '!h-[240px] !w-[240px]'
                        : '!h-[192px] !w-[192px]',
                    )}
                    src={`/logo-token/${item?.logoURI.replace('https://cdn.thena.fi/', '')}`}
                    width={competition?.competitionRules?.tradingTokens.length <= 3 ? 240 : 192}
                    height={competition?.competitionRules?.tradingTokens.length <= 3 ? 240 : 192}
                  />
                ))}
                {competition?.competitionRules?.tradingTokens.length > 4 && (
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-[50%] border-[10px] border-neutral-600',
                      'bg-gradient-primary-end text-4xl font-bold',
                      competition?.competitionRules?.tradingTokens.length <= 3
                        ? '!h-[240px] !w-[240px]'
                        : '!h-[192px] !w-[192px]',
                      isView ? '' : 'pb-8',
                    )}
                  >
                    +{(competition?.competitionRules?.tradingTokens.length || 0) - 4}
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
