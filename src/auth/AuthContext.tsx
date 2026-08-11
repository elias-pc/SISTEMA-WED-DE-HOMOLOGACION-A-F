import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthUser } from '../../types';
import { ApiError, api } from '../../services/api';

interface LoginResult { ok: boolean; error?: string }
interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.session()
      .then(({ user: next }) => { if (active) setUser(next); })
      .catch((error) => { if (!(error instanceof ApiError && error.status === 401)) console.error(error); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (email, password) => {
      try {
        const result = await api.login(email, password);
        setUser(result.user);
        return { ok: true };
      } catch (error) {
        if (error instanceof ApiError) return { ok: false, error: error.message };
        return { ok: false, error: 'No se pudo conectar con la API. Verifica que el servidor y PostgreSQL estén activos.' };
      }
    },
    logout: async () => {
      try { await api.logout(); } finally { setUser(null); }
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  return context;
}
