import { post } from './base'

export const uploadRemoteFileInfo = (url: string, isPublic?: boolean, silent?: boolean) => {
  return post<{ id: string, name: string, size: number, mime_type: string, url: string }>(
    '/remote-files/upload',
    { body: { url } },
    { isPublicAPI: isPublic, silent },
  )
}
