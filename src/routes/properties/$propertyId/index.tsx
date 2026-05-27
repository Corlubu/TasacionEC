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
  const [activeTab, setActiveTab] = useState<"details" | "photos" | "report">("details");
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
    })
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
    })
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
    })
  );

  const generatePDFMutation = useMutation(
    trpc.generatePDF.mutationOptions({
      onSuccess: (data) => {
        toast.success("¡PDF generado exitosamente!");
        // Open PDF in new tab
        window.open(data.pdfUrl, '_blank');
        propertyQuery.refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Error al generar el PDF");
      },
    })
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
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!property) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 text-center">
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
            className="text-blue-600 hover:text-blue-700 font-semibold mb-4 inline-flex items-center"
          >
            ← Volver a Propiedades
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {property.address}
              </h1>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-2" />
                <span>
                  {property.city}, {property.state}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {property.status === "DRAFT" && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 bg-white border-2 border-blue-600 text-blue-600 px-5 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all"
                >
                  <Edit className="w-5 h-5" />
                  <span>Editar</span>
                </button>
              )}
              {!report && !isEditing && (
                <button
                  onClick={handleGenerateReport}
                  disabled={generateReportMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center space-x-2"
                >
                  {generateReportMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Generar Reporte con IA</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("details")}
              className={`pb-4 px-1 border-b-2 font-semibold transition-colors ${
                activeTab === "details"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Detalles de Propiedad
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`pb-4 px-1 border-b-2 font-semibold transition-colors flex items-center space-x-2 ${
                activeTab === "photos"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Fotos ({property.photos.length})</span>
            </button>
            {report && (
              <button
                onClick={() => setActiveTab("report")}
                className={`pb-4 px-1 border-b-2 font-semibold transition-colors flex items-center space-x-2 ${
                  activeTab === "report"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Reporte de Valoración</span>
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Editar Propiedad
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <PropertyForm
              initialValues={{
                address: property.address,
                city: property.city,
                state: property.state,
                zipCode: property.zipCode || undefined,
                type: property.type,
                landArea: property.landArea || undefined,
                builtArea: property.builtArea || undefined,
                bedrooms: property.bedrooms || undefined,
                bathrooms: property.bathrooms || undefined,
                floors: property.floors || undefined,
                yearBuilt: property.yearBuilt || undefined,
                roofMaterial: property.roofMaterial || undefined,
                wallMaterial: property.wallMaterial || undefined,
                floorMaterial: property.floorMaterial || undefined,
                conservationState: property.conservationState || undefined,
                frontageWidth: property.frontageWidth || undefined,
                topography: property.topography || undefined,
                occupancyStatus: property.occupancyStatus || undefined,
                zoning: property.zoning || undefined,
                parking: property.parking || undefined,
                amenities: property.amenities || undefined,
              }}
              onSubmit={handleUpdateProperty}
              onCancel={() => setIsEditing(false)}
              isSubmitting={updatePropertyMutation.isPending}
              submitLabel="Guardar Cambios"
            />
          </div>
        ) : activeTab === "details" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Property Image */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-64 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {property.photos.length > 0 ? (
                    <img
                      src={property.photos[0].url}
                      alt={property.address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Home className="w-24 h-24 text-white opacity-50" />
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
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
                      <p className="text-sm text-gray-600">Año de Construcción</p>
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
              {(property.roofMaterial || property.wallMaterial || property.floorMaterial || property.conservationState) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Detalles de Construcción
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {property.roofMaterial && (
                      <div>
                        <p className="text-sm text-gray-600">Material del Techo</p>
                        <p className="font-semibold text-gray-900">
                          {property.roofMaterial}
                        </p>
                      </div>
                    )}
                    {property.wallMaterial && (
                      <div>
                        <p className="text-sm text-gray-600">Material de Paredes</p>
                        <p className="font-semibold text-gray-900">
                          {property.wallMaterial}
                        </p>
                      </div>
                    )}
                    {property.floorMaterial && (
                      <div>
                        <p className="text-sm text-gray-600">Material del Piso</p>
                        <p className="font-semibold text-gray-900">
                          {property.floorMaterial}
                        </p>
                      </div>
                    )}
                    {property.conservationState && (
                      <div>
                        <p className="text-sm text-gray-600">Estado de Conservación</p>
                        <p className="font-semibold text-gray-900">
                          {property.conservationState}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Characteristics */}
              {(property.frontageWidth || property.topography || property.occupancyStatus || property.zoning || property.parking || (property.amenities && property.amenities.length > 0)) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
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
                        <p className="text-sm text-gray-600">Estado de Ocupación</p>
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
                        <p className="text-sm text-gray-600">Estacionamientos</p>
                        <p className="font-semibold text-gray-900">
                          {property.parking}
                        </p>
                      </div>
                    )}
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600 mb-2">Amenidades</p>
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.map((amenity) => (
                            <span
                              key={amenity}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
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
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
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
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Coordenadas GPS</p>
                    <p className="font-mono text-sm text-gray-900">
                      {property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
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
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                  <Sparkles className="w-10 h-10 mb-3 opacity-80" />
                  <h3 className="text-lg font-bold mb-2">
                    Genera tu Reporte de Valoración
                  </h3>
                  <p className="text-sm text-purple-100 mb-4">
                    Utiliza IA avanzada para crear un reporte profesional en minutos
                  </p>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generateReportMutation.isPending}
                    className="w-full bg-white text-purple-600 py-2 rounded-lg font-semibold hover:bg-purple-50 disabled:opacity-50 transition-colors"
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
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
                    className="flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                  >
                    {generatePDFMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        <span>Descargar PDF</span>
                      </>
                    )}
                  </button>
                  <FileText className="w-16 h-16 opacity-20" />
                </div>
              </div>
            </div>

            {/* Valuation Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-700">
                    Valor de Mercado
                  </h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${report.marketValue?.toLocaleString("es-EC")}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Método de Homologación
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-700">
                    Valor de Costo
                  </h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${report.costValue?.toLocaleString("es-EC")}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Método de Reemplazo
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-700">
                    Valor Final
                  </h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${report.finalValue?.toLocaleString("es-EC")}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Valor Avaluado
                </p>
              </div>
            </div>

            {/* Report Sections */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Descripción del Entorno
              </h3>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {report.environmentDescription}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Descripción Técnica
              </h3>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {report.technicalDescription}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Justificación del Valor
              </h3>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {report.valueJustification}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Desglose de Costos
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700">Valor del Terreno</span>
                  <span className="font-semibold text-gray-900">
                    ${report.landValue?.toLocaleString("es-EC")}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700">Costo de Construcción</span>
                  <span className="font-semibold text-gray-900">
                    ${report.constructionCost?.toLocaleString("es-EC")}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700">Depreciación ({report.depreciationMethod})</span>
                  <span className="font-semibold text-red-600">
                    -${report.depreciationAmount?.toLocaleString("es-EC")}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 bg-blue-50 px-4 rounded-lg mt-4">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-blue-600 text-xl">
                    ${report.costValue?.toLocaleString("es-EC")}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Hash */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Hash de Documento (Auditoría)
              </h3>
              <p className="font-mono text-xs text-gray-600 break-all">
                {report.documentHash}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
