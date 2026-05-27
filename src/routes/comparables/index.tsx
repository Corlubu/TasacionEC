import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "~/components/DashboardLayout";
import { useAuthStore } from "~/stores/auth-store";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  MapPin,
  Navigation,
  Search,
  Home,
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader2,
  ArrowRight,
  DollarSign,
  Ruler,
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

export const Route = createFileRoute("/comparables")({
  component: ComparablesPage,
  validateSearch: zodValidator(searchParamsSchema),
});

interface SearchForm {
  latitude: string;
  longitude: string;
  radiusKm: number;
}

function ComparablesPage() {
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

  // Calculate market statistics
  const marketStats = properties.length > 0 ? {
    avgPrice: properties.reduce((sum, p) => sum + (p.builtArea ? (p.builtArea * 800) : 0), 0) / properties.length,
    minPrice: Math.min(...properties.map(p => p.builtArea ? (p.builtArea * 800) : 0)),
    maxPrice: Math.max(...properties.map(p => p.builtArea ? (p.builtArea * 800) : 0)),
    avgPricePerM2: properties.reduce((sum, p) => sum + (p.builtArea ? 800 : 0), 0) / properties.length,
    avgArea: properties.reduce((sum, p) => sum + (p.builtArea || 0), 0) / properties.length,
    avgAge: properties.filter(p => p.yearBuilt).reduce((sum, p) => sum + (new Date().getFullYear() - (p.yearBuilt || 0)), 0) / properties.filter(p => p.yearBuilt).length,
  } : null;

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
          to: "/comparables",
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
      to: "/comparables",
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

  const getConservationStateLabel = (state: string | null) => {
    if (!state) return "N/A";
    const labels: Record<string, string> = {
      EXCELLENT: "Excelente",
      GOOD: "Bueno",
      REGULAR: "Regular",
      POOR: "Malo",
      VERY_POOR: "Muy Malo",
    };
    return labels[state] || state;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Análisis de Comparables
          </h1>
          <p className="text-gray-600">
            Encuentra y analiza propiedades comparables para valoración de mercado
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Búsqueda de Propiedades Comparables</p>
                <p className="text-blue-700">
                  Encuentra propiedades similares en el área para realizar análisis de mercado comparativo.
                  Los comparables son esenciales para determinar el valor de mercado mediante el método de homologación.
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
                Radios Recomendados
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 3, 5, 10].map((radius) => (
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
                <span>Buscar Comparables</span>
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

        {/* Market Statistics */}
        {searchLocation && marketStats && properties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-50">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                ${Math.round(marketStats.avgPrice).toLocaleString("es-EC")}
              </h3>
              <p className="text-sm text-gray-600">Precio Promedio</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-50">
                  <Ruler className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                ${Math.round(marketStats.avgPricePerM2).toLocaleString("es-EC")}
              </h3>
              <p className="text-sm text-gray-600">Precio por m²</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-50">
                  <Home className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {Math.round(marketStats.avgArea)} m²
              </h3>
              <p className="text-sm text-gray-600">Área Promedio</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-orange-50">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {Math.round(marketStats.avgAge)} años
              </h3>
              <p className="text-sm text-gray-600">Edad Promedio</p>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchLocation && (
          <div>
            {/* Results Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Propiedades Comparables
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
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white rounded-xl border border-gray-200 p-6"
                  >
                    <div className="bg-gray-200 h-6 rounded mb-3 w-2/3" />
                    <div className="bg-gray-200 h-4 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              /* Empty State */
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                <BarChart3 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No se encontraron comparables
                </h3>
                <p className="text-gray-600 mb-6">
                  No hay propiedades registradas en un radio de {searchParams.radius || 5} km de esta ubicación.
                  <br />
                  Intenta aumentar el radio de búsqueda o buscar en otra ubicación.
                </p>
              </div>
            ) : (
              /* Results List */
              <div className="space-y-4">
                {properties.map((property, index) => {
                  const estimatedPrice = (property.builtArea || 0) * 800;
                  const pricePerM2 = property.builtArea ? estimatedPrice / property.builtArea : 0;
                  const age = property.yearBuilt ? new Date().getFullYear() - property.yearBuilt : null;

                  return (
                    <div
                      key={property.id}
                      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-lg">#{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">
                                {property.address}
                              </h3>
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                {getPropertyTypeLabel(property.type)}
                              </span>
                              <span className="flex items-center text-sm text-green-600 font-semibold">
                                <MapPin className="w-4 h-4 mr-1" />
                                {property.distanceKm.toFixed(2)} km
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                              {property.city}, {property.state}
                            </p>

                            {/* Property Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-500">Precio Estimado</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  ${Math.round(estimatedPrice).toLocaleString("es-EC")}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Precio por m²</p>
                                <p className="text-sm font-semibold text-blue-600">
                                  ${Math.round(pricePerM2).toLocaleString("es-EC")}
                                </p>
                              </div>
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
                              {age !== null && (
                                <div>
                                  <p className="text-xs text-gray-500">Edad</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {age} años
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Additional Info */}
                            {(property.bathrooms || property.conservationState) && (
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                {property.bathrooms && (
                                  <span>Baños: {property.bathrooms}</span>
                                )}
                                {property.conservationState && (
                                  <span>Estado: {getConservationStateLabel(property.conservationState)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => navigate({ to: `/properties/${property.id}` })}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                        >
                          <span>Ver Detalles</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Initial State - No search yet */}
        {!searchLocation && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Busca propiedades comparables
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Ingresa las coordenadas de una propiedad para encontrar comparables cercanos.
                El análisis de comparables es fundamental para determinar el valor de mercado.
              </p>
              
              {/* Benefits */}
              <div className="max-w-2xl mx-auto">
                <p className="text-sm font-semibold text-gray-700 mb-3">¿Por qué usar comparables?</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <TrendingUp className="w-6 h-6 text-blue-600 mb-2" />
                    <p className="text-sm font-semibold text-gray-900 mb-1">Valor de Mercado</p>
                    <p className="text-xs text-gray-600">
                      Determina el valor real basado en transacciones similares
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <BarChart3 className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-sm font-semibold text-gray-900 mb-1">Análisis Objetivo</p>
                    <p className="text-xs text-gray-600">
                      Datos reales del mercado para valoraciones precisas
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <DollarSign className="w-6 h-6 text-purple-600 mb-2" />
                    <p className="text-sm font-semibold text-gray-900 mb-1">Ajustes Justificados</p>
                    <p className="text-xs text-gray-600">
                      Fundamenta ajustes por ubicación, tamaño y calidad
                    </p>
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
