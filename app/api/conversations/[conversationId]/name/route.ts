import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, unauthorizedResponse } from '@/app/api/utils/common'

export async function POST(request: NextRequest, { params }: {
  params: Promise<{ conversationId: string }>
}) {
  const info = await getInfo(request)
  if (!info) { return unauthorizedResponse() }

  const { conversationId } = await params
  const body = await request.json()
  const {
    auto_generate,
    name,
  } = body
  const { user } = info

  // auto generate name
  const { data } = await client.renameConversation(conversationId, name, user, auto_generate)
  return NextResponse.json(data)
}
