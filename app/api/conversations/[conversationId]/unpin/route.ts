import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession, unauthorizedResponse } from '@/app/api/utils/common'

export async function PATCH(request: NextRequest, { params }: {
  params: Promise<{ conversationId: string }>
}) {
  const info = await getInfo(request)
  if (!info) { return unauthorizedResponse() }

  const { conversationId } = await params
  const { sessionId, user } = info

  try {
    const { data } = await client.sendRequest('PATCH', `/conversations/${conversationId}/unpin`, { user })
    return NextResponse.json(data, {
      headers: setSession(sessionId),
    })
  }
  catch (error: any) {
    const status = error?.response?.status || 500
    const message = error?.response?.data?.message || error.message || 'Unknown error'
    return NextResponse.json({ message }, { status })
  }
}
