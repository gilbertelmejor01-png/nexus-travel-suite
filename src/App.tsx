import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { Layout } from "@/components/Layout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AIInteraction from "./pages/AIInteraction";
import Analytics from "./pages/Analytics";
import Comparisons from "./pages/Comparisons";
import ManualCreation from "./pages/ManualCreation";
import History from "./pages/History";
import Preview from "./pages/Preview";
import NotFound from "./pages/NotFound";
import Perfil from "./pages/Perfil";
import Client from "./pages/Client";

// Context
import { AuthContext } from "@/context/AuthContext";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [user, loading] = useAuthState(auth);
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Auth Provider Component
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          // Create user document if it doesn't exist
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0],
            photoURL: user.photoURL || '',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
          });
        } else {
          // Update last login
          await setDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp(),
          }, { merge: true });
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/ai-interaction" element={
              <ProtectedRoute>
                <Layout><AIInteraction /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Layout><Analytics /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/comparisons" element={
              <ProtectedRoute>
                <Layout><Comparisons /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/manual-creation" element={
              <ProtectedRoute>
                <Layout><ManualCreation /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/history" element={
              <ProtectedRoute>
                <Layout><History /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/preview" element={
              <ProtectedRoute>
                <Layout><Preview /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/perfil" element={
              <ProtectedRoute>
                <Layout><Perfil /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/cliente" element={
              <ProtectedRoute>
                <Layout><Client /></Layout>
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
