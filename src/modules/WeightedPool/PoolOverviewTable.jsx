import React from 'react'

function PoolOverviewTable({ tokens }) {
  console.log({ tokens })
  // TODO: remove mock data
  const data = [
    {
      color: 'bg-yellow-500',
      name: 'BNB',
      weight: '25 %',
      value: '$ 10,0000',
      amount: '5,453200 BNB',
    },
    {
      color: 'bg-green-500',
      name: 'USDT',
      weight: '25 %',
      value: '$ 10,0000',
      amount: '10.005,00 USDT',
    },
    {
      color: 'bg-pink-500',
      name: 'THE',
      weight: '25 %',
      value: '$ 10,0000',
      amount: '14.000 THE',
    },
    {
      color: 'bg-blue-500',
      name: 'ETH',
      weight: '25 %',
      value: '$ 10,0000',
      amount: '2,5123 ETH',
    },
  ]
  return (
    <div className='rounded-lg bg-transparent text-neutral-50'>
      <table className='w-full text-left'>
        <thead>
          <tr>
            <th className='py-2'>Token</th>
            <th className='py-2'>Pool Weight</th>
            <th className='py-2'>Value in $</th>
            <th className='py-2'>Token Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td className='flex items-center gap-2 py-2'>
                <span className={`h-3 w-3 rounded-full ${item.color}`} />
                {item.name}
              </td>
              <td className='py-2'>{item.weight}</td>
              <td className='py-2'>{item.value}</td>
              <td className='py-2'>{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PoolOverviewTable
