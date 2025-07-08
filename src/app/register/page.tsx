
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page redirects to the /login page, where the authentication form
// (which includes a registration flip-card) is displayed.
// A client-side redirect is used here to improve development server stability,
// avoiding HMR issues sometimes seen with server-side redirects in minimal page files.
export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
}
