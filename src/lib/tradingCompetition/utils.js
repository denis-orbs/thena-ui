import { inRange, isArray, isNil } from 'lodash'

export const EVENT_TYPES = {
  UPCOMING: 'Upcoming',
  LIVE: 'Live',
  ENDED: 'Ended',
}

export const getEventType = detail => {
  const currentTimeStamp = Date.now() / 1000
  let event = ''
  if (detail?.startTimestamp > currentTimeStamp) {
    event = EVENT_TYPES.UPCOMING
  } else if (currentTimeStamp < detail?.endTimestamp) {
    event = EVENT_TYPES.LIVE
  } else {
    event = EVENT_TYPES.ENDED
  }
  return event
}

export const TC_STATUS = {
  WAIT_REGISTRATION: 'Not started',
  IN_REGISTRATION: 'In registration',
  WAIT_START: 'Wait start',
  LIVE: 'Live',
  ENDED: 'Ended',
}

export const getTCStatus = eventTimeStamp => {
  let status = ''
  const currentTimeStamp = Date.now() / 1000
  const { registrationStart, registrationEnd, startTimestamp, endTimestamp } = eventTimeStamp

  if (currentTimeStamp < registrationStart) {
    status = TC_STATUS.WAIT_REGISTRATION
  } else if (inRange(currentTimeStamp, registrationStart, registrationEnd)) {
    status = TC_STATUS.IN_REGISTRATION
  } else if (inRange(currentTimeStamp, registrationEnd, startTimestamp)) {
    status = TC_STATUS.WAIT_START
  } else if (inRange(currentTimeStamp, startTimestamp, endTimestamp)) {
    status = TC_STATUS.LIVE
  } else if (currentTimeStamp > endTimestamp) {
    status = TC_STATUS.ENDED
  }
  return status
}

export const addOrReplaceURLParams = (type, value = null) => {
  const url = new URL(window.location.href)

  const params = new URLSearchParams(url.search.slice(1))

  // value is null or undefined, remove this param from URL
  // otherwise, add or replace it
  if (value === null || value === undefined) {
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
