import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "~/components/DashboardLayout";
import { useAuthStore } from "~/stores/auth-store";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  FileText,
  Camera,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  MapPin,
  DollarSign,
} from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const trpc = useTRPC();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const statsQuery = useQuery(
    trpc.getPropertyStats.queryOptions({
      token: token!,
    })
  );

  const stats = statsQuery.data;

  const statCards = [
    {
      title: "Total Propiedades",
      value: stats?.totalProperties || 0,
      icon: Home,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "En Progreso",
      value: stats?.inProgress || 0,
      icon: Clock,
      color: "from-yellow-500 to-orange-600",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    {
      title: "Completadas",
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Reportes Aprobados",
      value: stats?.totalReports || 0,
      icon: FileText,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
  ];

  const quickActions = [
    {
      title: "Nueva Captura",
      description: "Registrar una nueva propiedad",
      icon: Camera,
      color: "from-blue-600 to-blue-700",
      href: "/capture",
    },
    {
      title: "Ver Propiedades",
      description: "Gestionar propiedades existentes",
      icon: Home,
      color: "from-purple-600 to-purple-700",
      href: "/properties",
    },
    {
      title: "Generar Reporte",
      description: "Crear reporte de valoración",
      icon: FileText,
      color: "from-green-600 to-green-700",
      href: "/reports",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Bienvenido a tu panel de control de valoración inmobiliaria
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {statsQuery.isLoading ? "..." : stat.value}
              </h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Acciones Rápidas
              </h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => navigate({ to: action.href })}
                    className={`w-full bg-gradient-to-r ${action.color} text-white p-4 rounded-lg hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between group`}
                  >
                    <div className="flex items-center space-x-3">
                      <action.icon className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-semibold text-sm">{action.title}</p>
                        <p className="text-xs opacity-90">{action.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Properties */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Propiedades Recientes
                </h2>
                <button
                  onClick={() => navigate({ to: "/properties" })}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Ver todas
                </button>
              </div>

              {statsQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-gray-100 h-20 rounded-lg"
                    />
                  ))}
                </div>
              ) : stats?.recentProperties && stats.recentProperties.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentProperties.map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate({ to: `/properties/${property.id}` })
                      }
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Home className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {property.address}
                          </h3>
                          <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{property.city}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Camera className="w-4 h-4" />
                              <span>{property._count.photos} fotos</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            property.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : property.status === "IN_PROGRESS"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {property.status === "COMPLETED"
                            ? "Completada"
                            : property.status === "IN_PROGRESS"
                            ? "En Progreso"
                            : "Borrador"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    No tienes propiedades registradas aún
                  </p>
                  <button
                    onClick={() => navigate({ to: "/capture" })}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Registrar Primera Propiedad
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Sistema de Valoración Automatizada
              </h3>
              <p className="text-blue-100">
                Utiliza IA avanzada para generar reportes de valoración
                profesionales en minutos
              </p>
            </div>
            <DollarSign className="w-16 h-16 opacity-20" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
