import Image from 'next/image'
import React from 'react'

export default function ApolloWarrior() {
  return (
    <div className='z-10 col-span-12 my-auto lg:col-span-6'>
      <div
        className='relative h-[397.02px] w-[397.02px] rounded-[15px] border'
        style={{
          border: ' Mixed solid',
          borderImage: 'linear-gradient(225.49deg, #F7ADF4 8.33%, #F389EF 28.88%, #DC00D4 48.46%, #140814 77.96%)',
        }}
      >
        <Image src='/images/story/apollo-warrior-light.png' alt='Apollo Warrior' layout='fill' objectFit='cover' />
      </div>
    </div>
  )
}
