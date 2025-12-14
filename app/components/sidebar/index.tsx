import React, { useEffect, useState } from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useBoolean } from 'ahooks'
import {
  ChatBubbleOvalLeftEllipsisIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { ChatBubbleOvalLeftEllipsisIcon as ChatBubbleOvalLeftEllipsisSolidIcon } from '@heroicons/react/24/solid'
import {
  RiEditLine,
  RiPushpinLine,
  RiUnpinLine,
  RiMoreFill,
} from '@remixicon/react'
import Button from '@/app/components/base/button'
import ActionButton, { ActionButtonState } from '@/app/components/base/action-button'
import { PortalToFollowElem, PortalToFollowElemContent, PortalToFollowElemTrigger } from '@/app/components/base/portal-to-follow-elem'
// import Card from './card'
import type { ConversationItem } from '@/types/app'
import { isTimestampToday } from '@/utils/date'

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

interface ConversationActionsProps {
  isActive: boolean
  isItemHovering: boolean
  isShowRenameConversation?: boolean
  onRenameConversation: () => void
  renameLabel: string
  isPinned?: boolean
  onPinConversation?: () => void
  onUnpinConversation?: () => void
  pinLabel: string
  unpinLabel: string
}

const ConversationActions: FC<ConversationActionsProps> = ({
  isActive,
  isItemHovering,
  isShowRenameConversation,
  onRenameConversation,
  renameLabel,
  isPinned,
  onPinConversation,
  onUnpinConversation,
  pinLabel,
  unpinLabel,
}) => {
  const [open, setOpen] = useState(false)
  const [isHovering, { setTrue: setIsHovering, setFalse: setNotHovering }] = useBoolean(false)

  useEffect(() => {
    if (!isItemHovering && !isHovering)
    { setOpen(false) }
  }, [isItemHovering, isHovering])

  const canPin = isPinned ? !!onUnpinConversation : !!onPinConversation
  const canRename = isShowRenameConversation && !!onRenameConversation

  if (!canPin && !canRename) { return null }

  return (
    <PortalToFollowElem
      open={open}
      onOpenChange={setOpen}
      placement='bottom-end'
      offset={4}
    >
      <PortalToFollowElemTrigger
        onClick={() => setOpen(v => !v)}
      >
        <ActionButton
          className={classNames((isItemHovering || open) ? 'opacity-100' : 'opacity-0')}
          state={
            isActive
              ? ActionButtonState.Active
              : open
                ? ActionButtonState.Hover
                : ActionButtonState.Default
          }
        >
          <RiMoreFill className='h-4 w-4' />
        </ActionButton>
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent className="z-50">
        <div
          className='min-w-[140px] rounded-xl border border-gray-200 bg-white p-1 shadow-lg'
          onMouseEnter={setIsHovering}
          onMouseLeave={setNotHovering}
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          {canPin && (
            <div
              className='flex cursor-pointer items-center space-x-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100'
              onClick={() => {
                setOpen(false)
                if (isPinned)
                { onUnpinConversation?.() }
                else
                { onPinConversation?.() }
              }}
            >
              {isPinned
                ? <RiUnpinLine className='h-4 w-4 shrink-0 text-gray-500' />
                : <RiPushpinLine className='h-4 w-4 shrink-0 text-gray-500' />}
              <span className='grow'>{isPinned ? unpinLabel : pinLabel}</span>
            </div>
          )}
          {canRename && (
            <div
              className='flex cursor-pointer items-center space-x-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100'
              onClick={() => {
                setOpen(false)
                onRenameConversation()
              }}
            >
              <RiEditLine className='h-4 w-4 shrink-0 text-gray-500' />
              <span className='grow'>{renameLabel}</span>
            </div>
          )}
        </div>
      </PortalToFollowElemContent>
    </PortalToFollowElem>
  )
}

export interface ISidebarProps {
  copyRight: string
  currentId: string
  onCurrentIdChange: (id: string) => void
  list: ConversationItem[]
  conversationLimit?: number | null
  onRenameConversation?: (id: string, newName: string) => Promise<void> | void
  isShowRenameConversation?: boolean
  onPinConversation?: (id: string) => Promise<void> | void
  onUnpinConversation?: (id: string) => Promise<void> | void
}

const Sidebar: FC<ISidebarProps> = ({
  copyRight,
  currentId,
  onCurrentIdChange,
  list,
  conversationLimit,
  onRenameConversation,
  isShowRenameConversation = true,
  onPinConversation,
  onUnpinConversation,
}) => {
  const { t } = useTranslation()
  const todayConversationCount = React.useMemo(
    () => list.filter(item => isTimestampToday(item.created_at)).length,
    [list],
  )
  const pinnedList = React.useMemo(
    () => list.filter(item => item.pinned),
    [list],
  )
  const unpinnedList = React.useMemo(
    () => list.filter(item => !item.pinned),
    [list],
  )
  const maxConversationsToday = conversationLimit ?? Infinity
  const canCreateConversation = todayConversationCount < maxConversationsToday
  const [renameTarget, setRenameTarget] = useState<ConversationItem | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [hoverId, setHoverId] = useState('')

  const closeRenameModal = () => {
    setRenameTarget(null)
    setRenameValue('')
    setRenameError('')
    setRenaming(false)
  }

  const handleRenameSave = async () => {
    if (!renameTarget)
    { return }

    if (!renameValue.trim()) {
      setRenameError(t('app.chat.conversationNameRequired') as string)
      return
    }
    if (!onRenameConversation) {
      closeRenameModal()
      return
    }
    setRenaming(true)
    try {
      await onRenameConversation(renameTarget.id, renameValue.trim())
      closeRenameModal()
    }
    finally {
      setRenaming(false)
    }
  }

  const renderConversation = (item: ConversationItem) => {
    const isCurrent = item.id === currentId
    const ItemIcon
      = isCurrent ? ChatBubbleOvalLeftEllipsisSolidIcon : ChatBubbleOvalLeftEllipsisIcon
    const hasPinAction = item.id !== '-1' && (item.pinned ? !!onUnpinConversation : !!onPinConversation)
    const hasRenameAction = isShowRenameConversation && item.id !== '-1' && !!onRenameConversation
    const showActions = item.id !== '-1' && (hasPinAction || hasRenameAction)

    return (
      <div
        onMouseEnter={() => setHoverId(item.id)}
        onMouseLeave={() => setHoverId('')}
        onClick={() => onCurrentIdChange(item.id)}
        key={item.id}
        className={classNames(
          isCurrent
            ? 'bg-primary-50 text-primary-600'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-700',
          'group flex items-center rounded-md px-2 py-2 text-sm font-medium cursor-pointer',
        )}
      >
        <ItemIcon
          className={classNames(
            isCurrent
              ? 'text-primary-600'
              : 'text-gray-400 group-hover:text-gray-500',
            'mr-3 h-5 w-5 flex-shrink-0',
          )}
          aria-hidden="true"
        />
        <span className='truncate'>{item.name}</span>
        {showActions && (
          <div className='ml-auto pl-2' onClick={e => e.stopPropagation()}>
            <ConversationActions
              isActive={isCurrent}
              isItemHovering={hoverId === item.id}
              isShowRenameConversation={hasRenameAction}
              renameLabel={t('app.chat.rename') as string}
              isPinned={!!item.pinned}
              onPinConversation={!item.pinned && onPinConversation ? () => onPinConversation(item.id) : undefined}
              onUnpinConversation={item.pinned && onUnpinConversation ? () => onUnpinConversation(item.id) : undefined}
              pinLabel={t('app.chat.pin') as string}
              unpinLabel={t('app.chat.unpin') as string}
              onRenameConversation={() => {
                setRenameTarget(item)
                setRenameValue(item.name)
                setRenameError('')
              }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="shrink-0 flex flex-col overflow-y-auto bg-white pc:w-[306px] tablet:w-[192px] mobile:w-[240px]  border-r border-gray-200 tablet:h-[calc(100vh_-_3rem)] mobile:h-screen"
    >
      {canCreateConversation && (
        <div className="flex flex-shrink-0 p-4 !pb-0">
          <Button
            onClick={() => { onCurrentIdChange('-1') }}
            className="group block w-full flex-shrink-0 !justify-start !h-9 text-primary-600 items-center text-sm"
          >
            <PencilSquareIcon className="mr-2 h-4 w-4" /> {t('app.chat.newChat')}
          </Button>
        </div>
      )}

      <nav className="mt-4 flex-1 space-y-3 bg-white p-4 !pt-0">
        {!!pinnedList.length && (
          <div className='space-y-1'>
            <div className='px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400'>
              {t('app.chat.pinned')}
            </div>
            <div className='space-y-1'>
              {pinnedList.map(item => renderConversation(item))}
            </div>
          </div>
        )}
        {!!unpinnedList.length && (
          <div className='space-y-1'>
            {pinnedList.length > 0 && (
              <div className='px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400'>
                {t('app.chat.unpinned')}
              </div>
            )}
            <div className='space-y-1'>
              {unpinnedList.map(item => renderConversation(item))}
            </div>
          </div>
        )}
      </nav>
      {/* <a className="flex flex-shrink-0 p-4" href="https://langgenius.ai/" target="_blank">
        <Card><div className="flex flex-row items-center"><ChatBubbleOvalLeftEllipsisSolidIcon className="text-primary-600 h-6 w-6 mr-2" /><span>LangGenius</span></div></Card>
      </a> */}
      <div className="flex flex-shrink-0 pr-4 pb-4 pl-4">
        <div className="text-gray-400 font-normal text-xs">© {copyRight} {(new Date()).getFullYear()}</div>
      </div>
      {renameTarget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4' onClick={closeRenameModal}>
          <div className='w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl' onClick={e => e.stopPropagation()}>
            <div className='text-base font-semibold text-gray-900'>{t('app.chat.renameConversation')}</div>
            <div className='mt-4 text-sm font-medium text-gray-800'>{t('app.chat.conversationName')}</div>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => {
                setRenameValue(e.target.value)
                setRenameError('')
              }}
              className='mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100'
              placeholder={t('app.chat.conversationNamePlaceholder') as string}
            />
            {renameError && <div className='mt-2 text-xs text-red-500'>{renameError}</div>}
            <div className='mt-6 flex justify-end space-x-2'>
              <Button className='h-9 px-3' onClick={closeRenameModal}>{t('common.operation.cancel')}</Button>
              <Button type='primary' className='h-9 px-3' onClick={handleRenameSave} loading={renaming}>{t('common.operation.save')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(Sidebar)
