import type { NextRequest } from 'next/server'
import { client, getInfo, unauthorizedResponse } from '@/app/api/utils/common'

export async function POST(request: NextRequest) {
  const info = await getInfo(request)
  if (!info) { return unauthorizedResponse() }

  try {
    const formData = await request.formData()
    formData.append('user', info.user)
    const res = await client.fileUpload(formData)
    return new Response(res.data.id as any)
  }
  catch (e: any) {
    return new Response(e.message)
  }
}
