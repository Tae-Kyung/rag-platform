'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AuthState {
  loggedIn: boolean;
  isAdmin: boolean;
}

export default function AuthNav({
  loginLabel = 'Log in',
  signupLabel = 'Get Started Free',
}: {
  loginLabel?: string;
  signupLabel?: string;
}) {
  const [auth, setAuth] = useState<AuthState | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setAuth({ loggedIn: false, isAdmin: false });
        return;
      }

      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data: profile }) => {
          setAuth({ loggedIn: true, isAdmin: profile?.role === 'admin' });
        });
    });
  }, []);

  // Not loaded yet — render placeholder to avoid layout shift
  if (auth === null) {
    return <div className="w-24" />;
  }

  if (auth.loggedIn) {
    return (
      <>
        {auth.isAdmin && (
          <Link href="/admin" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            Admin
          </Link>
        )}
        <Link href="/dashboard" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Dashboard
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
        {loginLabel}
      </Link>
      <Link href="/signup" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        {signupLabel}
      </Link>
    </>
  );
}
