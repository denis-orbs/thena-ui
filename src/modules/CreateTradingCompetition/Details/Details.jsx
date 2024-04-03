import React from 'react'

import Home from './Home'

function Details({ data }) {
  return data && <Home data={data} selectedTab='Details' isPreview />
}

export default Details
