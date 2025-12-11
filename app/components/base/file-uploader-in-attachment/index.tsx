import {
  useCallback,
  useEffect,
  useMemo,
} from 'react'
import type { ClipboardEvent, ReactNode } from 'react'
import {
  RiAttachmentLine,
} from '@remixicon/react'
import { useFile } from './hooks'
import type { FileEntity, FileUpload } from './types'
import { SupportUploadFileTypes } from './types'
import FileFromLinkOrLocal from './file-from-link-or-local'
import {
  FileContextProvider,
  useStore,
} from './store'
import FileItem from './file-item'
import ImageList from '@/app/components/base/image-uploader/image-list'
import cn from '@/utils/classnames'
import type { ImageFile } from '@/types/app'
import { TransferMethod } from '@/types/app'

interface FileUploaderInAttachmentProps {
  fileConfig: FileUpload
  onHandleClipboardPasteFile?: (handle: (e: ClipboardEvent<HTMLTextAreaElement>) => void) => void
  variant?: 'default' | 'compact'
  trigger?: (open: boolean) => ReactNode
  listClassName?: string
  showList?: boolean
  listDisplay?: 'file' | 'image'
}
const FileUploaderInAttachment = ({
  fileConfig,
  onHandleClipboardPasteFile,
  variant = 'default',
  trigger,
  listClassName,
  showList = true,
  listDisplay = 'file',
}: FileUploaderInAttachmentProps) => {
  const files = useStore(s => s.files)
  const {
    handleRemoveFile,
    handleReUploadFile,
    handleClipboardPasteFile,
    handleLoadFileFromLinkSuccess,
    handleLoadFileFromLinkError,
  } = useFile(fileConfig)
  const allowedUploadMethods = useMemo(() => {
    const methods = fileConfig.allowed_file_upload_methods?.length
      ? fileConfig.allowed_file_upload_methods
      : [TransferMethod.local_file, TransferMethod.remote_url]

    if (methods.includes(TransferMethod.all)) { return [TransferMethod.local_file, TransferMethod.remote_url] }

    return methods
  }, [fileConfig.allowed_file_upload_methods])
  const imageFiles = useMemo<ImageFile[]>(() => {
    return files
      .filter(file => file.supportFileType === SupportUploadFileTypes.image)
      .map(file => ({
        type: file.transferMethod,
        _id: file.id,
        fileId: file.uploadedId || '',
        file: file.originalFile,
        progress: file.progress,
        url: file.url || '',
        base64Url: file.base64Url || file.url || '',
      }))
  }, [files])
  const showFromLocal = allowedUploadMethods.includes(TransferMethod.local_file)
  const showFromLink = allowedUploadMethods.includes(TransferMethod.remote_url)
  const hasUploadMethods = showFromLocal || showFromLink

  useEffect(() => {
    onHandleClipboardPasteFile?.(handleClipboardPasteFile)
  }, [handleClipboardPasteFile, onHandleClipboardPasteFile])

  const renderCompactTrigger = useCallback((open: boolean) => {
    const disabled = !!(fileConfig.number_limits && files.length >= fileConfig.number_limits)
    if (trigger) { return trigger(open) }

    return (
      <button
        type='button'
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500',
          disabled ? 'cursor-not-allowed bg-gray-100 text-gray-300' : 'bg-white hover:bg-gray-100',
          open && 'bg-gray-100 text-gray-600',
        )}
        disabled={disabled}
      >
        <RiAttachmentLine className='h-5 w-5' />
      </button>
    )
  }, [fileConfig.number_limits, files.length, trigger])

  if (variant === 'compact') {
    return (
      <div className='relative flex items-center'>
        {
          hasUploadMethods && (
            <FileFromLinkOrLocal
              showFromLocal={showFromLocal}
              showFromLink={showFromLink}
              trigger={renderCompactTrigger}
              fileConfig={fileConfig}
            />
          )
        }
        {
          showList && files.length > 0 && (
            <div className={cn('mt-2 space-y-1', listClassName)}>
              {listDisplay === 'image'
                ? (
                  <ImageList
                    list={imageFiles}
                    onRemove={handleRemoveFile}
                    onReUpload={handleReUploadFile}
                    onImageLinkLoadSuccess={handleLoadFileFromLinkSuccess}
                    onImageLinkLoadError={handleLoadFileFromLinkError}
                  />
                )
                : (
                  files.map(file => (
                    <FileItem
                      key={file.id}
                      file={file}
                      showDeleteAction
                      showDownloadAction={false}
                      canPreview={file.supportFileType === SupportUploadFileTypes.image}
                      onRemove={() => handleRemoveFile(file.id)}
                      onReUpload={() => handleReUploadFile(file.id)}
                    />
                  ))
                )}
            </div>
          )
        }
      </div>
    )
  }

  return (
    <div>
      {
        hasUploadMethods && (
          <div className='flex justify-center'>
            <FileFromLinkOrLocal
              showFromLocal={showFromLocal}
              showFromLink={showFromLink}
              fileConfig={fileConfig}
            />
          </div>
        )
      }
      <div className='mt-1 space-y-1'>
        {
          listDisplay === 'image'
            ? (
              <ImageList
                list={imageFiles}
                onRemove={handleRemoveFile}
                onReUpload={handleReUploadFile}
                onImageLinkLoadSuccess={handleLoadFileFromLinkSuccess}
                onImageLinkLoadError={handleLoadFileFromLinkError}
              />
            )
            : (
              files.map(file => (
                <FileItem
                  key={file.id}
                  file={file}
                  showDeleteAction
                  showDownloadAction={false}
                  canPreview={file.supportFileType === SupportUploadFileTypes.image}
                  onRemove={() => handleRemoveFile(file.id)}
                  onReUpload={() => handleReUploadFile(file.id)}
                />
              ))
            )
        }
      </div>
    </div>
  )
}

interface FileUploaderInAttachmentWrapperProps {
  value?: FileEntity[]
  onChange: (files: FileEntity[]) => void
  fileConfig: FileUpload
  onHandleClipboardPasteFile?: (handle: (e: ClipboardEvent<HTMLTextAreaElement>) => void) => void
  variant?: 'default' | 'compact'
  trigger?: (open: boolean) => React.ReactNode
  listClassName?: string
  showList?: boolean
  listDisplay?: 'file' | 'image'
}
const FileUploaderInAttachmentWrapper = ({
  value,
  onChange,
  fileConfig,
  onHandleClipboardPasteFile,
  variant,
  trigger,
  listClassName,
  showList,
  listDisplay,
}: FileUploaderInAttachmentWrapperProps) => {
  return (
    <FileContextProvider
      value={value}
      onChange={onChange}
    >
      <FileUploaderInAttachment
        fileConfig={fileConfig}
        onHandleClipboardPasteFile={onHandleClipboardPasteFile}
        variant={variant}
        trigger={trigger}
        listClassName={listClassName}
        showList={showList}
        listDisplay={listDisplay}
      />
    </FileContextProvider>
  )
}

export default FileUploaderInAttachmentWrapper
