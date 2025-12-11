'use client'

import type { FC, ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/app/components/base/toast'

interface ProvidersProps {
  children: ReactNode
}

const Providers: FC<ProvidersProps> = ({ children }) => {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}

export default Providers
