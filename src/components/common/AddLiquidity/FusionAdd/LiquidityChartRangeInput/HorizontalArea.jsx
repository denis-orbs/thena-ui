import React from 'react'

export function HorizontalArea({
  series,
  xScale,
  yScale,
  xValue,
  yValue,
  fill,
  brushDomain,
  selectedFill,
  containerHeight,
  containerWidth,
}) {
  return (
    <>
      {series
        .filter(d => {
          const value = yScale(yValue(d))
          return value > 0 && value <= containerHeight
        })
        .map((d, i) => {
          const price = yValue(d)
          const isInDomain = brushDomain && price >= brushDomain[0] && price <= brushDomain[1]
          return (
            <rect
              key={i}
              x={xScale(xValue(d))}
              y={yScale(price)}
              width={xScale(containerWidth) - xScale(xValue(d))}
              height={0.2}
              fill={isInDomain ? selectedFill : fill}
              stroke={isInDomain ? selectedFill : fill}
              rx={1}
              ry={1}
            />
          )
        })}
    </>
  )
}
