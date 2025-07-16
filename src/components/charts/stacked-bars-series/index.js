/* eslint-disable class-methods-use-this */
import { customSeriesDefaultOptions } from 'lightweight-charts'

import { StackedBarsSeriesRenderer } from './renderer.js'

export class StackedBarsSeries {
  constructor() {
    this._renderer = new StackedBarsSeriesRenderer()
  }

  priceValueBuilder(plotRow) {
    return [0, plotRow.values.reduce((prev, curr) => prev + curr, 0)]
  }

  isWhitespace(data) {
    return !data?.values?.length
  }

  renderer() {
    return this._renderer
  }

  update(data, options) {
    this._renderer.update(data, options)
  }

  defaultOptions() {
    return {
      ...customSeriesDefaultOptions,
      colors: ['#EA66E5', '#F199EE'],
    }
  }
}
