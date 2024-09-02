import React from 'react'

function ImageThenaId({ name = '', fontSize = 100, className = '' }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      xmlnsXlink='http://www.w3.org/1999/xlink'
      id='OpenSea_template'
      data-name='OpenSea template'
      width='100%'
      height='100%'
      viewBox='0 0 1920 1920'
      className={className}
    >
      <defs>
        <linearGradient id='linear-gradient' x2='1' y2='1' gradientUnits='objectBoundingBox'>
          <stop offset='0.0' stopColor='#ed00c9' />
          <stop offset='1.0' stopColor='#bd00ed' />
        </linearGradient>
      </defs>
      <rect id='BG' width='1920' height='1920' fill='url(#linear-gradient)' />
      <path
        id='Logo'
        d='M1576.83,1516.716h-55.254v-46.852h55.254ZM1382.9,1665.382h54.622V1544.115H1382.9Zm566.236-194.458-.729-1.061h-46.529v46.852h78.532Zm-622.412,45.793h166.886v-46.852H1326.727Zm687.963,50.174-15.558-22.774h-97.251v121.267h55.253v-96.795l66.017,95.748.725,1.047h45.979V1469.863H2014.69Zm-286.35-50.174h139.52v-46.845H1728.339Zm-89.169,27.389-117.595.01v121.267h55.254v-74.334h62.34v74.331h55.163V1469.863h-55.163Zm579.792-70.66-1.217-3.579h-67.094l-15.216,45.107,22.84-9.65,79.678,25.1-79.678,25.1-31.956-13.516-41.626,123.382h59.254l16.238-51.806h48.028l16.24,51.806h59.255Zm-435.365,117.6h59.858V1544.1H1728.339v121.274H1867.86v-46.845H1783.6Z'
        transform='translate(-844.727 -1241.863)'
        fill='#fff'
      />
      <text
        id='username.eth'
        transform='translate(100 1841)'
        fill='#fff'
        fontSize={fontSize.toString()}
        fontFamily='Inter'
        fontWeight='700'
      >
        <tspan x='0' y='0'>
          {name}.thena
        </tspan>
      </text>
    </svg>
  )
}

export default ImageThenaId
