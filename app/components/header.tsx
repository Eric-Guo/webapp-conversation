import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bars3Icon,
  PencilSquareIcon,
} from '@heroicons/react/24/solid'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import AppIcon from '@/app/components/base/app-icon'
import type { WorkPackageOption } from '@/types/app'
export interface IHeaderProps {
  title: string
  isMobile?: boolean
  onShowSideBar?: () => void
  onCreateNewChat?: () => void
  userLabel?: string
  workPackageOptions?: WorkPackageOption[]
  selectedWorkPackageId?: string
  workPackageLoading?: boolean
  onWorkPackageChange?: (workPackageId: string) => void
  onSignOut?: () => void
  todayConversationCount?: number
  todayConversationLimit?: number
}
const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  onShowSideBar,
  onCreateNewChat,
  userLabel,
  workPackageOptions = [],
  selectedWorkPackageId = '',
  workPackageLoading = false,
  onWorkPackageChange,
  onSignOut,
  todayConversationCount = 0,
  todayConversationLimit = 0,
}) => {
  const { t } = useTranslation()
  return (
    <div className="shrink-0 flex items-center justify-between h-12 px-3 bg-gray-100">
      {isMobile
        ? (
          <div
            className='flex items-center justify-center h-8 w-8 cursor-pointer'
            onClick={() => onShowSideBar?.()}
          >
            <Bars3Icon className="h-4 w-4 text-gray-500" />
          </div>
        )
        : <div></div>}
      <div className='flex items-center space-x-2'>
        <AppIcon size="small" />
        <div className=" text-sm text-gray-800 font-bold">{title}</div>
      </div>
      <div className='flex items-center space-x-2'>
        {!!onWorkPackageChange && (
          <div className='hidden sm:flex items-center h-8 px-2 bg-white border border-gray-200 rounded-md max-w-[320px]'>
            <select
              className='w-[300px] text-xs text-gray-700 bg-transparent outline-none'
              value={selectedWorkPackageId}
              disabled={workPackageLoading || !workPackageOptions.length}
              onChange={e => onWorkPackageChange(e.target.value)}
            >
              {!workPackageOptions.length && (
                <option value=''>
                  {workPackageLoading ? '加载中...' : '暂无工作包'}
                </option>
              )}
              {workPackageOptions.map(item => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center h-8 px-2 text-[11px] text-gray-700 bg-white border border-gray-200 rounded-md whitespace-nowrap">
          {t('app.chat.todayUsage', { count: todayConversationCount, limit: todayConversationLimit })}
        </div>
        {isMobile && (
          <div className='flex items-center justify-center h-8 w-8 cursor-pointer' onClick={() => onCreateNewChat?.()} >
            <PencilSquareIcon className="h-4 w-4 text-gray-500" />
          </div>
        )}
        {userLabel && (
          <div className='hidden sm:flex items-center text-xs text-gray-600 truncate max-w-[160px]'>
            {userLabel}
          </div>
        )}
        {onSignOut && (
          <button
            type="button"
            className="inline-flex items-center h-8 px-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:border-gray-300 hover:text-gray-900"
            onClick={() => onSignOut?.()}
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1" />
            Sign out
          </button>
        )}
      </div>
    </div>
  )
}

export default React.memo(Header)
