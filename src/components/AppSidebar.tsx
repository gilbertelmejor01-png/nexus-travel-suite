import { useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { 
  Home, 
  Bot, 
  BarChart3, 
  TrendingUp, 
  Plane, 
  History, 
  User, 
  Eye, 
  LogOut,
  ChevronLeft,
  ChevronRight 
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const navigationItems = [
  { title: "Resumen Ejecutivo", url: "/dashboard", icon: Home },
  { title: "Procesar  con AI", url: "/ai-interaction", icon: Bot },
  { title: "Dashboard Analítico", url: "/analytics", icon: BarChart3 },
  { title: "Comparaciones Avanzadas", url: "/comparisons", icon: TrendingUp },
  { title: "cliente", url: "/cliente", icon: User },
  { title: "Creación intinerario", url: "/manual-creation", icon: Plane },
  { title: "Historial Unificado", url: "/history", icon: History },
  { title: "Previsualización", url: "/preview", icon: Eye },
  { title: "Perfil", url: "/perfil", icon: User },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { toast } = useToast();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-sm" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive"
      });
    }
  };

  return (
    <Sidebar
      className={`transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}
      collapsible="icon"
    >
      {/* Header with logo and toggle */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-flowmatic rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">✈️</span>
              </div>
              <div>
                <h2 className="font-semibold text-sidebar-foreground">Flowmatic</h2>
                <p className="text-xs text-sidebar-foreground/70">Travel Manager</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-2 text-sidebar-foreground/70 font-medium">
              Menú Principal
            </SidebarGroupLabel>
          )}
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavCls({ isActive })}`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout section */}
        <div className="mt-auto pt-4 border-t border-sidebar-border">
          <SidebarMenuButton 
            onClick={handleLogout}
            className={`h-10 w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground text-destructive ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Cerrar sesión</span>}
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}