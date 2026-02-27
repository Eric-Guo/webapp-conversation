import type { DefaultSession } from 'next-auth'

interface SsoMainPosition {
  id?: string | number
  name?: string
  functional_category?: string | null
}

interface SsoInternalMetrics {
  functional_category?: string | null
}

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      clerk_code?: string | null
      chinese_name?: string | null
      main_position?: SsoMainPosition | null
      internal_metrics?: SsoInternalMetrics | null
    }
  }

  interface User {
    clerk_code?: string | null
    chinese_name?: string | null
    main_position?: SsoMainPosition | null
    internal_metrics?: SsoInternalMetrics | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    clerk_code?: string | null
    chinese_name?: string | null
    main_position?: SsoMainPosition | null
    internal_metrics?: SsoInternalMetrics | null
  }
}

declare module 'dify-client'
declare module 'uuid'
