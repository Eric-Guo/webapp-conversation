import 'server-only'

import type { NextAuthConfig } from 'next-auth'
import NextAuth from 'next-auth'

import { DEFAULT_SSO_DEV_ISSUER, DEFAULT_SSO_PROD_ISSUER, OIDC_PROVIDER_ID } from '@/config/auth'

const defaultIssuer = process.env.NODE_ENV === 'production' ? DEFAULT_SSO_PROD_ISSUER : DEFAULT_SSO_DEV_ISSUER
const issuer = process.env.AUTH_SSO_ISSUER || defaultIssuer
const clientId = process.env.AUTH_SSO_CLIENT_ID
const clientSecret = process.env.AUTH_SSO_CLIENT_SECRET
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

const userInfoEndpoint = process.env.AUTH_SSO_USERINFO || `${issuer?.replace(/\/$/, '')}/oauth/userinfo`

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
      authorization: { params: { scope: 'openid email profile departments positions main_position' } },
      checks: ['pkce', 'state', 'nonce'],
      profile(profile: Record<string, any>) {
        const id = profile.email || profile.sub || profile.preferred_username || profile.id
        return {
          id,
          name: profile.name || profile.preferred_username || profile.email || 'User',
          email: profile.email ?? null,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, profile, account, user }) {
      if (profile) {
        token.email = profile.email || profile.preferred_username || token.email
        token.name = profile.name || profile.preferred_username || profile.email || token.name
      }

      if (user) {
        token.email = user.email || token.email
        token.name = user.name || token.name
      }

      if (account?.access_token && (!token.email || !token.name)) {
        const userInfo = await fetchUserInfo(account.access_token)
        // there is more data in userInfo if required.
        if (userInfo) {
          token.email = userInfo.email || userInfo.preferred_username || token.email
          token.name = userInfo.name || userInfo.preferred_username || userInfo.email || token.name
        }
      }

      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.email = (token.email as string) || session.user.email || null
        session.user.name = (token.name as string) || session.user.name || null
      }

      return session
    },
  },
}

const authResult = NextAuth(authConfig)

export const { handlers, auth, signIn, signOut } = authResult
export const { GET, POST } = handlers
export { OIDC_PROVIDER_ID }
