import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({ user: null, logout: async () => {}, replayOnboarding: () => {} });

// `user` comes from App (the persisted login). Supabase's own session is only
// used as a fallback so screens never end up with a null user while logged in.
export const AuthProvider = ({ user: appUser, onLogout, onReplayOnboarding, children }) => {
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setSessionUser(data?.user ?? null))
      .catch(() => setSessionUser(null));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  const user = appUser?.id ? appUser : sessionUser;
  const logout = onLogout || (async () => {});
  const replayOnboarding = onReplayOnboarding || (() => {});

  return <AuthContext.Provider value={{ user, logout, replayOnboarding }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
