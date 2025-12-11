import { useFile } from './hooks'
import { useStore } from './store'
import type { FileUpload } from './types'
import { FILE_EXTS } from './constants'
import { SupportUploadFileTypes } from './types'
import { getLimitForFileType, hasAvailableFileSlot } from './utils'

interface FileInputProps {
  fileConfig: FileUpload
}
const FileInput = ({
  fileConfig,
}: FileInputProps) => {
  const files = useStore(s => s.files)
  const { handleLocalFileUpload } = useFile(fileConfig)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetFiles = e.target.files

    if (targetFiles) {
      for (let i = 0; i < targetFiles.length; i++) {
        handleLocalFileUpload(targetFiles[i])
      }
    }
  }

  const allowedFileTypes = fileConfig.allowed_file_types
  const isCustom = allowedFileTypes?.includes(SupportUploadFileTypes.custom)
  const exts = isCustom ? (fileConfig.allowed_file_extensions || []) : (allowedFileTypes?.map(type => FILE_EXTS[type]) || []).flat().map(item => `.${item}`)
  const accept = exts.join(',')
  const typeLimits = allowedFileTypes?.map(type => getLimitForFileType(type, fileConfig)).filter(limit => typeof limit === 'number') as number[] | undefined
  const maxLimit = typeLimits?.length ? Math.max(...typeLimits) : getLimitForFileType('', fileConfig)
  const multiple = typeof maxLimit === 'number' ? maxLimit > 1 : false

  return (
    <input
      className='absolute inset-0 block w-full cursor-pointer text-[0] opacity-0 disabled:cursor-not-allowed'
      onClick={e => ((e.target as HTMLInputElement).value = '')}
      type='file'
      onChange={handleChange}
      accept={accept}
      disabled={!hasAvailableFileSlot(fileConfig, files)}
      multiple={multiple}
    />
  )
}

export default FileInput
