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
import FileUploaderInAttachmentWrapper from '@/app/components/base/file-uploader-in-attachment'
import type { FileEntity, FileUpload } from '@/app/components/base/file-uploader-in-attachment/types'
import { SupportUploadFileTypes } from '@/app/components/base/file-uploader-in-attachment/types'
import { getProcessedFiles, hasAvailableFileSlot } from '@/app/components/base/file-uploader-in-attachment/utils'
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
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = React.useState(false)

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
  const [imageFiles, setImageFiles] = React.useState<FileEntity[]>([])
  const imageFileConfig = React.useMemo<FileUpload | undefined>(() => {
    const transferMethods = visionConfig?.transfer_methods
    if (!visionConfig || !transferMethods?.length) { return undefined }

    const allowedMethods = transferMethods.includes(TransferMethod.all)
      ? [TransferMethod.local_file, TransferMethod.remote_url]
      : transferMethods

    return {
      enabled: visionConfig.enabled,
      image: {
        enabled: visionConfig.enabled,
        detail: visionConfig.detail,
        number_limits: visionConfig.number_limits,
        transfer_methods: allowedMethods,
      },
      allowed_file_types: [SupportUploadFileTypes.image],
      allowed_file_upload_methods: allowedMethods,
      number_limits: visionConfig.number_limits,
      fileUploadConfig: {
        batch_count_limit: 5,
        image_file_size_limit: visionConfig.image_file_size_limit,
        file_size_limit: Number(visionConfig.image_file_size_limit) || 0,
      },
    }
  }, [visionConfig])
  const [attachmentFiles, setAttachmentFiles] = React.useState<FileEntity[]>([])
  const handleClipboardPasteReady = (handler: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void) => {
    setHandleAttachmentPaste(() => handler)
  }
  const canUploadImages = !!(visionConfig?.enabled && imageFileConfig?.enabled)
  const canUploadAttachments = !!fileConfig?.enabled
  const combinedFiles = React.useMemo(() => [...imageFiles, ...attachmentFiles], [imageFiles, attachmentFiles])

  const mergedFileConfig = React.useMemo<FileUpload | undefined>(() => {
    if (canUploadAttachments && canUploadImages && fileConfig && imageFileConfig) {
      const allowedFileTypes = Array.from(new Set([
        ...(fileConfig.allowed_file_types || []),
        ...(imageFileConfig.allowed_file_types || []),
      ]))
      const allowedFileExtensions = Array.from(new Set([
        ...(fileConfig.allowed_file_extensions || []),
        ...(imageFileConfig.allowed_file_extensions || []),
      ]))
      const allowedFileUploadMethods = (() => {
        const methods = [
          ...(fileConfig.allowed_file_upload_methods || []),
          ...(imageFileConfig.allowed_file_upload_methods || []),
        ]
        if (!methods.length) { return undefined }
        if (methods.includes(TransferMethod.all)) { return [TransferMethod.local_file, TransferMethod.remote_url] }
        return Array.from(new Set(methods))
      })()

      return {
        ...fileConfig,
        image: imageFileConfig.image || fileConfig.image,
        allowed_file_types: allowedFileTypes,
        allowed_file_extensions: allowedFileExtensions,
        allowed_file_upload_methods: allowedFileUploadMethods,
        fileUploadConfig: {
          ...(fileConfig.fileUploadConfig || {}),
          image_file_size_limit: imageFileConfig.fileUploadConfig?.image_file_size_limit ?? fileConfig.fileUploadConfig?.image_file_size_limit,
        },
      }
    }
    if (canUploadAttachments) { return fileConfig }
    return imageFileConfig
  }, [canUploadAttachments, canUploadImages, fileConfig, imageFileConfig])
  const hasImageUploadSlot = React.useMemo(() => {
    if (!canUploadImages || !imageFileConfig) { return false }
    return hasAvailableFileSlot(imageFileConfig, imageFiles)
  }, [canUploadImages, imageFileConfig, imageFiles])
  const hasAttachmentUploadSlot = React.useMemo(() => {
    if (!canUploadAttachments || !fileConfig) { return false }
    return hasAvailableFileSlot(fileConfig, attachmentFiles)
  }, [attachmentFiles, canUploadAttachments, fileConfig])
  const hasUploadSlot = hasImageUploadSlot || hasAttachmentUploadSlot
  const isAttachmentButtonDisabled = (!canUploadImages && !canUploadAttachments) || !hasUploadSlot
  useEffect(() => {
    if (isAttachmentButtonDisabled && isAttachmentMenuOpen) { setIsAttachmentMenuOpen(false) }
  }, [isAttachmentButtonDisabled, isAttachmentMenuOpen])

  const handleSendMessage = () => {
    if (isSendButtonDisabled) { return }
    if (!valid() || (checkCanSend && !checkCanSend())) { return }
    const imageFilePayloads: VisionFile[] = getProcessedFiles(imageFiles)
    const docAndOtherFiles: VisionFile[] = getProcessedFiles(attachmentFiles)
    const combinedFiles: VisionFile[] = [...imageFilePayloads, ...docAndOtherFiles]
    onSend(queryRef.current, combinedFiles)
    if (isAttachmentMenuOpen) { setIsAttachmentMenuOpen(false) }
    const hasPendingLocalImages = imageFiles.some(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)
    if (!hasPendingLocalImages) {
      if (imageFiles.length) { setImageFiles([]) }
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
      if (!e.shiftKey && !isUseInputMethod.current) { handleSendMessage() }
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
    const current = queryRef.current
    const nextQuery = current ? `${current.replace(/\s+$/, '')} ${suggestion}` : suggestion
    setQuery(nextQuery)
    queryRef.current = nextQuery
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
                  (canUploadImages || canUploadAttachments) && mergedFileConfig && (
                    <div className='relative flex items-start'>
                      <div
                        className={cn(
                          'absolute right-0 bottom-full mb-2 w-[360px] rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_12px_30px_rgba(24,39,75,0.08)]',
                          !isAttachmentMenuOpen && 'hidden',
                        )}
                      >
                        <FileUploaderInAttachmentWrapper
                          fileConfig={mergedFileConfig}
                          value={combinedFiles}
                          onChange={(files) => {
                            const images = files.filter(f => f.supportFileType === 'image')
                            const attachments = files.filter(f => f.supportFileType !== 'image')
                            setImageFiles(images)
                            setAttachmentFiles(attachments)
                          }}
                          onHandleClipboardPasteFile={handleClipboardPasteReady}
                          variant='default'
                          listDisplay={canUploadImages ? 'image' : 'file'}
                        />
                      </div>
                      <button
                        type='button'
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          isAttachmentButtonDisabled ? 'cursor-not-allowed bg-gray-100 text-gray-300' : 'bg-white text-gray-500 hover:bg-gray-100',
                          isAttachmentMenuOpen && !isAttachmentButtonDisabled && 'bg-gray-100 text-gray-600',
                        )}
                        disabled={isAttachmentButtonDisabled}
                        onClick={() => {
                          if (isAttachmentButtonDisabled) { return }
                          setIsAttachmentMenuOpen(v => !v)
                        }}
                      >
                        <RiAttachmentLine className='h-5 w-5' />
                      </button>
                    </div>
                  )
                }
                <button
                  type='button'
                  className={cn(
                    'self-center flex h-10 w-10 items-center justify-center rounded-full',
                    isSendButtonDisabled ? 'cursor-not-allowed bg-gray-100 text-gray-300 shadow-none' : 'bg-[#1a73e8] text-white shadow-md hover:bg-[#1669d0] active:bg-[#125cb8]',
                  )}
                  onClick={handleSendMessage}
                  aria-label={t('common.operation.send')}
                  disabled={isSendButtonDisabled}
                >
                  <RiSendPlaneFill className='h-5 w-5' />
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default React.memo(Chat)
