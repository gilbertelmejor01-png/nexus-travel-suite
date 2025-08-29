import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LanguageSelector from './components/LanguageSelector'; // Importa el selector de idioma

// Import your pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AIInteraction from './pages/AIInteraction';
import Analytics from './pages/Analytics';
import Comparisons from './pages/Comparisons';
import ManualCreation from './pages/ManualCreation';
import History from './pages/History';
import Preview from './pages/Preview';
import Perfil from './pages/Perfil';
import Client from './pages/Client';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

const App = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {/* Selector de idioma global */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/dashboard" replace />} />
        
        {/* Redirect root to login or dashboard based on auth status */}
        <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/ai-interaction" element={<ProtectedRoute><Layout><AIInteraction /></Layout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
        <Route path="/comparisons" element={<ProtectedRoute><Layout><Comparisons /></Layout></ProtectedRoute>} />
        <Route path="/manual-creation" element={<ProtectedRoute><Layout><ManualCreation /></Layout></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />
        <Route path="/preview" element={<ProtectedRoute><Layout><Preview /></Layout></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Layout><Perfil /></Layout></ProtectedRoute>} />
        <Route path="/cliente" element={<ProtectedRoute><Layout><Client /></Layout></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Layout><div>Admin Panel</div></Layout></ProtectedRoute>} />

        {/* Error pages */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </TooltipProvider>
  );
};

export default App;