// src/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setToken } from "./api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hs_token");
    if (!token) { setLoading(false); return; }
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => { setToken(null); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.login({ email, password });
    setToken(token);
    setUser(user);
    return user;
  };

  const signup = async (payload) => {
    const { token, user } = await api.signup(payload);
    setToken(token);
    setUser(user);
    return user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const { user } = await api.updateMe(payload);
    setUser(user);
    return user;
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthCtx.Provider>
  );
}
