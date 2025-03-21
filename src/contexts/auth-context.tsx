
import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
}

interface UserAccount {
  id: string;
  email: string;
  password: string;
  name?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isLoading: false,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

// Helper to initialize the database with admin account if needed
const initUserDatabase = (): UserAccount[] => {
  const existingUsers = localStorage.getItem("userAccounts");
  if (existingUsers) {
    return JSON.parse(existingUsers);
  }
  
  // Create admin account if no users exist
  const adminAccount: UserAccount = {
    id: "admin-" + Math.random().toString(36).substr(2, 9),
    email: "admin@betclever.de",
    password: "Ver4Wittert!Ver4Wittert!",
    isAdmin: true
  };
  
  localStorage.setItem("userAccounts", JSON.stringify([adminAccount]));
  return [adminAccount];
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the user database
    initUserDatabase();
    
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API request
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Get users from localStorage
      const users: UserAccount[] = JSON.parse(localStorage.getItem("userAccounts") || "[]");
      
      // Find user with matching email and password
      const foundUser = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      
      if (foundUser) {
        // Remove password before storing in session
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem("user", JSON.stringify(userWithoutPassword));
      } else {
        throw new Error("Ungültige Anmeldedaten");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API request
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Get existing users
      const users: UserAccount[] = JSON.parse(localStorage.getItem("userAccounts") || "[]");
      
      // Check if user with this email already exists
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Ein Benutzer mit dieser E-Mail existiert bereits");
      }
      
      if (email && password) {
        // Create new user
        const newUser: UserAccount = {
          id: "user-" + Math.random().toString(36).substr(2, 9),
          email,
          password
        };
        
        // Add to users array and save to localStorage
        users.push(newUser);
        localStorage.setItem("userAccounts", JSON.stringify(users));
        
        // Log user in by setting the current user (without password)
        const { password: _, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword);
        localStorage.setItem("user", JSON.stringify(userWithoutPassword));
      } else {
        throw new Error("Bitte fülle alle Felder aus");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
