'use client'

import React, { useMemo } from 'react'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import useSWRImmutable from 'swr/immutable'
import 'swiper/css'
import 'swiper/css/pagination'

import { Heading } from './Common/Heading'
import HomeImage from './Common/HomeImage'

function Updates() {
  const { data } = useSWRImmutable(
    'home/medium',
    async () => {
      const url = 'https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/@ThenaFi/feed'
      const response = await fetch(url)
      const res = await response.json()

      return res.items
    },
    {
      refreshInterval: 0,
    },
  )
  const blogData = useMemo(() => {
    if (!data) return []
    return data.map(ele => {
      const firstIndex = ele.description.indexOf('https:')
      const lastIndex = ele.description.indexOf('"></figure>')
      return {
        ...ele,
        image: ele.description.slice(firstIndex, lastIndex),
      }
    })
  }, [data])
  return (
    <div className='relative mx-auto mt-12 w-full max-w-[1152px] lg:mt-[187px]'>
      <div className='flex flex-col items-center justify-center'>
        <div className='w-full max-w-[506px] px-10 xl:px-0'>
          <Heading
            title='Updates'
            heading='Insights from THENA'
            wrapperStyles='items-center'
            headingExtraSytles='text-center'
          />
        </div>
        {/* <div className='mt-12 hidden lg:grid lg:grid-cols-2 lg:gap-x-6 xl:grid-cols-3'>
          {updatesData.map((item, idx) => {
            return (
              <div
                className='group relative z-10 overflow-hidden rounded-xl  bg-transparent p-px transition-opacity after:absolute after:left-0 after:top-0 after:h-full  after:w-full after:bg-gradient-to-b after:from-[#BE01B7] after:to-transparent after:opacity-0 after:transition-opacity after:duration-300 after:ease-linear after:content-[""] hover:after:opacity-100'
                key={idx}
              >
                <div className='relative z-20 rounded-xl bg-[rgba(26,13,31,0.45)]  px-5 pb-8 pt-5 transition-all duration-300 group-hover:bg-[rgba(26,13,31,0.98)]'>
                  <div className='overflow-hidden rounded'>
                    <img
                      alt='blog'
                      src={item.img}
                      className='w-full transform rounded transition-all duration-300 ease-linear group-hover:scale-110'
                    />
                  </div>
                  <p className='mt-6 text-ellipsis font-archia text-lg font-medium leading-6 tracking-[0.54px] transition-all duration-300 ease-linear group-hover:mt-5'>
                    {item.heading}
                  </p>
                  <p className='mt-4 text-sm leading-5 text-white/[0.45]'>{item.description}</p>
                </div>
              </div>
            )
          })}
        </div> */}
        <div className='mt-10 w-full pl-10 md:px-0'>
          <Swiper
            pagination
            breakpoints={{
              320: {
                slidesPerView: 1.2,
                spaceBetween: 12,
              },
              480: {
                slidesPerView: 2,
                spaceBetween: 12,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 12,
              },
            }}
            modules={[Pagination]}
            grabCursor
            className='updates-swiper !w-full !pb-10 md:pb-0'
          >
            {blogData.slice(0, 3).map((item, idx) => (
              <SwiperSlide key={idx}>
                <div className='group relative z-10 overflow-hidden rounded-xl  bg-transparent p-px transition-opacity after:absolute after:left-0 after:top-0 after:h-full  after:w-full after:bg-gradient-to-b after:from-[#BE01B7] after:to-transparent after:opacity-0 after:transition-opacity after:duration-300 after:ease-linear after:content-[""] hover:after:opacity-100'>
                  <div
                    className='relative z-20 rounded-xl bg-[rgba(26,13,31,0.45)] px-5 pb-8 pt-5  transition-all duration-300 group-hover:bg-[rgba(26,13,31,0.98)]'
                    onClick={() => {
                      window.open(item.link, '_blank')
                    }}
                  >
                    {item.image && (
                      <div className='flex justify-center overflow-hidden rounded'>
                        <HomeImage
                          alt='blog'
                          src={item.image}
                          className='h-[250px] w-auto transform rounded transition-all duration-300 ease-linear group-hover:scale-110'
                        />
                      </div>
                    )}
                    <p className='mt-6 text-ellipsis font-archia text-lg font-medium leading-6 tracking-[0.54px] transition-all duration-300 ease-linear group-hover:mt-5'>
                      {item.title}
                    </p>
                    <p className='mt-4 text-sm leading-5 text-white/[0.45]'>{item.pubDate.slice(0, 10)}</p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  )
}

export default Updates
