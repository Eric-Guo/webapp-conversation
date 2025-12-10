'use client'
import type { FC } from 'react'
import React, { useEffect, useRef } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import Answer from './answer'
import Question from './question'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles } from '@/app/components/base/file-uploader-in-attachment/utils'
import { RiAttachmentLine, RiSendPlaneFill } from '@remixicon/react'

export interface IChatProps {
  chatList: ChatItem[]
  /**
   * Whether to display the editing area and rating status
   */
  feedbackDisabled?: boolean
  /**
   * Whether to display the input area
   */
  isHideSendInput?: boolean
  onFeedback?: FeedbackFunc
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => void
  useCurrentUserAvatar?: boolean
  isResponding?: boolean
  controlClearQuery?: number
  visionConfig?: VisionSettings
  fileConfig?: FileUpload
  sendDisabled?: boolean
}

const Chat: FC<IChatProps> = ({
  chatList,
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  checkCanSend,
  onSend = () => { },
  useCurrentUserAvatar,
  isResponding,
  controlClearQuery,
  visionConfig,
  fileConfig,
  sendDisabled = false,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)

  const [query, setQuery] = React.useState('')
  const queryRef = useRef('')
  const [handleAttachmentPaste, setHandleAttachmentPaste] = React.useState<((e: React.ClipboardEvent<HTMLTextAreaElement>) => void) | undefined>()
  const isSendButtonDisabled = !!isResponding || sendDisabled

  const handleContentChange = (e: any) => {
    const value = e.target.value
    setQuery(value)
    queryRef.current = value
  }

  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const valid = () => {
    const query = queryRef.current
    if (!query || query.trim() === '') {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  useEffect(() => {
    if (controlClearQuery) {
      setQuery('')
      queryRef.current = ''
    }
  }, [controlClearQuery])
  const {
    files,
    onUpload,
    onRemove,
    onReUpload,
    onImageLinkLoadError,
    onImageLinkLoadSuccess,
    onClear,
  } = useImageFiles()

  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>([])
  const handleClipboardPasteReady = (handler: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void) => {
    setHandleAttachmentPaste(() => handler)
  }

  const handleSend = () => {
    if (isSendButtonDisabled) { return }
    if (!valid() || (checkCanSend && !checkCanSend())) { return }
    const imageFiles: VisionFile[] = files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    }))
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFiles, ...docAndOtherFiles]
    onSend(queryRef.current, combinedFiles)
    if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
      if (files.length) { onClear() }
      if (!isResponding) {
        setQuery('')
        queryRef.current = ''
      }
    }
    if (!attachmentFiles.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)) { setAttachmentFiles([]) }
  }

  const handleKeyUp = (e: any) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      // prevent send message when using input method enter
      if (!e.shiftKey && !isUseInputMethod.current) { handleSend() }
    }
  }

  const handleKeyDown = (e: any) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      const result = query.replace(/\n$/, '')
      setQuery(result)
      queryRef.current = result
      e.preventDefault()
    }
  }

  const suggestionClick = (suggestion: string) => {
    if (isSendButtonDisabled) { return }
    setQuery(suggestion)
    queryRef.current = suggestion
    handleSend()
  }

  const getImageUrls = (files: VisionFile[] | undefined, belongsTo: 'user' | 'assistant') => {
    if (!files) { return [] }
    return files
      .filter((file) => {
        if (file.type !== 'image') { return false }
        const target = file.belongs_to?.toLowerCase()
        if (target) { return target === belongsTo }
        return belongsTo === 'user'
      })
      .map(file => file.url)
      .filter((url): url is string => !!url && url.trim() !== '')
  }

  return (
    <div className={cn(!feedbackDisabled && 'px-3.5', 'h-full')}>
      {/* Chat List */}
      <div className="h-full space-y-[30px]">
        {chatList.map((item) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            return <Answer
              key={item.id}
              item={item}
              feedbackDisabled={feedbackDisabled}
              onFeedback={onFeedback}
              isResponding={isResponding && isLast}
              suggestionClick={suggestionClick}
            />
          }
          return (
            <Question
              key={item.id}
              id={item.id}
              content={item.content}
              useCurrentUserAvatar={useCurrentUserAvatar}
              imgSrcs={getImageUrls(item.message_files, 'user')}
            />
          )
        })}
      </div>
      {
        !isHideSendInput && (
          <div className='fixed z-10 bottom-0 left-1/2 transform -translate-x-1/2 pc:ml-[122px] tablet:ml-[96px] mobile:ml-0 pc:w-[794px] tablet:w-[794px] max-w-full mobile:w-full px-3.5 pb-4'>
            <div className='relative space-y-2'>
              <div className='flex items-start gap-3 rounded-[18px] border border-gray-100 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(24,39,75,0.08)]'>
                {
                  visionConfig?.enabled && (
                    <div className='pt-1'>
                      <ChatImageUploader
                        settings={visionConfig}
                        onUpload={onUpload}
                        disabled={files.length >= visionConfig.number_limits}
                      />
                    </div>
                  )
                }
                <div className='flex-1'>
                  <Textarea
                    className='block w-full resize-none border-none bg-transparent p-0 text-base leading-6 text-gray-700 outline-none'
                    value={query}
                    onChange={handleContentChange}
                    onKeyUp={handleKeyUp}
                    onKeyDown={handleKeyDown}
                    onPaste={fileConfig?.enabled ? handleAttachmentPaste : undefined}
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    placeholder={t('app.chat.startChat') || ''}
                  />
                </div>
                {
                  fileConfig?.enabled && (
                    <div className='relative flex items-start'>
                      <FileUploaderInAttachmentWrapper
                        fileConfig={fileConfig}
                        value={attachmentFiles}
                        onChange={setAttachmentFiles}
                        onHandleClipboardPasteFile={handleClipboardPasteReady}
                        variant='compact'
                        trigger={(open) => {
                          const disabled = !!(fileConfig.number_limits && attachmentFiles.length >= fileConfig.number_limits)
                          return (
                            <button
                              type='button'
                              className={`
                                flex h-10 w-10 items-center justify-center rounded-full
                                ${disabled ? 'cursor-not-allowed bg-gray-100 text-gray-300' : 'bg-white text-gray-500 hover:bg-gray-100'}
                                ${open ? 'bg-gray-100 text-gray-600' : ''}
                              `}
                              disabled={disabled}
                            >
                              <RiAttachmentLine className='h-5 w-5' />
                            </button>
                          )
                        }}
                        listClassName='absolute right-0 bottom-full mt-0 mb-2 w-[320px]'
                      />
                    </div>
                  )
                }
                <button
                  type='button'
                  className={cn(
                    'self-center flex h-10 w-10 items-center justify-center rounded-full',
                    isSendButtonDisabled ? 'cursor-not-allowed bg-gray-100 text-gray-300 shadow-none' : 'bg-[#1a73e8] text-white shadow-md hover:bg-[#1669d0] active:bg-[#125cb8]',
                  )}
                  onClick={handleSend}
                  aria-label={t('common.operation.send')}
                  disabled={isSendButtonDisabled}
                >
                  <RiSendPlaneFill className='h-5 w-5' />
                </button>
              </div>
              {
                visionConfig?.enabled && files.length > 0 && (
                  <div className='pl-1'>
                    <ImageList
                      list={files}
                      onRemove={onRemove}
                      onReUpload={onReUpload}
                      onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                      onImageLinkLoadError={onImageLinkLoadError}
                    />
                  </div>
                )
              }
            </div>
          </div>
        )
      }
    </div>
  )
}

export default React.memo(Chat)
