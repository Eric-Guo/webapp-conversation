import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, unauthorizedResponse } from '@/app/api/utils/common'

export async function POST(request: NextRequest, { params }: {
  params: Promise<{ messageId: string }>
}) {
  const info = await getInfo(request)
  if (!info) { return unauthorizedResponse() }

  const { messageId } = await params
  const body = await request.json()
  const {
    rating,
  } = body
  const { user } = info
  const { data } = await client.messageFeedback(messageId, rating, user)
  return NextResponse.json(data)
}
