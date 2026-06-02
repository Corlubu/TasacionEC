import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "~/components/DashboardLayout";
import { useAuthStore } from "~/stores/auth-store";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Home,
  MapPin,
  FileText,
  Sparkles,
  Loader2,
  Edit,
  X,
  Download,
  CheckCircle,
  Eye,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { PhotoGallery } from "~/components/PhotoGallery";
import { PropertyForm } from "~/components/PropertyForm";

export const Route = createFileRoute("/properties/$propertyId/")({
  component: PropertyDetailPage,
});

function PropertyDetailPage() {
  const { propertyId } = Route.useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const trpc = useTRPC();
  const [activeTab, setActiveTab] = useState<"details" | "photos" | "report">(
    "details",
  );
  const [showForm, setShowForm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const propertyQuery = useQuery(
    trpc.getProperty.queryOptions({
      token: token!,
      propertyId: parseInt(propertyId),
    }),
  );

  const generateReportMutation = useMutation(
    trpc.generateReport.mutationOptions({
      onSuccess: () => {
        toast.success("¡Reporte generado exitosamente!");
        propertyQuery.refetch();
        setActiveTab("report");
      },
      onError: (error: any) => {
        toast.error(error.message || "Error al generar el reporte");
      },
    }),
  );

  const updatePropertyMutation = useMutation(
    trpc.updateProperty.mutationOptions({
      onSuccess: () => {
        toast.success("Propiedad actualizada exitosamente");
        propertyQuery.refetch();
        setShowForm(false);
      },
      onError: (error: any) => {
        toast.error(error.message || "Error al actualizar la propiedad");
      },
    }),
  );

  const generatePDFMutation = useMutation(
    trpc.generatePDF.mutationOptions({
      onSuccess: async (data) => {
        const toastId = toast.loading("Descargando archivo a su equipo...");

        try {
          const response = await fetch(data.pdfUrl);
          const blob = await response.blob();
          const localUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = localUrl;
          const propertyName =
            property?.address?.substring(0, 15).replace(/\s+/g, "_") ||
            "Propiedad";
          link.download = `Avaluo_${propertyName}_${new Date().getTime()}.pdf`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(localUrl);

          toast.success("¡Descarga completada con éxito!", { id: toastId });
        } catch (error) {
          window.open(data.pdfUrl, "_blank");
          toast.success("¡PDF generado! (Se abrió en una pestaña nueva)", {
            id: toastId,
          });
        }

        propertyQuery.refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Error al generar el PDF");
      },
    }),
  );

  const property = propertyQuery.data;
  const report = property?.valuationReports?.[0];

  const handleGenerateReport = () => {
    if (!property) return;
    toast.loading("Generando reporte con IA...", { duration: 2000 });
    generateReportMutation.mutate({ token: token!, propertyId: property.id });
  };

  const handleUpdateProperty = (data: any) => {
    if (!property) return;
    updatePropertyMutation.mutate({
      token: token!,
      propertyId: property.id,
      ...data,
    });
  };

  const handleCompleteProperty = () => {
    if (!property) return;
    if (
      window.confirm(
        "¿Estás seguro de marcar este avalúo como FINALIZADO? Ya no podrás editar los datos ni regenerar el reporte.",
      )
    ) {
      updatePropertyMutation.mutate({
        token: token!,
        propertyId: property.id,
        status: "COMPLETED",
      });
    }
  };

  const handleDownloadPDF = () => {
    if (!report) return;

    if (report.pdfUrl) {
      const triggerDownload = async () => {
        setIsDownloading(true);
        const toastId = toast.loading("Descargando archivo a su equipo...");
        try {
          const response = await fetch(report.pdfUrl!);
          const blob = await response.blob();
          const localUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = localUrl;
          const propertyName =
            property?.address?.substring(0, 15).replace(/\s+/g, "_") ||
            "Propiedad";
          link.download = `Avaluo_${propertyName}_${new Date().getTime()}.pdf`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(localUrl);
          toast.success("¡Descarga completada con éxito!", { id: toastId });
        } catch (error) {
          window.open(report.pdfUrl!, "_blank");
          toast.success("¡PDF descargado! (Se abrió en una pestaña nueva)", {
            id: toastId,
          });
        } finally {
          setIsDownloading(false);
        }
      };
      triggerDownload();
      return;
    }

    toast.loading("Generando PDF profesional...", { duration: 2000 });
    generatePDFMutation.mutate({ token: token!, reportId: report.id });
  };

  const initialFormValues = useMemo(() => {
    if (!property) return undefined;

    const baseValues = Object.fromEntries(
      Object.entries(property).map(([key, value]) => {
        if (value === null) return [key, undefined];
        if (key === "inspectionDate" && value) {
          const dateString =
            typeof value === "string" ? value : (value as Date).toISOString();
          return [key, dateString.split("T")[0]];
        }
        return [key, value];
      }),
    );

    const requestValues = property.valuationRequest
      ? Object.fromEntries(
          Object.entries(property.valuationRequest).map(([key, value]) => {
            if (value === null) return [key, undefined];
            if (key === "requiredDate" && value) {
              const dateString =
                typeof value === "string"
                  ? value
                  : (value as Date).toISOString();
              return [key, dateString.split("T")[0]];
            }
            return [key, value];
          }),
        )
      : {};

    return {
      ...baseValues,
      ...requestValues,
    };
  }, [property]);

  if (propertyQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!property) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center lg:p-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Propiedad no encontrada
          </h1>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate({ to: "/properties" })}
            className="mb-4 inline-flex items-center font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Volver a Propiedades
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                {property.address}
              </h1>
              <div className="flex items-center text-gray-600">
                <MapPin className="mr-2 h-5 w-5" />
                <span>
                  {property.city}, {property.state}
                </span>
              </div>
              {property.status === "COMPLETED" && (
                <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                  Avalúo Finalizado
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {!showForm && (
                <button
                  onClick={() => {
                    // 🚨 MAGIA: Aseguramos que siempre abra en Detalles de Propiedad
                    setActiveTab("details");
                    setShowForm(true);
                  }}
                  className={`flex items-center space-x-2 rounded-lg border-2 px-5 py-3 font-semibold transition-all ${
                    property.status === "DRAFT"
                      ? "border-blue-600 bg-white text-blue-600 hover:bg-blue-50"
                      : "border-gray-600 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {property.status === "DRAFT" ? (
                    <>
                      <Edit className="h-5 w-5" />
                      <span>Editar Propiedad</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-5 w-5" />
                      <span>Ver Datos</span>
                    </>
                  )}
                </button>
              )}

              {!report && property.status === "DRAFT" && !showForm && (
                <button
                  onClick={handleGenerateReport}
                  disabled={generateReportMutation.isPending}
                  className="flex transform items-center space-x-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:from-purple-700 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generateReportMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Generar Reporte con IA</span>
                    </>
                  )}
                </button>
              )}

              {property.status === "DRAFT" && report && !showForm && (
                <button
                  onClick={handleCompleteProperty}
                  disabled={updatePropertyMutation.isPending}
                  className="flex items-center space-x-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatePropertyMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  <span>Finalizar Avalúo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 🚨 MAGIA: Reparación de pestañas principales */}
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => {
                setActiveTab("details");
                setShowForm(false); // Apagamos el formulario
              }}
              className={`border-b-2 px-1 pb-4 font-semibold transition-colors ${
                activeTab === "details"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Detalles de Propiedad
            </button>
            <button
              onClick={() => {
                setActiveTab("photos");
                setShowForm(false); // Apagamos el formulario
              }}
              className={`flex items-center space-x-2 border-b-2 px-1 pb-4 font-semibold transition-colors ${
                activeTab === "photos"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Fotos ({property.photos.length})</span>
            </button>
            {report && (
              <button
                onClick={() => {
                  setActiveTab("report");
                  setShowForm(false); // Apagamos el formulario
                }}
                className={`flex items-center space-x-2 border-b-2 px-1 pb-4 font-semibold transition-colors ${
                  activeTab === "report"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Reporte de Valoración</span>
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        {showForm ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {property.status === "COMPLETED"
                  ? "Datos de la Propiedad (Solo Lectura)"
                  : "Editar Propiedad"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <PropertyForm
              initialValues={initialFormValues}
              onSubmit={handleUpdateProperty}
              onCancel={() => setShowForm(false)}
              isSubmitting={updatePropertyMutation.isPending}
              submitLabel="Guardar Cambios"
              readOnly={property.status === "COMPLETED"}
            />
          </div>
        ) : activeTab === "details" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <div className="space-y-6 lg:col-span-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex h-64 items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                  {property.photos.length > 0 ? (
                    <img
                      src={property.photos[0].url}
                      alt={property.address}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Home className="h-24 w-24 text-white opacity-50" />
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Información Básica
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tipo</p>
                    <p className="font-semibold text-gray-900">
                      {property.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <p
                      className={`font-semibold ${property.status === "COMPLETED" ? "text-green-600" : "text-amber-600"}`}
                    >
                      {property.status === "COMPLETED"
                        ? "Finalizado"
                        : "Borrador"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Área del Terreno</p>
                    <p className="font-semibold text-gray-900">
                      {property.landArea ? `${property.landArea} m²` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Área Construida</p>
                    <p className="font-semibold text-gray-900">
                      {property.builtArea ? `${property.builtArea} m²` : "N/A"}
                    </p>
                  </div>
                  {property.bedrooms && (
                    <div>
                      <p className="text-sm text-gray-600">Dormitorios</p>
                      <p className="font-semibold text-gray-900">
                        {property.bedrooms}
                      </p>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div>
                      <p className="text-sm text-gray-600">Baños</p>
                      <p className="font-semibold text-gray-900">
                        {property.bathrooms}
                      </p>
                    </div>
                  )}
                  {property.yearBuilt && (
                    <div>
                      <p className="text-sm text-gray-600">
                        Año de Construcción
                      </p>
                      <p className="font-semibold text-gray-900">
                        {property.yearBuilt}
                      </p>
                    </div>
                  )}
                  {property.floors && (
                    <div>
                      <p className="text-sm text-gray-600">Pisos</p>
                      <p className="font-semibold text-gray-900">
                        {property.floors}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Ubicación
                </h2>
                <div className="space-y-2">
                  <p className="text-gray-700">{property.address}</p>
                  <p className="text-gray-700">
                    {property.city}, {property.state}
                  </p>
                  {property.zipCode && (
                    <p className="text-gray-700">CP: {property.zipCode}</p>
                  )}
                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <p className="text-sm text-gray-600">Coordenadas GPS</p>
                    <p className="font-mono text-sm text-gray-900">
                      {property.latitude.toFixed(6)},{" "}
                      {property.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-gray-900">
                  Estadísticas
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Fotos</span>
                    <span className="font-semibold text-gray-900">
                      {property.photos.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Comparables</span>
                    <span className="font-semibold text-gray-900">
                      {property.comparables.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Reportes</span>
                    <span className="font-semibold text-gray-900">
                      {property.valuationReports.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "photos" ? (
          <PhotoGallery
            propertyId={property.id}
            propertyStatus={property.status}
            onPhotosChange={() => propertyQuery.refetch()}
          />
        ) : activeTab === "report" && report ? (
          <div className="space-y-6">
            <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="mb-2 text-2xl font-bold">
                    Reporte de Valoración
                  </h2>
                  <p className="text-blue-100">
                    Generado el{" "}
                    {new Date(report.generatedAt!).toLocaleDateString("es-EC")}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  {report.pdfUrl && (
                    <button
                      onClick={() => window.open(report.pdfUrl, "_blank")}
                      className="flex items-center space-x-2 rounded-lg bg-white/20 px-6 py-3 font-semibold text-white transition-all hover:bg-white/30"
                    >
                      <Eye className="h-5 w-5" />
                      <span>Ver PDF</span>
                    </button>
                  )}

                  <button
                    onClick={handleDownloadPDF}
                    disabled={generatePDFMutation.isPending || isDownloading}
                    className="flex items-center space-x-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 transition-all hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {generatePDFMutation.isPending || isDownloading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>
                          {isDownloading ? "Descargando..." : "Generando..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        <span>
                          {report.pdfUrl ? "Descargar PDF" : "Generar PDF"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {report.pdfUrl && (
                <div className="mt-8 h-[700px] w-full overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl">
                  <iframe
                    src={`${report.pdfUrl}#toolbar=0`}
                    className="h-full w-full border-0"
                    title="Visor de Reporte PDF"
                  />
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
