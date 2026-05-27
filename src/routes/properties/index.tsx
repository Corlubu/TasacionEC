import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "~/components/DashboardLayout";
import { useAuthStore } from "~/stores/auth-store";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { Home, MapPin, Calendar, Image, Map, Upload } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/properties/")({
  component: PropertiesPage,
});

function PropertiesPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const trpc = useTRPC();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const propertiesQuery = useQuery(
    trpc.getProperties.queryOptions({
      token: token!,
      limit: 50,
      offset: 0,
    })
  );

  const properties = propertiesQuery.data?.properties || [];

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      HOUSE: "Casa",
      APARTMENT: "Apartamento",
      COMMERCIAL: "Comercial",
      LAND: "Terreno",
      INDUSTRIAL: "Industrial",
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-700",
      IN_PROGRESS: "bg-yellow-100 text-yellow-700",
      PENDING_REVIEW: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-green-100 text-green-700",
      ARCHIVED: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "Borrador",
      IN_PROGRESS: "En Progreso",
      PENDING_REVIEW: "Pendiente Revisión",
      COMPLETED: "Completada",
      ARCHIVED: "Archivada",
    };
    return labels[status] || status;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mis Propiedades
            </h1>
            <p className="text-gray-600">
              Gestiona todas tus propiedades registradas
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate({ to: "/properties/import/" })}
              className="flex items-center space-x-2 bg-white border-2 border-green-600 text-green-600 px-5 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all"
            >
              <Upload className="w-5 h-5" />
              <span>Importar</span>
            </button>
            <button
              onClick={() => navigate({ to: "/geospatial" })}
              className="flex items-center space-x-2 bg-white border-2 border-blue-600 text-blue-600 px-5 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all"
            >
              <Map className="w-5 h-5" />
              <span>Búsqueda Geoespacial</span>
            </button>
            <button
              onClick={() => navigate({ to: "/capture" })}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
            >
              Nueva Propiedad
            </button>
          </div>
        </div>

        {/* Properties Grid */}
        {propertiesQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="bg-gray-200 h-40 rounded-lg mb-4" />
                <div className="bg-gray-200 h-6 rounded mb-2" />
                <div className="bg-gray-200 h-4 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <Home className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay propiedades registradas
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza registrando tu primera propiedad
            </p>
            <button
              onClick={() => navigate({ to: "/capture" })}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Registrar Propiedad
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                onClick={() => navigate({ to: `/properties/${property.id}` })}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              >
                {/* Property Image Placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Home className="w-16 h-16 text-white opacity-50" />
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        property.status
                      )}`}
                    >
                      {getStatusLabel(property.status)}
                    </span>
                  </div>
                  {property._count.photos > 0 && (
                    <div className="absolute bottom-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-xs flex items-center space-x-1">
                      <Image className="w-3 h-3" />
                      <span>{property._count.photos}</span>
                    </div>
                  )}
                </div>

                {/* Property Info */}
                <div className="p-5">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-blue-600 uppercase">
                      {getPropertyTypeLabel(property.type)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {property.address}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>
                      {property.city}, {property.state}
                    </span>
                  </div>

                  {/* Property Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {property.builtArea && (
                      <div>
                        <p className="text-xs text-gray-500">Área Construida</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {property.builtArea} m²
                        </p>
                      </div>
                    )}
                    {property.bedrooms && (
                      <div>
                        <p className="text-xs text-gray-500">Dormitorios</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {property.bedrooms}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>
                      {new Date(property.createdAt).toLocaleDateString("es-EC")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
