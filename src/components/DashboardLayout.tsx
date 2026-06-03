import { Link, useLocation } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/auth-store";
import {
  Building2,
  LayoutDashboard,
  Home,
  Camera,
  FileText,
  Map,
  DollarSign,
  BarChart3,
  LogOut,
  Menu,
  X,
  Upload,
  Users, // 👈 Importamos el nuevo ícono para el panel de usuarios
} from "lucide-react";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 1. Definimos la navegación base (lo que todos ven)
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Propiedades", href: "/properties", icon: Home },
    { name: "Nueva Captura", href: "/capture", icon: Camera },
    { name: "Importar Propiedades", href: "/properties/import/", icon: Upload },
    { name: "Reportes", href: "/reports", icon: FileText },
    { name: "Análisis Geoespacial", href: "/geospatial", icon: Map },
    { name: "Costos", href: "/costs", icon: DollarSign },
    { name: "Comparables", href: "/comparables", icon: BarChart3 },
  ];

  // 2. Inyectamos la pestaña de Administración SOLO si el usuario es ADMIN
  const navigation =
    user?.role === "ADMIN"
      ? [
          ...baseNavigation,
          { name: "Gestión de Equipo", href: "/admin/users", icon: Users },
        ]
      : baseNavigation;

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">TasaciónEC</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors ${
                  isActive
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-gray-200 p-4">
          <div className="mb-3 flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 font-semibold text-white">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user?.name}
              </p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
              {/* Etiqueta visual para que el usuario recuerde su rol */}
              <p className="mt-0.5 text-xs font-semibold text-blue-600">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center space-x-2 rounded-lg px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                TasaciónEC
              </span>
            </div>
            <div className="w-6" />
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
