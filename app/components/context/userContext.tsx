"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Matches your backend User model (but no passwordHash!)
export type User = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  orders?: string[]; // order IDs if you want to keep them cached
  active: boolean;
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  setSyncUser: (user: User | null) => void; // updates context + localStorage
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);

  // Load from localStorage when app mounts
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUserState(JSON.parse(stored));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Update context state only
  const setUser = (user: User | null) => {
    setUserState(user);
  };

  // Update context + sync with localStorage
  const setSyncUser = (user: User | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  };

  // Clear user everywhere
  const logout = () => {
    localStorage.removeItem("user");
    setUserState(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, setSyncUser, logout }}>
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
