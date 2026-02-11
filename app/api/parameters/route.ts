import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { client, getInfo, setSession, unauthorizedResponse } from '@/app/api/utils/common'

export async function GET(request: NextRequest) {
  const info = await getInfo(request)
  if (!info) { return unauthorizedResponse() }

  const { sessionId, user } = info
  try {
    const { data } = await client.getApplicationParameters(user)
    return NextResponse.json(data as object, {
      headers: setSession(sessionId),
    })
  }
  catch (error) {
    return NextResponse.json([])
  }
}
