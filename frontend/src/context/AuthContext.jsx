import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authEndpoints, setAuthToken } from "../api/axios.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "pulseboard_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Keep axios' default Authorization header in sync with the token.
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  // If a request anywhere in the app comes back 401, immediately clear the
  // in-memory session too (not just localStorage) so the UI reacts right away.
  useEffect(() => {
    function handleUnauthorized() {
      setToken(null);
      setUser(null);
    }
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  // On mount (or token change), resolve who the current user is.
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await authEndpoints.me();
        if (!cancelled) setUser(res.data);
      } catch {
        if (!cancelled) {
          setToken(null);
          setUser(null);
          localStorage.removeItem(TOKEN_KEY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const persistSession = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setAuthToken(data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await authEndpoints.login({ email, password });
      persistSession(res.data);
      return res.data.user;
    },
    [persistSession]
  );

  const signup = useCallback(
    async (name, email, password, role) => {
      const res = await authEndpoints.signup({ name, email, password, role });
      persistSession(res.data);
      return res.data.user;
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    try {
      await authEndpoints.logout();
    } catch {
      // Ignore network errors on logout -- we clear local state regardless.
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = {
    token,
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
