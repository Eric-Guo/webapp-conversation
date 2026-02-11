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

  const normalizedName = typeof name === 'string' ? name : ''
  const autoGenerate = typeof auto_generate === 'boolean' ? auto_generate : false

  try {
    const { data } = await client.renameConversation(conversationId, normalizedName, user, autoGenerate)
    return NextResponse.json(data)
  }
  catch (error: any) {
    const status = error?.response?.status || 500
    const message = error?.response?.data?.message || error.message || 'Unknown error'
    return NextResponse.json({ message }, { status })
  }
}
