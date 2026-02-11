import {
  memo,
  useState,
} from 'react'
import {
  RiDeleteBinLine,
  RiDownloadLine,
  RiEyeLine,
} from '@remixicon/react'
import FileTypeIcon from './file-type-icon'
import FileImageRender from './file-image-render'
import type { FileEntity } from './types'
import {
  downloadFile,
  fileIsUploaded,
  getFileAppearanceType,
  getFileExtension,
} from './utils'
import { SupportUploadFileTypes } from './types'
import ActionButton from '@/app/components/base/action-button'
import ProgressCircle from '@/app/components/base/progress-bar/progress-circle'
import { formatFileSize } from '@/utils/format'
import cn from '@/utils/classnames'
import ReplayLine from '@/app/components/base/icons/other/ReplayLine'
import ImagePreview from '@/app/components/base/image-uploader/image-preview'
import { TransferMethod } from '@/types/app'

interface FileInAttachmentItemProps {
  file: FileEntity
  showDeleteAction?: boolean
  showDownloadAction?: boolean
  onRemove?: (fileId: string) => void
  onReUpload?: (fileId: string) => void
  canPreview?: boolean
  onImageLinkLoadSuccess?: () => void
  onImageLinkLoadError?: () => void
}
const FileInAttachmentItem = ({
  file,
  showDeleteAction,
  showDownloadAction = true,
  onRemove,
  onReUpload,
  canPreview,
  onImageLinkLoadSuccess,
  onImageLinkLoadError,
}: FileInAttachmentItemProps) => {
  const { id, name, type, progress, supportFileType, base64Url, url, isRemote } = file
  const ext = getFileExtension(name, type, isRemote)
  const isImageFile = supportFileType === SupportUploadFileTypes.image
  const imageUrl = base64Url || url || ''
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')

  const handleImageLoad = () => {
    if (file.transferMethod !== TransferMethod.remote_url || file.progress === -1) { return }
    onImageLinkLoadSuccess?.()
  }
  const handleImageError = () => {
    if (file.transferMethod !== TransferMethod.remote_url) { return }
    onImageLinkLoadError?.()
  }
  return (
    <>
      <div className={cn(
        'flex h-12 items-center rounded-lg border-[0.5px] border-components-panel-border bg-components-panel-on-panel-item-bg pr-3 shadow-xs',
        progress === -1 && 'border-state-destructive-border bg-state-destructive-hover',
      )}>
        <div className='flex h-12 w-12 items-center justify-center'>
          {
            isImageFile && (
              <FileImageRender
                className='h-8 w-8'
                imageUrl={imageUrl}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )
          }
          {
            !isImageFile && (
              <FileTypeIcon
                type={getFileAppearanceType(name, type)}
                size='lg'
              />
            )
          }
        </div>
        <div className='mr-1 w-0 grow'>
          <div
            className='system-xs-medium mb-0.5 flex items-center truncate text-text-secondary'
            title={file.name}
          >
            <div className='truncate'>{name}</div>
          </div>
          <div className='system-2xs-medium-uppercase flex items-center text-text-tertiary'>
            {
              ext && (
                <span>{ext.toLowerCase()}</span>
              )
            }
            {
              ext && (
                <span className='system-2xs-medium mx-1'>•</span>
              )
            }
            {
              !!file.size && (
                <span>{formatFileSize(file.size)}</span>
              )
            }
          </div>
        </div>
        <div className='flex shrink-0 items-center'>
          {
            progress >= 0 && !fileIsUploaded(file) && (
              <ProgressCircle
                className='mr-2.5'
                percentage={progress}
              />
            )
          }
          {
            progress === -1 && file.transferMethod === TransferMethod.local_file && (
              <ActionButton
                className='mr-1'
                onClick={() => onReUpload?.(id)}
              >
                <ReplayLine className='h-4 w-4 text-text-tertiary' />
              </ActionButton>
            )
          }
          {
            showDeleteAction && (
              <ActionButton onClick={() => onRemove?.(id)}>
                <RiDeleteBinLine className='h-4 w-4' />
              </ActionButton>
            )
          }
          {
            canPreview && isImageFile && (
              <ActionButton className='mr-1' onClick={() => setImagePreviewUrl(imageUrl)}>
                <RiEyeLine className='h-4 w-4' />
              </ActionButton>
            )
          }
          {
            showDownloadAction && (
              <ActionButton onClick={(e) => {
                e.stopPropagation()
                downloadFile(url || base64Url || '', name)
              }}>
                <RiDownloadLine className='h-4 w-4' />
              </ActionButton>
            )
          }
        </div>
      </div>
      {
        imagePreviewUrl && canPreview && (
          <ImagePreview
            title={name}
            url={imagePreviewUrl}
            onCancel={() => setImagePreviewUrl('')}
          />
        )
      }
    </>
  )
}

export default memo(FileInAttachmentItem)
