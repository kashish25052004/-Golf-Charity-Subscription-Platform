import { createContext, useContext, useEffect, useState } from "react";
import api, { setAuthToken } from "../api";

const AuthContext = createContext(null);
const storageKey = "golf-charity-auth";

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : { token: "", user: null };
  });

  useEffect(() => {
    setAuthToken(auth.token);
    localStorage.setItem(storageKey, JSON.stringify(auth));
  }, [auth]);

  async function login(payload) {
    const { data } = await api.post("/auth/login", payload);
    setAuth(data);
    return data;
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    setAuth(data);
    return data;
  }

  function logout() {
    setAuth({ token: "", user: null });
  }

  return (
    <AuthContext.Provider
      value={{
        token: auth.token,
        user: auth.user,
        setUser: (user) => setAuth((current) => ({ ...current, user })),
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

