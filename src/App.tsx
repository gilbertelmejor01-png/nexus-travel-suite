import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/ai-interaction" element={<Layout><AIInteraction /></Layout>} />
          <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
          <Route path="/comparisons" element={<Layout><Comparisons /></Layout>} />
          <Route path="/manual-creation" element={<Layout><ManualCreation /></Layout>} />
          <Route path="/history" element={<Layout><History /></Layout>} />
          <Route path="/preview" element={<Layout><Preview /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
