import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "~/components/DashboardLayout";
import { useAuthStore } from "~/stores/auth-store";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  TrendingDown,
  Building2,
  Home,
  Loader2,
  Plus,
  ArrowRight,
  Calendar,
  Hammer,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/costs/")({
  component: CostsPage,
});

function CostsPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const trpc = useTRPC();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    }
  }, [navigate, isAuthenticated]);

  const propertiesQuery = useQuery(
    trpc.getProperties.queryOptions({
      token: token!,
      limit: 100,
      offset: 0,
    })
  );

  const properties = propertiesQuery.data?.properties || [];

  // Calculate total costs across all properties
  const totalStats = properties.reduce(
    (acc, property) => {
      const additionalWorks = property.additionalWorks || [];
      const totalReplacement = additionalWorks.reduce((sum, work) => sum + work.replacementCost, 0);
      const totalDepreciated = additionalWorks.reduce((sum, work) => sum + work.depreciatedValue, 0);
      const totalDepreciation = totalReplacement - totalDepreciated;

      return {
        totalReplacementCost: acc.totalReplacementCost + totalReplacement,
        totalDepreciatedValue: acc.totalDepreciatedValue + totalDepreciated,
        totalDepreciation: acc.totalDepreciation + totalDepreciation,
        totalWorks: acc.totalWorks + additionalWorks.length,
      };
    },
    {
      totalReplacementCost: 0,
      totalDepreciatedValue: 0,
      totalDepreciation: 0,
      totalWorks: 0,
    }
  );

  // Filter properties that have additional works
  const propertiesWithWorks = properties.filter(
    (p) => p.additionalWorks && p.additionalWorks.length > 0
  );

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      POOL: "Piscina",
      PERGOLA: "Pérgola",
      DOMOTICS: "Domótica",
      FENCE: "Cerca",
      GARDEN: "Jardín",
      GARAGE: "Garaje",
      OTHER: "Otro",
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    // All categories use the same Hammer icon for simplicity
    return Hammer;
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
            Gestión de Costos
          </h1>
          <p className="text-gray-600">
            Administra los costos de construcción y obras adicionales de tus propiedades
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-50">
                <Hammer className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {propertiesQuery.isLoading ? "..." : totalStats.totalWorks}
            </h3>
            <p className="text-sm text-gray-600">Obras Adicionales</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-50">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {propertiesQuery.isLoading
                ? "..."
                : `$${Math.round(totalStats.totalReplacementCost).toLocaleString("es-EC")}`}
            </h3>
            <p className="text-sm text-gray-600">Costo de Reposición</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-50">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {propertiesQuery.isLoading
                ? "..."
                : `$${Math.round(totalStats.totalDepreciatedValue).toLocaleString("es-EC")}`}
            </h3>
            <p className="text-sm text-gray-600">Valor Depreciado</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-red-50">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {propertiesQuery.isLoading
                ? "..."
                : `$${Math.round(totalStats.totalDepreciation).toLocaleString("es-EC")}`}
            </h3>
            <p className="text-sm text-gray-600">Depreciación Total</p>
          </div>
        </div>

        {/* Properties with Additional Works */}
        {propertiesQuery.isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="bg-gray-200 h-6 rounded mb-4 w-1/3" />
                <div className="space-y-3">
                  <div className="bg-gray-200 h-20 rounded" />
                  <div className="bg-gray-200 h-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : propertiesWithWorks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <Hammer className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay obras adicionales registradas
            </h3>
            <p className="text-gray-600 mb-6">
              Las obras adicionales como piscinas, pérgolas o garajes se pueden agregar desde el detalle de cada propiedad
            </p>
            <button
              onClick={() => navigate({ to: "/properties" })}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Ver Propiedades
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {propertiesWithWorks.map((property) => {
              const additionalWorks = property.additionalWorks || [];
              const propertyTotalReplacement = additionalWorks.reduce(
                (sum, work) => sum + work.replacementCost,
                0
              );
              const propertyTotalDepreciated = additionalWorks.reduce(
                (sum, work) => sum + work.depreciatedValue,
                0
              );

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Property Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Home className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">
                            {property.address}
                          </h3>
                          <p className="text-blue-100">
                            {property.city}, {property.state}
                          </p>
                          <div className="flex items-center space-x-4 mt-3 text-sm">
                            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                              {additionalWorks.length} obra{additionalWorks.length !== 1 ? "s" : ""}
                            </span>
                            <span>
                              Total: ${Math.round(propertyTotalDepreciated).toLocaleString("es-EC")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate({ to: `/properties/${property.id}` })}
                        className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                      >
                        <span>Ver Propiedad</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Additional Works List */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {additionalWorks.map((work) => {
                        const CategoryIcon = getCategoryIcon(work.category);
                        const depreciationPercent = work.depreciationPercent || 0;

                        return (
                          <div
                            key={work.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4 flex-1">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <CategoryIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h4 className="font-semibold text-gray-900">
                                      {work.name}
                                    </h4>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                      {getCategoryLabel(work.category)}
                                    </span>
                                  </div>
                                  {work.description && (
                                    <p className="text-sm text-gray-600 mb-3">
                                      {work.description}
                                    </p>
                                  )}
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div>
                                      <p className="text-xs text-gray-500">Costo Reposición</p>
                                      <p className="text-sm font-semibold text-gray-900">
                                        ${Math.round(work.replacementCost).toLocaleString("es-EC")}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Valor Depreciado</p>
                                      <p className="text-sm font-semibold text-green-600">
                                        ${Math.round(work.depreciatedValue).toLocaleString("es-EC")}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Depreciación</p>
                                      <p className="text-sm font-semibold text-red-600">
                                        {depreciationPercent.toFixed(1)}%
                                      </p>
                                    </div>
                                    {work.area && (
                                      <div>
                                        <p className="text-xs text-gray-500">Área</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                          {work.area} m²
                                        </p>
                                      </div>
                                    )}
                                    {work.conservationState && (
                                      <div>
                                        <p className="text-xs text-gray-500">Estado</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                          {getConservationStateLabel(work.conservationState)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  {work.yearBuilt && (
                                    <div className="flex items-center text-xs text-gray-500 mt-2">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      <span>Construido en {work.yearBuilt}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Property Summary */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">
                            Costo Total de Reposición
                          </p>
                          <p className="text-xl font-bold text-gray-900">
                            ${Math.round(propertyTotalReplacement).toLocaleString("es-EC")}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">
                            Valor Total Depreciado
                          </p>
                          <p className="text-xl font-bold text-green-600">
                            ${Math.round(propertyTotalDepreciated).toLocaleString("es-EC")}
                          </p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-1">
                            Depreciación Total
                          </p>
                          <p className="text-xl font-bold text-red-600">
                            ${Math.round(propertyTotalReplacement - propertyTotalDepreciated).toLocaleString("es-EC")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Cómo agregar obras adicionales?
              </h3>
              <p className="text-gray-700 mb-4">
                Las obras adicionales como piscinas, pérgolas, garajes, o sistemas domóticos se agregan
                desde el detalle de cada propiedad. Estas obras se deprecian individualmente según su
                año de construcción y estado de conservación.
              </p>
              <button
                onClick={() => navigate({ to: "/properties" })}
                className="flex items-center space-x-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                <span>Ir a Propiedades</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
