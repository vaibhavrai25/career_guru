import { createContext, useEffect, useMemo, useState } from "react";

export const AuthContext = createContext();

const safeParseUser = (value) => {
  try {
    if (!value) return null;
    return JSON.parse(value);
  } catch (error) {
    localStorage.removeItem("user");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = safeParseUser(localStorage.getItem("user"));

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    if (!userData || !authToken) return;

    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);
    setToken(authToken);
  };

  const updateUser = (updatedUser) => {
    if (!updatedUser) return;

    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      updateUser,
      isAuthenticated: Boolean(user && token),
    }),
    [user, token, loading]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Restoring session...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};