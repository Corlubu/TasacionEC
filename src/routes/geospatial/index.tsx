import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "~/components/DashboardLayout";
import { useAuthStore } from "~/stores/auth-store";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Navigation,
  Search,
  Home,
  Image,
  Calendar,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";

const searchParamsSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().min(0.1).max(100).default(5),
});

export const Route = createFileRoute("/geospatial/")({
  component: GeospatialPage,
  validateSearch: zodValidator(searchParamsSchema),
});

interface SearchForm {
  latitude: string;
  longitude: string;
  radiusKm: number;
}

function GeospatialPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const trpc = useTRPC();
  const searchParams = Route.useSearch();

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(
    searchParams.lat && searchParams.lng
      ? { lat: searchParams.lat, lng: searchParams.lng }
      : null
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    }
  }, [navigate, isAuthenticated]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SearchForm>({
    defaultValues: {
      latitude: searchParams.lat?.toString() || "",
      longitude: searchParams.lng?.toString() || "",
      radiusKm: searchParams.radius || 5,
    },
  });

  const searchQuery = useQuery(
    trpc.searchPropertiesNearLocation.queryOptions(
      {
        token: token!,
        latitude: searchLocation?.lat || 0,
        longitude: searchLocation?.lng || 0,
        radiusKm: searchParams.radius || 5,
        limit: 50,
        offset: 0,
      },
      {
        enabled: !!searchLocation && !!token,
      }
    )
  );

  const properties = searchQuery.data?.properties || [];

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalización no soportada por tu navegador");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setValue("latitude", lat.toString());
        setValue("longitude", lng.toString());
        setSearchLocation({ lat, lng });
        navigate({
          to: "/geospatial",
          search: { lat, lng, radius: searchParams.radius || 5 },
        });
        setIsGettingLocation(false);
        toast.success("Ubicación obtenida");
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("No se pudo obtener tu ubicación");
        setIsGettingLocation(false);
      }
    );
  };

  const onSubmit = (data: SearchForm) => {
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Coordenadas inválidas");
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error("Coordenadas fuera de rango válido");
      return;
    }

    setSearchLocation({ lat, lng });
    navigate({
      to: "/geospatial",
      search: { lat, lng, radius: data.radiusKm },
    });
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Búsqueda Geoespacial
          </h1>
          <p className="text-gray-600">
            Encuentra propiedades cercanas a una ubicación específica
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">¿Cómo funciona la búsqueda geoespacial?</p>
                <p className="text-blue-700">
                  Ingresa las coordenadas de cualquier ubicación o usa tu ubicación actual para encontrar 
                  todas las propiedades dentro del radio especificado. Ideal para análisis de mercado y 
                  búsqueda de comparables.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Latitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitud *
                </label>
                <input
                  type="text"
                  {...register("latitude", {
                    required: "La latitud es requerida",
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="-0.1807"
                />
                {errors.latitude && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.latitude.message}
                  </p>
                )}
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitud *
                </label>
                <input
                  type="text"
                  {...register("longitude", {
                    required: "La longitud es requerida",
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="-78.4678"
                />
                {errors.longitude && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.longitude.message}
                  </p>
                )}
              </div>

              {/* Radius */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Radio (km) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  {...register("radiusKm", {
                    required: "El radio es requerido",
                    valueAsNumber: true,
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                />
                {errors.radiusKm && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.radiusKm.message}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Radius Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Radios Rápidos
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 5, 10, 25, 50].map((radius) => (
                  <button
                    key={radius}
                    type="button"
                    onClick={() => setValue("radiusKm", radius)}
                    className="px-4 py-2 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {radius} km
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="submit"
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
              >
                <Search className="w-5 h-5" />
                <span>Buscar Propiedades</span>
              </button>

              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isGettingLocation}
                className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGettingLocation ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Navigation className="w-5 h-5" />
                )}
                <span>Usar Mi Ubicación</span>
              </button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {searchLocation && (
          <div>
            {/* Results Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Resultados de Búsqueda
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {searchQuery.isLoading
                      ? "Buscando..."
                      : `${properties.length} ${
                          properties.length === 1 ? "propiedad encontrada" : "propiedades encontradas"
                        } en un radio de ${searchParams.radius || 5} km`}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {searchLocation.lat.toFixed(4)}, {searchLocation.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {searchQuery.isLoading ? (
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
              /* Empty State */
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <MapPin className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No se encontraron propiedades
                </h3>
                <p className="text-gray-600 mb-6">
                  No hay propiedades registradas en un radio de {searchParams.radius || 5} km de esta ubicación.
                  <br />
                  Intenta aumentar el radio de búsqueda.
                </p>
              </div>
            ) : (
              /* Results Grid */
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
                      {/* Distance Badge */}
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{property.distanceKm.toFixed(2)} km</span>
                      </div>
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

                      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>
                            {new Date(property.createdAt).toLocaleDateString("es-EC")}
                          </span>
                        </div>
                        <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                          <span>Ver detalles</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Initial State - No search yet */}
        {!searchLocation && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Comienza tu búsqueda geoespacial
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Ingresa coordenadas o usa tu ubicación actual para encontrar propiedades cercanas. 
                Perfecto para análisis de mercado y comparables.
              </p>
              
              {/* Example Searches */}
              <div className="max-w-2xl mx-auto">
                <p className="text-sm font-semibold text-gray-700 mb-3">Ejemplos de búsqueda:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Centro de Quito</p>
                    <p className="text-xs text-gray-600">Lat: -0.1807, Lng: -78.4678</p>
                    <p className="text-xs text-gray-500 mt-2">Radio: 5 km</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Centro de Guayaquil</p>
                    <p className="text-xs text-gray-600">Lat: -2.1894, Lng: -79.8886</p>
                    <p className="text-xs text-gray-500 mt-2">Radio: 10 km</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
