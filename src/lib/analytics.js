export function getSubarrayFromFirstDataToLast(data, value) {
  // Find the first non-zero index (if any)
  const firstNonZeroIndex = data.findIndex(item => item[value] !== 0)

  // Use a default value (data.length) if no non-zero values are found
  const startIndex = firstNonZeroIndex !== -1 ? firstNonZeroIndex : data.length

  // Create the subarray (includes all entries from startIndex to the end)
  return data.slice(startIndex)
}
