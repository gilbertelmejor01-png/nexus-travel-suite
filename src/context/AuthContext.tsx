import { createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // This is just the type definition, the implementation is in App.tsx
  return null as any;
};

// This is a workaround to make TypeScript happy with the AuthProvider component
declare module 'react' {
  interface JSX {
    AuthProvider: React.FC<{ children: ReactNode }>;
  }
}
