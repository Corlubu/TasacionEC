import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "~/components/DashboardLayout";
import { useAuthStore } from "~/stores/auth-store";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import {
  Inbox,
  FileSearch,
  MapPin,
  Loader2,
  ArrowRight,
  UserCircle,
} from "lucide-react";
import { useEffect } from "react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/reviews")({
  component: ReviewsInboxPage,
});

function ReviewsInboxPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuthStore();
  const trpc = useTRPC();

  // Protección de Ruta Doble
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
      return;
    }
    if (user?.role !== "ADMIN" && user?.role !== "SUPERVISOR") {
      toast.error("Acceso denegado. Área exclusiva de revisión.");
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, user, navigate]);

  const pendingQuery = useQuery(
    trpc.getPendingReviews.queryOptions({ token: token! }),
  );

  const formatCurrency = (val: number | null | undefined) => {
    if (!val) return "$0";
    return `$${Math.round(val).toLocaleString("es-EC")}`;
  };

  if (pendingQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  const reports = pendingQuery.data || [];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Cabecera */}
        <div className="mb-8">
          <h1 className="flex items-center text-3xl font-bold text-gray-900">
            <Inbox className="mr-3 h-8 w-8 text-blue-600" />
            Bandeja de Revisión
          </h1>
          <p className="mt-2 text-gray-600">
            Avalúos enviados por los peritos que requieren tu revisión y
            aprobación técnica.
          </p>
        </div>

        {/* Lista de Reportes Pendientes */}
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-24">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              ¡Bandeja al día!
            </h3>
            <p className="mt-1 text-gray-500">
              No hay avalúos pendientes de revisión en este momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md md:flex-row md:items-center"
              >
                {/* Info del Reporte */}
                <div className="p-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="inline-flex items-center rounded-md bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      Pendiente
                    </span>
                    <span>•</span>
                    <span>
                      Enviado el{" "}
                      {new Date(report.updatedAt).toLocaleDateString("es-EC")}
                    </span>
                  </div>

                  <h3 className="mt-2 text-xl font-bold text-gray-900">
                    {report.property.address}
                  </h3>

                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-4 w-4" />
                      {report.property.city}
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-900">
                        Valor Propuesto: {formatCurrency(report.finalValue)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-2">
                    <UserCircle className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Perito: {report.user.name} ({report.user.email})
                    </span>
                  </div>
                </div>

                {/* Botón de Acción */}
                <div className="border-t border-gray-100 bg-gray-50 p-6 md:border-l md:border-t-0 md:bg-white">
                  <button
                    onClick={() =>
                      navigate({ to: `/properties/${report.propertyId}` })
                    }
                    className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700 md:w-auto"
                  >
                    <FileSearch className="h-5 w-5" />
                    <span>Revisar Avalúo</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
