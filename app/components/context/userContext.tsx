"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  orders?: string[];
  active: boolean;
};

type UserContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void; // add this

  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter()

  // Load token from storage on app mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setTokenState(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Whenever token changes, fetch the current user
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
        setUser(null);
        setTokenState(null);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  // Update token + sync to storage
  const setToken = (token: string | null) => {
    setTokenState(token);
    if (token) {
      localStorage.setItem("token", token);
      setLoading(true); // trigger refetch of user
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  // Logout clears everything
  const logout = () => {
    setToken(null);
    setUser(null);
    router.push("/")
  };

  return (
    <UserContext.Provider value={{ user, token, loading, setToken, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
