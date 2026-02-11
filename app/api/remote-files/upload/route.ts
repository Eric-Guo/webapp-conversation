import { NextResponse } from 'next/server'
import { BASE_URL } from 'dify-client'
import type { NextRequest } from 'next/server'
import { API_KEY, API_URL } from '@/config'
import { getInfo, unauthorizedResponse } from '@/app/api/utils/common'

const REMOTE_FILE_UPLOAD_PATH = '/remote-files/upload'

export async function POST(request: NextRequest) {
  const info = await getInfo(request)
  if (!info) { return unauthorizedResponse() }

  const body = await request.json().catch(() => ({}))
  const { url } = body as { url?: string }

  if (!url) {
    return NextResponse.json({ message: 'url is required' }, { status: 400 })
  }

  const baseUrl = API_URL && API_URL !== 'undefined' ? API_URL : BASE_URL

  try {
    const response = await fetch(`${baseUrl}${REMOTE_FILE_UPLOAD_PATH}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, user: info.user }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = (data as any)?.message || 'Remote file upload failed'
      return NextResponse.json(
        (data as any)?.message ? data : { message },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  }
  catch (e: any) {
    const message = e?.message || 'Remote file upload failed'
    return NextResponse.json({ message }, { status: 500 })
  }
}
