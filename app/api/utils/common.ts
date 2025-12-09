import type { NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { v4 } from 'uuid'
import { auth } from '@/auth'
import { APP_ID, API_KEY, API_URL, APP_INFO } from '@/config'

export const getInfo = async (request: NextRequest) => {
  const session = await auth()
  const userPrefix = `user_${APP_ID}_${session?.user?.name}:`
  const sessionId = request.cookies.get('session_id')?.value || v4()
  const user = userPrefix
  return {
    sessionId,
    user,
  }
}

export const setSession = (sessionId: string) => {
  if (APP_INFO.disable_session_same_site)
  { return { 'Set-Cookie': `session_id=${sessionId}; SameSite=None; Secure` } }

  return { 'Set-Cookie': `session_id=${sessionId}` }
}

export const client = new ChatClient(API_KEY, API_URL || undefined)
