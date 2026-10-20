import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth.api";
import { connectSocket, disconnectSocket } from "../api/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // checking the cookie on first load
  const [socket, setSocket] = useState(null);

  // On page load: am I already logged in?
  useEffect(() => {
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Open the real-time connection only while logged in
  const userId = user?._id;
  useEffect(() => {
    if (!userId) return;
    const s = connectSocket();
    s.on("connect_error", (err) => {
      if (err.message === "unauthorized") setUser(null);
    });
    setSocket(s);
    return () => {
      disconnectSocket();
      setSocket(null);
    };
  }, [userId]);

  const login = useCallback(async (loginValue, password) => {
    const { user } = await authApi.login(loginValue, password);
    setUser(user);
  }, []);

  const register = useCallback(async (data) => {
    const { user } = await authApi.register(data);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
  }, []);

  // e.g. after editing your profile
  const updateUser = useCallback((patch) => setUser((u) => (u ? { ...u, ...patch } : u)), []);

  const value = useMemo(
    () => ({ user, loading, socket, login, register, logout, updateUser }),
    [user, loading, socket, login, register, logout, updateUser]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
