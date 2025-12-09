import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Uploader from './uploader'
import ImageLinkInput from './image-link-input'
import { TransferMethod } from '@/types/app'
import {
  PortalToFollowElem,
  PortalToFollowElemContent,
  PortalToFollowElemTrigger,
} from '@/app/components/base/portal-to-follow-elem'
import Upload03 from '@/app/components/base/icons/line/upload-03'
import FolderUpload from '@/app/components/base/icons/other/folder-upload'
import type { ImageFile, VisionSettings } from '@/types/app'

interface UploadTriggerProps {
  hovering?: boolean
  disabled?: boolean
}
const UploadTrigger: FC<UploadTriggerProps> = ({
  hovering,
  disabled,
}) => {
  return (
    <div className={`
      relative flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200
      ${disabled ? 'cursor-not-allowed bg-gray-50 text-gray-300' : 'cursor-pointer hover:bg-gray-50'}
      ${hovering ? 'bg-gray-100' : ''}
    `}>
      <FolderUpload className={`h-4 w-4 ${disabled ? 'text-gray-300' : 'text-gray-500'}`} />
    </div>
  )
}

interface UploadOnlyFromLocalProps {
  onUpload: (imageFile: ImageFile) => void
  disabled?: boolean
  limit?: number
}
const UploadOnlyFromLocal: FC<UploadOnlyFromLocalProps> = ({
  onUpload,
  disabled,
  limit,
}) => {
  return (
    <Uploader onUpload={onUpload} disabled={disabled} limit={limit}>
      {
        hovering => (
          <UploadTrigger hovering={hovering} disabled={disabled} />
        )
      }
    </Uploader>
  )
}

interface UploaderButtonProps {
  methods: VisionSettings['transfer_methods']
  onUpload: (imageFile: ImageFile) => void
  disabled?: boolean
  limit?: number
}
const UploaderButton: FC<UploaderButtonProps> = ({
  methods,
  onUpload,
  disabled,
  limit,
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const hasUploadFromLocal = methods.find(method => method === TransferMethod.local_file)

  const handleUpload = (imageFile: ImageFile) => {
    setOpen(false)
    onUpload(imageFile)
  }

  const handleToggle = () => {
    if (disabled) { return }

    setOpen(v => !v)
  }

  return (
    <PortalToFollowElem
      open={open}
      onOpenChange={setOpen}
      placement='top-start'
    >
      <PortalToFollowElemTrigger onClick={handleToggle}>
        <UploadTrigger disabled={disabled} />
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent className='z-[1001]'>
        <div className='w-[280px] rounded-xl border-[0.5px] border-components-panel-border bg-components-panel-bg-blur p-3 shadow-lg'>
          <ImageLinkInput onUpload={handleUpload} />
          {
            hasUploadFromLocal && (
              <>
                <div className='system-2xs-medium-uppercase flex h-7 items-center p-2 text-text-quaternary'>
                  <div className='mr-2 h-[1px] w-[93px] bg-gradient-to-l from-[rgba(16,24,40,0.08)]' />
                  OR
                  <div className='ml-2 h-[1px] w-[93px] bg-gradient-to-r from-[rgba(16,24,40,0.08)]' />
                </div>
                <Uploader onUpload={handleUpload} limit={limit} disabled={disabled}>
                  {
                    hovering => (
                      <div className={`
                        relative flex h-9 w-full items-center justify-center rounded-lg border border-gray-200 text-sm font-medium text-gray-500
                        ${disabled ? 'cursor-not-allowed bg-gray-100 text-gray-300' : 'cursor-pointer bg-white hover:bg-white hover:shadow-sm hover:border-gray-300'}
                        ${hovering && !disabled ? 'shadow-sm border-gray-300' : ''}
                      `}>
                        <Upload03 className='mr-1 w-4 h-4' />
                        {t('common.imageUploader.uploadFromComputer')}
                      </div>
                    )
                  }
                </Uploader>
              </>
            )
          }
        </div>
      </PortalToFollowElemContent>
    </PortalToFollowElem>
  )
}

interface ChatImageUploaderProps {
  settings: VisionSettings
  onUpload: (imageFile: ImageFile) => void
  disabled?: boolean
}
const ChatImageUploader: FC<ChatImageUploaderProps> = ({
  settings,
  onUpload,
  disabled,
}) => {
  const onlyUploadLocal = settings.transfer_methods.length === 1 && settings.transfer_methods[0] === TransferMethod.local_file

  if (onlyUploadLocal) {
    return (
      <UploadOnlyFromLocal
        onUpload={onUpload}
        disabled={disabled}
        limit={+settings.image_file_size_limit!}
      />
    )
  }

  return (
    <UploaderButton
      methods={settings.transfer_methods}
      onUpload={onUpload}
      disabled={disabled}
      limit={+settings.image_file_size_limit!}
    />
  )
}

export default ChatImageUploader
