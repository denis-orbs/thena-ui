import { useState } from 'react'

import { SizeTypes } from '@/constant/type'
import cn from '@/utils/classes'

export default function RoundedTabs({
  tabs = [],
  defaultActiveTab = 0,
  classNames = {}, // wrapper, content
  className = '',
  containContent = false, // if true, content will be wrapped in a div
  size = SizeTypes.Medium,
  onTabChange = () => {},
}) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab)

  const handleTabClick = (tabId, tab) => {
    setActiveTab(tabId)
    // Call the tab's own click handler if it exists
    if (tab.onClickHandler) {
      tab.onClickHandler()
    }
    // Call the parent's onTabChange
    onTabChange(tabId)
  }

  if (!tabs || tabs.length === 0) {
    return (
      <div className='mx-auto w-full max-w-4xl p-6'>
        <></>
      </div>
    )
  }

  // Size-based styling
  const getSizeClasses = _size => {
    switch (_size) {
      case SizeTypes.Small:
        return 'px-3 py-1 text-xs'
      case SizeTypes.Large:
        return 'px-6 py-3 text-base'
      default:
        return 'px-4 py-2 text-sm'
    }
  }

  return (
    <div className={cn('px-2', classNames?.wrapper)}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>
        {`
          .rounded-tab {
            --r: 25px;
            line-height: 1.8;
            padding-inline: 2em;
            border-inline: var(--r) solid #0000;
            border-radius: calc(2 * var(--r)) calc(2 * var(--r)) 0 0 / var(--r);
            mask:
              radial-gradient(var(--r) at var(--r) 0, #0000 98%, #000 101%) calc(-1 * var(--r)) 100%/100% var(--r)
                repeat-x,
              conic-gradient(#000 0 0) padding-box;
            width: fit-content;
          }
        `}
      </style>

      {/* Tab Headers */}
      <div className='flex items-end'>
        {tabs.map((tab, index) => {
          const tabId = tab.id || index
          const isActive = tab.active !== undefined ? tab.active : activeTab === tabId

          return (
            <button
              type='button'
              key={tabId}
              onClick={() => handleTabClick(tabId, tab)}
              className={cn(
                'mr-2 font-medium transition-all duration-100',
                getSizeClasses(size),
                isActive
                  ? 'rounded-tab bg-neutral-900 text-neutral-200'
                  : 'rounded-tab hover:bg-neutral-800 hover:text-neutral-100',
                className,
              )}
              disabled={tab.disabled}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {containContent && (
        <div className={cn('mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm', classNames?.content)}>
          {tabs.map((tab, index) => {
            const tabId = tab.id || index
            const isActive = tab.active !== undefined ? tab.active : activeTab === tabId

            if (!isActive) return null

            return (
              <div key={tabId}>
                {tab.title && <div className='mb-4 text-lg font-semibold text-gray-800'>{tab.title}</div>}
                <div className='text-gray-600'>
                  {typeof tab.content === 'string' ? <p>{tab.content}</p> : tab.content}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
