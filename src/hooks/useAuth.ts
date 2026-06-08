import { useState } from 'react';
import { AccessCode } from '../types';

const CODES_KEY = 'spincut_access_codes';
const ADMIN_SESSION_KEY = 'spincut_admin_session';
const CLIENT_SESSION_KEY = 'spincut_client_session';
const ADMIN_PASSWORD = '22102000';

const DEFAULT_CODES: AccessCode[] = [
  { id: 'default-test', code: 'TEST', active: true, createdAt: '2024-01-01', clientName: 'Démo SPINCUT', isTest: true },
]

export function getAccessCodes(): AccessCode[] {
  try {
    const s = localStorage.getItem(CODES_KEY);
    const stored = s ? (JSON.parse(s) as AccessCode[]) : []
    // Toujours inclure le code TEST par défaut s'il n'est pas déjà présent
    const hasTest = stored.some(c => c.code === 'TEST')
    return hasTest ? stored : [...DEFAULT_CODES, ...stored]
  } catch { return DEFAULT_CODES; }
}

export function saveAccessCodes(codes: AccessCode[]): void {
  localStorage.setItem(CODES_KEY, JSON.stringify(codes));
}

export function isTestMode(): boolean {
  const code = getClientCode()
  if (!code) return false
  return getAccessCodes().find(c => c.code === code)?.isTest === true
}

export function getClientCode(): string | null {
  const val = localStorage.getItem(CLIENT_SESSION_KEY);
  return val && val !== 'true' ? val : null;
}

export function useClientAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem(CLIENT_SESSION_KEY)
  );

  const login = (code: string): boolean => {
    const normalized = code.trim().toUpperCase();
    const valid = getAccessCodes().some(c => c.code === normalized && c.active);
    if (valid) { localStorage.setItem(CLIENT_SESSION_KEY, normalized); setIsAuthenticated(true); }
    return valid;
  };

  const logout = () => { localStorage.removeItem(CLIENT_SESSION_KEY); setIsAuthenticated(false); };
  return { isAuthenticated, login, logout };
}

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(
    () => localStorage.getItem(ADMIN_SESSION_KEY) === 'true'
  );

  const adminLogin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const adminLogout = () => { localStorage.removeItem(ADMIN_SESSION_KEY); setIsAdmin(false); };
  return { isAdmin, adminLogin, adminLogout };
}
