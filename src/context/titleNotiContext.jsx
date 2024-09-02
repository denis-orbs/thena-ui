import { useParams } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const initialState = {
  countNoti: 0,
  setCountNoti: () => {},
}

const TitleNotiContext = createContext(initialState)

function TitleNotiContextProvider({ children }) {
  const [countNoti, setCountNoti] = useState(0)

  const params = useParams()

  useEffect(() => {
    const { title } = document
    if (countNoti) {
      if (/^\(\d+\)/.test(title)) {
        const titleArr = title.split(' ')
        titleArr.shift()
        document.title = `(${countNoti}) ${titleArr.join(' ')}`
      } else {
        document.title = `(${countNoti}) ${title}`
      }
    } else if (/^\(\d+\)/.test(title)) {
      // reset title to default
      const titleArr = title.split(' ')
      titleArr.shift()
      document.title = titleArr.join(' ')
    }
  }, [countNoti, params])

  const value = useMemo(
    () => ({
      countNoti,
      setCountNoti,
    }),
    [countNoti],
  )

  return <TitleNotiContext.Provider value={value}>{children}</TitleNotiContext.Provider>
}

const useTitleNotiContext = () => {
  const titleNotiContext = useContext(TitleNotiContext)
  return titleNotiContext
}

export { TitleNotiContext, TitleNotiContextProvider, useTitleNotiContext }
