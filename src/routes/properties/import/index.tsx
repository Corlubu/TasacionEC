import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "~/components/DashboardLayout";
import { useAuthStore } from "~/stores/auth-store";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/properties/import/")({
  component: ImportPropertiesPage,
});

interface ImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: { index: number; error: string; address: string }[];
}

function ImportPropertiesPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const trpc = useTRPC();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    }
  }, [navigate, isAuthenticated]);

  const importMutation = useMutation(
    trpc.importProperties.mutationOptions({
      onSuccess: (result) => {
        setImportResult(result);
        toast.success(`Importación completada: ${result.created} creadas, ${result.updated} actualizadas`);
      },
      onError: (error: any) => {
        toast.error(error.message || "Error al importar propiedades");
      },
    })
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData(null);
      setImportResult(null);
    }
  };

  const parseFile = async () => {
    if (!file) return;

    try {
      const text = await file.text();
      let data: any[];

      if (file.name.endsWith(".json")) {
        data = JSON.parse(text);
      } else if (file.name.endsWith(".csv")) {
        // Simple CSV parser
        const lines = text.split("\n").filter((line) => line.trim());
        const headers = lines[0].split(",").map((h) => h.trim());
        
        data = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const obj: any = {};
          
          headers.forEach((header, index) => {
            const value = values[index];
            
            // Convert numeric fields
            if (["latitude", "longitude", "landArea", "builtArea", "bedrooms", "bathrooms", "floors", "yearBuilt", "frontageWidth", "parking", "existingPropertyId"].includes(header)) {
              obj[header] = value ? parseFloat(value) : undefined;
            } else {
              obj[header] = value || undefined;
            }
          });
          
          return obj;
        });
      } else {
        toast.error("Formato de archivo no soportado. Use JSON o CSV");
        return;
      }

      setParsedData(data);
      toast.success(`${data.length} propiedades encontradas en el archivo`);
    } catch (error: any) {
      toast.error("Error al parsear el archivo: " + error.message);
    }
  };

  const handleImport = () => {
    if (!parsedData) return;

    importMutation.mutate({
      token: token!,
      properties: parsedData,
    });
  };

  const downloadTemplate = () => {
    const template = [
      {
        address: "Av. Amazonas N24-03",
        city: "Quito",
        state: "Pichincha",
        zipCode: "170150",
        type: "HOUSE",
        latitude: -0.1807,
        longitude: -78.4678,
        landArea: 250,
        builtArea: 180,
        bedrooms: 3,
        bathrooms: 2.5,
        floors: 2,
        yearBuilt: 2015,
        roofMaterial: "Hormigón",
        wallMaterial: "Ladrillo",
        floorMaterial: "Cerámica",
        conservationState: "GOOD",
        frontageWidth: 12.5,
        topography: "FLAT",
        occupancyStatus: "OCCUPIED",
        zoning: "RESIDENTIAL",
        parking: 2,
        amenities: ["pool", "garden", "security"],
        // existingPropertyId: 123, // Optional: include this to update an existing property
      },
    ];

    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-propiedades.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSVTemplate = () => {
    const csv = `address,city,state,zipCode,type,latitude,longitude,landArea,builtArea,bedrooms,bathrooms,floors,yearBuilt,roofMaterial,wallMaterial,floorMaterial,conservationState,frontageWidth,topography,occupancyStatus,zoning,parking
Av. Amazonas N24-03,Quito,Pichincha,170150,HOUSE,-0.1807,-78.4678,250,180,3,2.5,2,2015,Hormigón,Ladrillo,Cerámica,GOOD,12.5,FLAT,OCCUPIED,RESIDENTIAL,2`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-propiedades.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Importar Propiedades
          </h1>
          <p className="text-gray-600">
            Carga múltiples propiedades desde un archivo CSV o JSON
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Instrucciones
              </h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3 mt-0.5">
                    1
                  </span>
                  <span>Descarga la plantilla en formato JSON o CSV</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3 mt-0.5">
                    2
                  </span>
                  <span>Completa los datos de tus propiedades</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3 mt-0.5">
                    3
                  </span>
                  <span>Sube el archivo y verifica los datos</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3 mt-0.5">
                    4
                  </span>
                  <span>Confirma la importación</span>
                </li>
              </ol>

              <div className="mt-6 space-y-2">
                <button
                  onClick={downloadTemplate}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Plantilla JSON</span>
                </button>
                <button
                  onClick={downloadCSVTemplate}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Plantilla CSV</span>
                </button>
              </div>
            </div>

            {/* Required Fields */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-sm font-bold text-blue-900 mb-3">
                Campos Requeridos
              </h3>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• address (texto)</li>
                <li>• city (texto)</li>
                <li>• state (texto)</li>
                <li>• type (HOUSE, APARTMENT, COMMERCIAL, LAND, INDUSTRIAL)</li>
                <li>• latitude (número)</li>
                <li>• longitude (número)</li>
              </ul>

              <h3 className="text-sm font-bold text-blue-900 mt-4 mb-3">
                Campos Opcionales
              </h3>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• zipCode, landArea, builtArea</li>
                <li>• bedrooms, bathrooms, floors</li>
                <li>• yearBuilt, roofMaterial, wallMaterial</li>
                <li>• floorMaterial, conservationState</li>
                <li>• frontageWidth, topography, occupancyStatus</li>
                <li>• zoning, parking, amenities</li>
                <li>• existingPropertyId (para actualizar)</li>
              </ul>
            </div>
          </div>

          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Subir Archivo
              </h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Seleccionar archivo
                </label>
                <p className="text-sm text-gray-600 mt-2">
                  Formatos soportados: JSON, CSV
                </p>
                {file && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
              </div>

              {file && !parsedData && (
                <button
                  onClick={parseFile}
                  className="mt-4 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Analizar Archivo
                </button>
              )}
            </div>

            {/* Preview */}
            {parsedData && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Vista Previa ({parsedData.length} propiedades)
                  </h3>
                  <button
                    onClick={handleImport}
                    disabled={importMutation.isPending}
                    className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {importMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Importando...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Importar Propiedades</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          #
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Dirección
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Ciudad
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Tipo
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                          Área (m²)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedData.map((property, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                          <td className="px-3 py-2 text-gray-900">
                            {property.address}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {property.city}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {property.type}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {property.builtArea || property.landArea || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Results */}
            {importResult && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Resultados de Importación
                </h3>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-900">
                      {importResult.created}
                    </p>
                    <p className="text-sm text-green-700">Creadas</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900">
                      {importResult.updated}
                    </p>
                    <p className="text-sm text-blue-700">Actualizadas</p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-900">
                      {importResult.failed}
                    </p>
                    <p className="text-sm text-red-700">Fallidas</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Errores:
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {importResult.errors.map((error, index) => (
                        <div
                          key={index}
                          className="bg-red-50 border border-red-200 rounded-lg p-3"
                        >
                          <p className="text-sm font-semibold text-red-900">
                            Fila {error.index + 1}: {error.address}
                          </p>
                          <p className="text-xs text-red-700 mt-1">
                            {error.error}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => navigate({ to: "/properties" })}
                  className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Ver Propiedades Importadas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
