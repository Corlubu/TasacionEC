import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "~/components/DashboardLayout";
import { useAuthStore } from "~/stores/auth-store";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Home,
  MapPin,
  Calendar,
  FileText,
  Sparkles,
  DollarSign,
  TrendingUp,
  Building2,
  Loader2,
  Edit,
  Save,
  X,
  Download,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  const [isEditing, setIsEditing] = useState(false);

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
        setIsEditing(false);
      },
      onError: (error: any) => {
        toast.error(error.message || "Error al actualizar la propiedad");
      },
    }),
  );

  const generatePDFMutation = useMutation(
    trpc.generatePDF.mutationOptions({
      onSuccess: (data) => {
        toast.success("¡PDF generado exitosamente!");
        // Open PDF in new tab
        window.open(data.pdfUrl, "_blank");
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

    generateReportMutation.mutate({
      token: token!,
      propertyId: property.id,
    });
  };

  const handleUpdateProperty = (data: any) => {
    if (!property) return;

    updatePropertyMutation.mutate({
      token: token!,
      propertyId: property.id,
      ...data,
    });
  };

  const handleDownloadPDF = () => {
    if (!report) return;

    toast.loading("Generando PDF profesional...", { duration: 2000 });

    generatePDFMutation.mutate({
      token: token!,
      reportId: report.id,
    });
  };

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
            </div>
            <div className="flex items-center space-x-3">
              {property.status === "DRAFT" && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 rounded-lg border-2 border-blue-600 bg-white px-5 py-3 font-semibold text-blue-600 transition-all hover:bg-blue-50"
                >
                  <Edit className="h-5 w-5" />
                  <span>Editar</span>
                </button>
              )}
              {!report && !isEditing && (
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
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("details")}
              className={`border-b-2 px-1 pb-4 font-semibold transition-colors ${
                activeTab === "details"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Detalles de Propiedad
            </button>
            <button
              onClick={() => setActiveTab("photos")}
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
                onClick={() => setActiveTab("report")}
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
        {isEditing ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Editar Propiedad
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <PropertyForm
              initialValues={Object.fromEntries(
                Object.entries(property).map(([key, value]) => {
                  // 1. Limpiamos los null de la base de datos
                  if (value === null) return [key, undefined];

                  // 2. Recortamos las fechas para que el <input type="date"> no colapse
                  if (
                    (key === "inspectionDate" || key === "requiredDate") &&
                    value
                  ) {
                    const dateString =
                      typeof value === "string"
                        ? value
                        : (value as Date).toISOString();
                    return [key, dateString.split("T")[0]];
                  }

                  return [key, value];
                }),
              )}
              onSubmit={handleUpdateProperty}
              onCancel={() => setIsEditing(false)}
              isSubmitting={updatePropertyMutation.isPending}
              submitLabel="Guardar Cambios"
            />
          </div>
        ) : activeTab === "details" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Property Image */}
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

              {/* Basic Information */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
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
                    <p className="font-semibold text-gray-900">
                      {property.status}
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

              {/* Construction Details */}
              {(property.roofMaterial ||
                property.wallMaterial ||
                property.floorMaterial ||
                property.conservationState) && (
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">
                    Detalles de Construcción
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {property.roofMaterial && (
                      <div>
                        <p className="text-sm text-gray-600">
                          Material del Techo
                        </p>
                        <p className="font-semibold text-gray-900">
                          {property.roofMaterial}
                        </p>
                      </div>
                    )}
                    {property.wallMaterial && (
                      <div>
                        <p className="text-sm text-gray-600">
                          Material de Paredes
                        </p>
                        <p className="font-semibold text-gray-900">
                          {property.wallMaterial}
                        </p>
                      </div>
                    )}
                    {property.floorMaterial && (
                      <div>
                        <p className="text-sm text-gray-600">
                          Material del Piso
                        </p>
                        <p className="font-semibold text-gray-900">
                          {property.floorMaterial}
                        </p>
                      </div>
                    )}
                    {property.conservationState && (
                      <div>
                        <p className="text-sm text-gray-600">
                          Estado de Conservación
                        </p>
                        <p className="font-semibold text-gray-900">
                          {property.conservationState}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Characteristics */}
              {(property.frontageWidth ||
                property.topography ||
                property.occupancyStatus ||
                property.zoning ||
                property.parking ||
                (property.amenities && property.amenities.length > 0)) && (
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">
                    Características Adicionales
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {property.frontageWidth && (
                      <div>
                        <p className="text-sm text-gray-600">Ancho de Frente</p>
                        <p className="font-semibold text-gray-900">
                          {property.frontageWidth} m
                        </p>
                      </div>
                    )}
                    {property.topography && (
                      <div>
                        <p className="text-sm text-gray-600">Topografía</p>
                        <p className="font-semibold text-gray-900">
                          {property.topography}
                        </p>
                      </div>
                    )}
                    {property.occupancyStatus && (
                      <div>
                        <p className="text-sm text-gray-600">
                          Estado de Ocupación
                        </p>
                        <p className="font-semibold text-gray-900">
                          {property.occupancyStatus}
                        </p>
                      </div>
                    )}
                    {property.zoning && (
                      <div>
                        <p className="text-sm text-gray-600">Zonificación</p>
                        <p className="font-semibold text-gray-900">
                          {property.zoning}
                        </p>
                      </div>
                    )}
                    {property.parking && (
                      <div>
                        <p className="text-sm text-gray-600">
                          Estacionamientos
                        </p>
                        <p className="font-semibold text-gray-900">
                          {property.parking}
                        </p>
                      </div>
                    )}
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="col-span-2">
                        <p className="mb-2 text-sm text-gray-600">Amenidades</p>
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.map((amenity) => (
                            <span
                              key={amenity}
                              className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
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
              {/* Quick Stats */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
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

              {/* CTA Card */}
              {!report && (
                <div className="rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 p-6 text-white">
                  <Sparkles className="mb-3 h-10 w-10 opacity-80" />
                  <h3 className="mb-2 text-lg font-bold">
                    Genera tu Reporte de Valoración
                  </h3>
                  <p className="mb-4 text-sm text-purple-100">
                    Utiliza IA avanzada para crear un reporte profesional en
                    minutos
                  </p>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generateReportMutation.isPending}
                    className="w-full rounded-lg bg-white py-2 font-semibold text-purple-600 transition-colors hover:bg-purple-50 disabled:opacity-50"
                  >
                    {generateReportMutation.isPending
                      ? "Generando..."
                      : "Generar Ahora"}
                  </button>
                </div>
              )}
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
            {/* Report Header */}
            <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
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
                  <button
                    onClick={handleDownloadPDF}
                    disabled={generatePDFMutation.isPending}
                    className="flex transform items-center space-x-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 transition-all hover:scale-105 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generatePDFMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        <span>Descargar PDF</span>
                      </>
                    )}
                  </button>
                  <FileText className="h-16 w-16 opacity-20" />
                </div>
              </div>
            </div>

            {/* Valuation Summary */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-2 flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-700">
                    Valor de Mercado
                  </h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${report.marketValue?.toLocaleString("es-EC")}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Método de Homologación
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-2 flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-700">
                    Valor de Costo
                  </h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${report.costValue?.toLocaleString("es-EC")}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Método de Reemplazo
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-2 flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-700">Valor Final</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${report.finalValue?.toLocaleString("es-EC")}
                </p>
                <p className="mt-1 text-sm text-gray-600">Valor Avaluado</p>
              </div>
            </div>

            {/* Report Sections */}
            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="mb-6 text-xl font-bold text-gray-900">
                Descripción del Entorno
              </h3>
              <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                {report.environmentDescription}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="mb-6 text-xl font-bold text-gray-900">
                Descripción Técnica
              </h3>
              <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                {report.technicalDescription}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="mb-6 text-xl font-bold text-gray-900">
                Justificación del Valor
              </h3>
              <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                {report.valueJustification}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <h3 className="mb-6 text-xl font-bold text-gray-900">
                Desglose de Costos
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span className="text-gray-700">Valor del Terreno</span>
                  <span className="font-semibold text-gray-900">
                    ${report.landValue?.toLocaleString("es-EC")}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span className="text-gray-700">Costo de Construcción</span>
                  <span className="font-semibold text-gray-900">
                    ${report.constructionCost?.toLocaleString("es-EC")}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span className="text-gray-700">
                    Depreciación ({report.depreciationMethod})
                  </span>
                  <span className="font-semibold text-red-600">
                    -${report.depreciationAmount?.toLocaleString("es-EC")}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${report.costValue?.toLocaleString("es-EC")}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Hash */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Hash de Documento (Auditoría)
              </h3>
              <p className="break-all font-mono text-xs text-gray-600">
                {report.documentHash}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
