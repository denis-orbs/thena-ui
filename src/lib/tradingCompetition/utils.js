import { isArray, isNil } from 'lodash'

export const EVENT_TYPES = {
  UPCOMING: 'Upcoming',
  LIVE: 'Live',
  ENDED: 'Ended',
}

export const getEventType = detail => {
  const currentTimStamp = Date.now() / 1000
  let event = ''
  if (detail?.startTimestamp > currentTimStamp) {
    event = EVENT_TYPES.UPCOMING
  } else if (currentTimStamp < detail?.endTimestamp) {
    event = EVENT_TYPES.LIVE
  } else {
    event = EVENT_TYPES.ENDED
  }
  return event
}

export const addOrReplaceURLParams = (type, value) => {
  const url = new URL(window.location.href)

  const params = new URLSearchParams(url.search.slice(1))

  if (value === null) {
    params.delete(type)
  } else {
    params.set(type, value)
  }
  window.history.replaceState(
    {},
    '',
    `${window.location.pathname}${Array.from(params).length > 0 ? '?' : ''}${params.toString()}`,
  )
}

export const objectToQuery = object => {
  const queryStringArray = []

  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      const values = object[key]
      if (!isNil(values)) {
        if (isArray(values)) {
          values.forEach(value => {
            const encodedKey = encodeURIComponent(key)
            const encodedValue = encodeURIComponent(value.toString())
            if (encodedValue) {
              const queryParam = `${encodedKey}[]=${encodedValue}`
              queryStringArray.push(queryParam)
            }
          })
        } else {
          const encodedKey = encodeURIComponent(key)
          const encodedValue = encodeURIComponent(values.toString())
          const queryParam = `${encodedKey}=${encodedValue}`
          queryStringArray.push(queryParam)
        }
      }
    }
  }

  return queryStringArray.length ? `?${queryStringArray.join('&')}` : ''
}
