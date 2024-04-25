import React from 'react'

import Admins from './Admins'
import Competitions from './Competitions'
import TopBar from './TopBar'
import Users from './Users'

function AdminPage() {
  return (
    <div className='mt-8 flex flex-col gap-8'>
      <TopBar />
      <Users />
      <Admins />
      <Competitions />
    </div>
  )
}

export default AdminPage
