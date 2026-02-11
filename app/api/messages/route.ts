import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession, unauthorizedResponse } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  const info = await getInfo(request)
  if (!info) { return unauthorizedResponse() }

  const { sessionId, user } = info
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversation_id')
  const { data }: any = await client.getConversationMessages(user, conversationId as string)
  return NextResponse.json(data, {
    headers: setSession(sessionId),
  })
}
