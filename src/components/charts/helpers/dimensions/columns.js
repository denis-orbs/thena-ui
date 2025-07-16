const alignToMinimalWidthLimit = 4
const showSpacingMinimalBarWidth = 1

/**
 * @typedef {Object} ColumnPosition
 * @property {number} left
 * @property {number} right
 * @property {boolean} shiftLeft
 */

/**
 * @typedef {Object} ColumnPositionItem
 * @property {number} x
 * @property {ColumnPosition} [column]
 */

/**
 * Spacing gap between columns.
 * @param {number} barSpacingMedia
 * @param {number} horizontalPixelRatio
 * @returns {number}
 */
function columnSpacing(barSpacingMedia, horizontalPixelRatio) {
  return Math.ceil(barSpacingMedia * horizontalPixelRatio) <= showSpacingMinimalBarWidth
    ? 0
    : Math.max(1, Math.floor(horizontalPixelRatio))
}

/**
 * Desired column width in bitmap coordinates.
 * @param {number} barSpacingMedia
 * @param {number} horizontalPixelRatio
 * @param {number} [spacing]
 * @returns {number}
 */
function desiredColumnWidth(barSpacingMedia, horizontalPixelRatio, spacing) {
  return (
    Math.round(barSpacingMedia * horizontalPixelRatio) -
    (spacing ?? columnSpacing(barSpacingMedia, horizontalPixelRatio))
  )
}

/**
 * @param {number} barSpacingMedia
 * @param {number} horizontalPixelRatio
 * @returns {{
 *   spacing: number,
 *   shiftLeft: boolean,
 *   columnHalfWidthBitmap: number,
 *   horizontalPixelRatio: number
 * }}
 */
function columnCommon(barSpacingMedia, horizontalPixelRatio) {
  const spacing = columnSpacing(barSpacingMedia, horizontalPixelRatio)
  const columnWidthBitmap = desiredColumnWidth(barSpacingMedia, horizontalPixelRatio, spacing)
  const shiftLeft = columnWidthBitmap % 2 === 0
  const columnHalfWidthBitmap = (columnWidthBitmap - (shiftLeft ? 0 : 1)) / 2
  return {
    spacing,
    shiftLeft,
    columnHalfWidthBitmap,
    horizontalPixelRatio,
  }
}

/**
 * @param {number} xMedia
 * @param {{
 *   spacing: number,
 *   shiftLeft: boolean,
 *   columnHalfWidthBitmap: number,
 *   horizontalPixelRatio: number
 * }} columnData
 * @param {ColumnPosition | undefined} previousPosition
 * @returns {ColumnPosition}
 */
function calculateColumnPosition(xMedia, columnData, previousPosition) {
  const xBitmapUnRounded = xMedia * columnData.horizontalPixelRatio
  const xBitmap = Math.round(xBitmapUnRounded)
  const xPositions = {
    left: xBitmap - columnData.columnHalfWidthBitmap,
    right: xBitmap + columnData.columnHalfWidthBitmap - (columnData.shiftLeft ? 1 : 0),
    shiftLeft: xBitmap > xBitmapUnRounded,
  }
  const expectedAlignmentShift = columnData.spacing + 1
  if (previousPosition) {
    if (xPositions.left - previousPosition.right !== expectedAlignmentShift) {
      if (previousPosition.shiftLeft) {
        previousPosition.right = xPositions.left - expectedAlignmentShift
      } else {
        xPositions.left = previousPosition.right + expectedAlignmentShift
      }
    }
  }
  return xPositions
}

/**
 * Calculates column positions and mutates the original items array.
 * @param {ColumnPositionItem[]} items
 * @param {number} barSpacingMedia
 * @param {number} horizontalPixelRatio
 * @param {number} startIndex
 * @param {number} endIndex
 */
export function calculateColumnPositionsInPlace(items, barSpacingMedia, horizontalPixelRatio, startIndex, endIndex) {
  const common = columnCommon(barSpacingMedia, horizontalPixelRatio)
  let previous

  for (let i = startIndex; i < Math.min(endIndex, items.length); i++) {
    items[i].column = calculateColumnPosition(items[i].x, common, previous)
    previous = items[i].column
  }

  const minColumnWidth = items.reduce(
    (smallest, item, index) => {
      if (!item.column || index < startIndex || index > endIndex) return smallest
      if (item.column.right < item.column.left) {
        item.column.right = item.column.left
      }
      const width = item.column.right - item.column.left + 1
      return Math.min(smallest, width)
    },
    Math.ceil(barSpacingMedia * horizontalPixelRatio),
  )

  if (common.spacing > 0 && minColumnWidth < alignToMinimalWidthLimit) {
    items.forEach((item, index) => {
      if (!item.column || index < startIndex || index > endIndex) return
      const width = item.column.right - item.column.left + 1
      if (width <= minColumnWidth) return
      if (item.column.shiftLeft) {
        item.column.right -= 1
      } else {
        item.column.left += 1
      }
    })
  }
}
