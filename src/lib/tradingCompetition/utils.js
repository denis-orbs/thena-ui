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
