import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/app/components/base/button'
import type { ImageFile } from '@/types/app'
import { TransferMethod } from '@/types/app'

interface ImageLinkInputProps {
  onUpload: (imageFile: ImageFile) => void
}
const regex = /^(https?|ftp):\/\//
const ImageLinkInput: FC<ImageLinkInputProps> = ({
  onUpload,
}) => {
  const { t } = useTranslation()
  const [imageLink, setImageLink] = useState('')

  const handleClick = () => {
    const imageFile = {
      type: TransferMethod.remote_url,
      _id: `${Date.now()}`,
      fileId: '',
      progress: regex.test(imageLink) ? 0 : -1,
      url: imageLink,
    }

    onUpload(imageFile)
  }

  return (
    <div className='flex h-8 items-center rounded-lg border border-components-input-border-active bg-components-input-bg-active p-1 shadow-xs'>
      <input
        className='system-sm-regular mr-0.5 block h-full grow appearance-none bg-transparent px-1 outline-none'
        value={imageLink}
        onChange={e => setImageLink(e.target.value)}
        placeholder={t('common.imageUploader.pasteImageLinkInputPlaceholder') || ''}
      />
      <Button
        type='primary'
        className='shrink-0 !h-7 !px-3 !py-0 text-xs font-medium leading-[18px]'
        disabled={!imageLink}
        onClick={handleClick}
      >
        {t('common.operation.ok')}
      </Button>
    </div>
  )
}

export default ImageLinkInput
