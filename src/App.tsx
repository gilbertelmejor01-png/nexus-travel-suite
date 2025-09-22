import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LanguageSelector from "./components/LanguageSelector"; // Importa el selector de idioma
import { TrialNotification } from "@/components/TrialNotification";

// Import your pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AIInteraction from "./pages/AIInteraction";
import Analytics from "./pages/Analytics";
import Comparisons from "./pages/Comparisons";
import ManualCreation from "./pages/ManualCreation";
import History from "./pages/History";
import Preview from "./pages/Preview";
import Perfil from "./pages/Perfil";
import Client from "./pages/Client";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Appa from "./pages/Payment";

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

      {/* Notificación de Trial Global */}
      {currentUser && <TrialNotification />}

      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            !currentUser ? <Login /> : <Navigate to="/dashboard" replace />
          }
        />
        <Route
          path="/register"
          element={
            !currentUser ? <Register /> : <Navigate to="/dashboard" replace />
          }
        />

        {/* Redirect root to login or dashboard based on auth status */}
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai-interaction" element={<AIInteraction />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/comparisons" element={<Comparisons />} />
          <Route path="/manual-creation" element={<ManualCreation />} />
          <Route path="/history" element={<History />} />
          <Route path="/preview" element={<Preview />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/cliente" element={<Client />} />
          <Route path="/appa" element={<Appa />} />
        </Route>

        {/* Admin routes - example with role-based protection */}
        <Route
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<div>Admin Panel</div>} />
        </Route>

        {/* Error pages */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </TooltipProvider>
  );
};

export default App;
