import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession, unauthorizedResponse } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  const info = await getInfo(request)
  if (!info) { return unauthorizedResponse() }

  const { sessionId, user } = info
  const searchParams = request.nextUrl.searchParams
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Number(limitParam) : undefined
  const firstId = searchParams.get('first_id') || searchParams.get('last_id') || undefined
  const pinnedParam = searchParams.get('pinned')
  let pinned: boolean | undefined

  if (pinnedParam === 'true') { pinned = true }
  else if (pinnedParam === 'false') { pinned = false }
  try {
    const { data }: any = await client.getConversations(
      user,
      firstId,
      Number.isFinite(limit) ? limit : undefined,
      pinned,
    )
    return NextResponse.json(data, {
      headers: setSession(sessionId),
    })
  }
  catch (error: any) {
    return NextResponse.json({
      data: [],
      error: error.message,
    })
  }
}
