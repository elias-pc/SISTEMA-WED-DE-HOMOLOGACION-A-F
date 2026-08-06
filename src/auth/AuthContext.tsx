import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuthUser } from '../../types';
import { authenticate, getAuthUsers } from '../../services/auth';

const STORAGE_KEY = 'af-auth-user-v1';

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as AuthUser;
    const currentUser = getAuthUsers().find((item) => item.email === parsed.email);
    if (!currentUser) return null;
    const { password: _password, ...user } = currentUser;
    return user;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const login = (email: string, password: string) => {
    const authenticatedUser = authenticate(email, password);
    if (!authenticatedUser) return false;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    return true;
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  return context;
}
