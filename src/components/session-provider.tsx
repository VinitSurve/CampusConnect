'use client'

// This component is no longer used for the photo gallery.
// It is kept in case other authentication providers are added later.
import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

interface NextAuthProviderProps {
    children: ReactNode;
}

export function NextAuthProvider({ children }: NextAuthProviderProps) {
    return <SessionProvider>{children}</SessionProvider>
}
