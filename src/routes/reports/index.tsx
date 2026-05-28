import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "~/components/DashboardLayout";
import { useAuthStore } from "~/stores/auth-store";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Calendar,
  DollarSign,
  Home,
  Loader2,
  Filter,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/reports/")({
  component: ReportsPage,
});

function ReportsPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const trpc = useTRPC();
  const [statusFilter, setStatusFilter] = useState<"GENERATING" | "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | undefined>(undefined);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    }
  }, [navigate, isAuthenticated]);

  const reportsQuery = useQuery(
    trpc.getReports.queryOptions({
      token: token!,
      status: statusFilter,
      limit: 50,
      offset: 0,
    })
  );

  const reports = reportsQuery.data?.reports || [];
  const total = reportsQuery.data?.total || 0;

  // Calculate stats
  const stats = {
    total: reports.length,
    draft: reports.filter(r => r.status === "DRAFT").length,
    pendingApproval: reports.filter(r => r.status === "PENDING_APPROVAL").length,
    approved: reports.filter(r => r.status === "APPROVED").length,
    rejected: reports.filter(r => r.status === "REJECTED").length,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      GENERATING: "bg-blue-100 text-blue-700",
      DRAFT: "bg-gray-100 text-gray-700",
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      GENERATING: "Generando",
      DRAFT: "Borrador",
      PENDING_APPROVAL: "Pendiente",
      APPROVED: "Aprobado",
      REJECTED: "Rechazado",
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "GENERATING":
        return Loader2;
      case "DRAFT":
        return FileText;
      case "PENDING_APPROVAL":
        return Clock;
      case "APPROVED":
        return CheckCircle;
      case "REJECTED":
        return XCircle;
      default:
        return FileText;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reportes de Valoración
          </h1>
          <p className="text-gray-600">
            Gestiona todos tus reportes de avalúo generados
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            <p className="text-sm text-gray-600">Total Reportes</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.draft}</h3>
            <p className="text-sm text-gray-600">Borradores</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.pendingApproval}</h3>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.approved}</h3>
            <p className="text-sm text-gray-600">Aprobados</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.rejected}</h3>
            <p className="text-sm text-gray-600">Rechazados</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Filtrar por estado:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter(undefined)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === undefined
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter("DRAFT")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === "DRAFT"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Borradores
              </button>
              <button
                onClick={() => setStatusFilter("PENDING_APPROVAL")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === "PENDING_APPROVAL"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setStatusFilter("APPROVED")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === "APPROVED"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Aprobados
              </button>
              <button
                onClick={() => setStatusFilter("REJECTED")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === "REJECTED"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Rechazados
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {reportsQuery.isLoading ? (
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
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay reportes
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter
                ? `No tienes reportes con estado "${getStatusLabel(statusFilter)}"`
                : "No has generado ningún reporte de valoración aún"}
            </p>
            <button
              onClick={() => navigate({ to: "/properties" })}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Ver Propiedades
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => {
              const StatusIcon = getStatusIcon(report.status);
              return (
                <div
                  key={report.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Home className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate">
                            {report.property.address}
                          </h3>
                          <span
                            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              report.status
                            )}`}
                          >
                            <StatusIcon className={`w-3 h-3 ${report.status === "GENERATING" ? "animate-spin" : ""}`} />
                            <span>{getStatusLabel(report.status)}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {report.property.city} • {report.property.type}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Valor de Mercado</p>
                            <p className="text-sm font-semibold text-gray-900">
                              ${report.marketValue?.toLocaleString("es-EC") || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Valor de Costo</p>
                            <p className="text-sm font-semibold text-gray-900">
                              ${report.costValue?.toLocaleString("es-EC") || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Valor Final</p>
                            <p className="text-sm font-semibold text-blue-600">
                              ${report.finalValue?.toLocaleString("es-EC") || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Generado</p>
                            <p className="text-sm font-semibold text-gray-900 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {report.generatedAt
                                ? new Date(report.generatedAt).toLocaleDateString("es-EC")
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => navigate({ to: `/properties/${report.propertyId}` })}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
