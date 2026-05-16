'use client';

import { useEffect } from 'react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    authApi.me()
      .then((res: any) => setUser(res.data.user))
      .catch(() => setUser(null));
  }, [setUser]);

  return <>{children}</>;
}
