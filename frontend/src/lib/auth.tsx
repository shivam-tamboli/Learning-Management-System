"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student";
  approved: boolean;
}

interface AuthContextType {
  user: User | null;
  validated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [validated, setValidated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const validateSession = async () => {
    try {
      const response = await authService.validateSession();
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setValidated(true);
    }
  };

  useEffect(() => {
    validateSession().finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await authService.login(email, password);
    const { user: newUser } = response.data;
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    const refreshToken = document.cookie.match(/refreshToken=([^;]+)/)?.[1] || "";
    await authService.logout(refreshToken);
    setUser(null);
    setValidated(false);
    setIsLoading(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        validated,
        isLoading,
        isAdmin: user?.role === "admin",
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
