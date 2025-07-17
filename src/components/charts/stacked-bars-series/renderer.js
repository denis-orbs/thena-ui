// stacked-bars-series/renderer.js

import { calculateColumnPositionsInPlace } from '../helpers/dimensions/columns'
import { positionsBox } from '../helpers/dimensions/positions'

function cumulativeBuildUp(arr) {
  let sum = 0
  return arr.map(value => {
    const newValue = sum + value
    sum = newValue
    return newValue
  })
}

export class StackedBarsSeriesRenderer {
  constructor() {
    this._data = null
    this._options = null
  }

  draw(target, priceConverter) {
    target.useBitmapCoordinateSpace(scope => this._drawImpl(scope, priceConverter))
  }

  update(data, options) {
    this._data = data
    this._options = options
  }

  _drawImpl(renderingScope, priceToCoordinate) {
    if (
      this._data === null ||
      this._data.bars.length === 0 ||
      this._data.visibleRange === null ||
      this._options === null
    ) {
      return
    }

    const options = this._options
    const bars = this._data.bars.map(bar => ({
      x: bar.x,
      ys: cumulativeBuildUp(bar.originalData.values).map(value => priceToCoordinate(value) ?? 0),
    }))

    calculateColumnPositionsInPlace(
      bars,
      this._data.barSpacing,
      renderingScope.horizontalPixelRatio,
      this._data.visibleRange.from,
      this._data.visibleRange.to,
    )

    const zeroY = priceToCoordinate(0) ?? 0

    for (let i = this._data.visibleRange.from; i < this._data.visibleRange.to; i++) {
      const stack = bars[i]
      const { column } = stack
      if (!column) return

      let previousY = zeroY
      const width = Math.min(
        Math.max(renderingScope.horizontalPixelRatio, column.right - column.left),
        this._data.barSpacing * renderingScope.horizontalPixelRatio,
      )

      stack.ys.forEach((y, index) => {
        const color = options.colors[index % options.colors.length]
        const stackBoxPositions = positionsBox(previousY, y, renderingScope.verticalPixelRatio)
        renderingScope.context.fillStyle = color
        renderingScope.context.fillRect(column.left, stackBoxPositions.position, width, stackBoxPositions.length)
        previousY = y
      })
    }
  }
}
