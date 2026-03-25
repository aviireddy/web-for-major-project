import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  userId: string;
  email?: string;
  token?: string;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (userId: string, email: string, token: string) => void;
  logout: () => void;
  generateUserId: () => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Generate or retrieve unique userId
  const generateUserId = (): string => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  };

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    const storedEmail = localStorage.getItem('userEmail');
    const storedToken = localStorage.getItem('userToken');

    if (storedUserId && storedToken) {
      setUser({
        userId: storedUserId,
        email: storedEmail || '',
        token: storedToken,
      });
    } else {
      // Generate userId even if not logged in (for fallback)
      generateUserId();
    }
  }, []);

  const login = (userId: string, email: string, token: string) => {
    const user = { userId, email, token };
    setUser(user);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userToken', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userEmail');
    // Keep userId for path purposes
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn: !!user?.token,
        login,
        logout,
        generateUserId,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
