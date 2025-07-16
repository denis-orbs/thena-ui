/**
 * @typedef {Object} BitmapPositionLength
 * @property {number} position - Starting position in bitmap coordinates
 * @property {number} length - Length in bitmap coordinates
 */

/**
 * Calculates the starting position and length (in bitmap coordinates) of a box
 * defined by two media-space coordinates and a pixel ratio.
 *
 * @param {number} position1Media - First coordinate in media space
 * @param {number} position2Media - Second coordinate in media space
 * @param {number} pixelRatio - Pixel ratio for the axis (horizontal or vertical)
 * @returns {BitmapPositionLength} Object containing the starting position and length
 */
export function positionsBox(position1Media, position2Media, pixelRatio) {
  const scaledPosition1 = Math.round(pixelRatio * position1Media)
  const scaledPosition2 = Math.round(pixelRatio * position2Media)
  return {
    position: Math.min(scaledPosition1, scaledPosition2),
    length: Math.abs(scaledPosition2 - scaledPosition1) + 1,
  }
}
