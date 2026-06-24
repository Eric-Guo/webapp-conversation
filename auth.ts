import 'server-only'

import type { NextAuthConfig } from 'next-auth'
import NextAuth from 'next-auth'

import { DEFAULT_SSO_DEV_ISSUER, DEFAULT_SSO_PROD_ISSUER, OIDC_PROVIDER_ID } from '@/config/auth'

const defaultIssuer = process.env.NODE_ENV === 'production' ? DEFAULT_SSO_PROD_ISSUER : DEFAULT_SSO_DEV_ISSUER
const allowedUserNames = new Set(['guochunzhong', 'zengrong', 'xuxiaohong', 'zhangjing4'])
const issuer = process.env.AUTH_SSO_ISSUER || defaultIssuer
const clientId = process.env.AUTH_SSO_CLIENT_ID
const clientSecret = process.env.AUTH_SSO_CLIENT_SECRET
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

const userInfoEndpoint = process.env.AUTH_SSO_USERINFO || `${issuer?.replace(/\/$/, '')}/oauth/userinfo`

interface MainPosition {
  id?: string | number
  name?: string
  functional_category?: string | null
}

interface InternalMetrics {
  functional_category?: string | null
}

const logUserInfo = (label: string, userInfo?: Record<string, any> | null) => {
  if (!userInfo) {
    console.log(`${label}: null`)
    return
  }

  console.log(label, {
    sub: userInfo.sub,
    name: userInfo.name,
    chinese_name: userInfo.chinese_name,
    clerk_code: userInfo.clerk_code,
    email: userInfo.email,
    main_position: userInfo.main_position,
  })
}

const fetchUserInfo = async (accessToken?: string) => {
  if (!accessToken) { return null }
  if (!userInfoEndpoint) { return null }

  try {
    const res = await fetch(userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })
    if (!res.ok) { return null }
    const data = await res.json()
    return data as Record<string, any>
  }
  catch {
    return null
  }
}

const normalizeUserName = (name?: unknown) => {
  if (typeof name !== 'string') { return '' }
  return name.trim().toLowerCase()
}

const normalizeMainPosition = (mainPosition?: unknown): MainPosition | null => {
  let parsedMainPosition = mainPosition
  if (typeof parsedMainPosition === 'string') {
    try {
      parsedMainPosition = JSON.parse(parsedMainPosition)
    }
    catch {
      return null
    }
  }

  if (!parsedMainPosition || typeof parsedMainPosition !== 'object' || Array.isArray(parsedMainPosition)) { return null }

  const position = parsedMainPosition as Record<string, unknown>
  const id = typeof position.id === 'string' || typeof position.id === 'number' ? position.id : undefined
  const name = typeof position.name === 'string' ? position.name : undefined
  const functionalCategory = typeof position.functional_category === 'string' ? position.functional_category : null

  if (!id && !name && !functionalCategory) { return null }

  return {
    id,
    name,
    functional_category: functionalCategory,
  }
}

const normalizeInternalMetrics = (internalMetrics?: unknown): InternalMetrics | null => {
  if (!internalMetrics || typeof internalMetrics !== 'object' || Array.isArray(internalMetrics)) { return null }

  const metrics = internalMetrics as Record<string, unknown>
  const functionalCategory = typeof metrics.functional_category === 'string' ? metrics.functional_category : null
  if (!functionalCategory) { return null }

  return {
    functional_category: functionalCategory,
  }
}

const buildInternalMetrics = (mainPosition?: MainPosition | null, internalMetrics?: unknown): InternalMetrics | null => {
  const normalizedInternalMetrics = normalizeInternalMetrics(internalMetrics)
  const functionalCategory = mainPosition?.functional_category || normalizedInternalMetrics?.functional_category || null
  if (!functionalCategory) { return null }

  return {
    functional_category: functionalCategory,
  }
}

if (!clientId || !clientSecret) {
  throw new Error('Missing AUTH_SSO_CLIENT_ID or AUTH_SSO_CLIENT_SECRET. Set them in .env.local to enable SSO.')
}

if (!authSecret) {
  throw new Error('Missing AUTH_SECRET (or NEXTAUTH_SECRET). Set it in .env.local to secure auth sessions.')
}

const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: authSecret,
  session: {
    strategy: 'jwt',
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  providers: [
    {
      id: OIDC_PROVIDER_ID,
      name: 'Thape SSO',
      type: 'oidc',
      issuer,
      clientId,
      clientSecret,
      authorization: { params: { scope: 'openid email clerk_code chinese_name profile departments positions main_position' } },
      checks: ['pkce', 'state', 'nonce'],
      profile(profile: Record<string, any>) {
        console.log('provider profile', profile)

        const id = profile.email || profile.sub || profile.chinese_name || profile.id
        const mainPosition = normalizeMainPosition(profile.main_position)
        return {
          id,
          name: profile.chinese_name || profile.email || 'User',
          email: profile.email ?? null,
          chinese_name: profile.chinese_name ?? null,
          clerk_code: profile.clerk_code ?? null,
          main_position: mainPosition,
          internal_metrics: buildInternalMetrics(mainPosition),
        }
      },
    },
  ],
  callbacks: {
    async signIn({ account }) {
      if (!account?.access_token) { return false }
      const userInfo = await fetchUserInfo(account.access_token)
      logUserInfo('signIn userInfo', userInfo)
      const candidateName = normalizeUserName(userInfo?.name)
      if (!candidateName) { return false }

      return allowedUserNames.has(candidateName) || process.env.NEXT_PUBLIC_TITLE === 'Nano Banana 生图助手' || process.env.NEXT_PUBLIC_TITLE === 'Gemini Flash Lite'
    },
    async jwt(jwt_data) {
      console.log('jwt_data:', jwt_data)
      const { token, profile, account, user } = jwt_data

      if (profile) {
        token.email = profile.email || token.email
        token.chinese_name = profile.chinese_name || token.chinese_name
        token.clerk_code = profile.clerk_code || token.clerk_code
        token.name = profile.name || profile.email || token.name
        const profileMainPosition = normalizeMainPosition(profile.main_position)
        token.main_position = profileMainPosition || token.main_position
        token.internal_metrics = buildInternalMetrics(profileMainPosition, token.internal_metrics) || token.internal_metrics
      }

      if (user) {
        token.email = user.email || token.email
        token.chinese_name = user.chinese_name || token.chinese_name
        token.clerk_code = user.clerk_code || token.clerk_code
        token.name = user.name || token.name
        const userRecord = user as Record<string, unknown>
        const userMainPosition = normalizeMainPosition(userRecord.main_position)
        token.main_position = userMainPosition || token.main_position
        token.internal_metrics = buildInternalMetrics(userMainPosition, userRecord.internal_metrics || token.internal_metrics) || token.internal_metrics
      }

      if (account?.access_token && (!token.email || !token.name || !token.main_position || !token.internal_metrics || !token.chinese_name || !token.clerk_code)) {
        const userInfo = await fetchUserInfo(account.access_token)
        logUserInfo('jwt userInfo', userInfo)
        // there is more data in userInfo if required.
        if (userInfo) {
          const userInfoMainPosition = normalizeMainPosition(userInfo.main_position)
          token.email = userInfo.email || token.email
          token.chinese_name = userInfo.chinese_name || token.chinese_name
          token.clerk_code = userInfo.clerk_code || token.clerk_code
          token.name = userInfo.name || token.name
          token.main_position = userInfoMainPosition || token.main_position
          token.internal_metrics = buildInternalMetrics(userInfoMainPosition, token.internal_metrics) || token.internal_metrics
        }
      }

      token.internal_metrics = buildInternalMetrics(normalizeMainPosition(token.main_position), token.internal_metrics) || token.internal_metrics

      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.chinese_name = (token.chinese_name as string) || session.user.chinese_name || null
        session.user.clerk_code = (token.clerk_code as string) || session.user.clerk_code || null
        session.user.email = (token.email as string) || session.user.email || null
        session.user.name = (token.name as string) || session.user.name || null // replace gongzhuyuan or other user to simulate
        session.user.main_position = (token.main_position as MainPosition | null) || session.user.main_position || null
        session.user.internal_metrics = (token.internal_metrics as InternalMetrics | null) || session.user.internal_metrics || null
      }

      return session
    },
  },
}

const authResult = NextAuth(authConfig)

export const { handlers, auth, signIn, signOut } = authResult
export const { GET, POST } = handlers
export { OIDC_PROVIDER_ID }
