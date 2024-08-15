import React from 'react'

import Box from '@/components/box'

function FaqItem({ faq }) {
  return (
    <Box className='flex flex-col justify-between gap-2 bg-[#1A121E]'>
      <p className='text-[20px] font-semibold'>{faq.question}</p>
      <p className='text-[16px] text-neutral-300'>{faq.answer}</p>
    </Box>
  )
}

export default function Faq() {
  const data = [
    {
      id: 1,
      question: 'Lorem ipsum dolor sit amet?',
      answer:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non nisi lacinia, tristique arcu a, faucibus orci. Aenean sit amet augue lacus. Proin ullamcorpe.',
    },
    {
      id: 2,
      question: 'Lorem ipsum dolor sit amet?',
      answer:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non nisi lacinia, tristique arcu a, faucibus orci. Aenean sit amet augue lacus. Proin ullamcorpe.',
    },
    {
      id: 3,
      question: 'Lorem ipsum dolor sit amet?',
      answer:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non nisi lacinia, tristique arcu a, faucibus orci. Aenean sit amet augue lacus. Proin ullamcorpe.',
    },
    {
      id: 4,
      question: 'Lorem ipsum dolor sit amet?',
      answer:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non nisi lacinia, tristique arcu a, faucibus orci. Aenean sit amet augue lacus. Proin ullamcorpe.',
    },
    {
      id: 5,
      question: 'Lorem ipsum dolor sit amet?',
      answer:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non nisi lacinia, tristique arcu a, faucibus orci. Aenean sit amet augue lacus. Proin ullamcorpe.',
    },
    {
      id: 6,
      question: 'Lorem ipsum dolor sit amet?',
      answer:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce non nisi lacinia, tristique arcu a, faucibus orci. Aenean sit amet augue lacus. Proin ullamcorpe.',
    },
  ]
  return (
    <div className='mb-[250px] gap-8 lg:gap-12'>
      <p className='mb-[52px] font-semibold text-neutral-50'>FAQ</p>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        {data.map(item => (
          <FaqItem faq={item} />
        ))}
      </div>
    </div>
  )
}
