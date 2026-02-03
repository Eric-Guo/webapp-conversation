import type { DefaultSession } from 'next-auth'

interface SsoMainPosition {
  id?: string | number
  name?: string
  functional_category?: string | null
}

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      main_position?: SsoMainPosition | null
    }
  }

  interface User {
    main_position?: SsoMainPosition | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    main_position?: SsoMainPosition | null
  }
}

declare module 'dify-client'
declare module 'uuid'
