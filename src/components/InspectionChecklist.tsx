import { useState } from "react";
import { CheckCircle, Circle, AlertCircle, AlertTriangle, XCircle } from "lucide-react";

interface PathologyItem {
  id: string;
  category: string;
  label: string;
  detected: boolean;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  notes?: string;
  required: boolean;
}

interface InspectionChecklistProps {
  propertyType: "HOUSE" | "APARTMENT" | "COMMERCIAL" | "LAND" | "INDUSTRIAL";
  initialPathologies?: PathologyItem[];
  initialConservationState?: "EXCELLENT" | "GOOD" | "REGULAR" | "POOR" | "VERY_POOR";
  onChange: (data: {
    pathologies: PathologyItem[];
    conservationState?: "EXCELLENT" | "GOOD" | "REGULAR" | "POOR" | "VERY_POOR";
  }) => void;
  readOnly?: boolean;
}

const DEFAULT_PATHOLOGIES: Omit<PathologyItem, "detected" | "notes" | "severity">[] = [
  // Structural Pathologies
  { id: "settlement", category: "Patologías Estructurales", label: "Asentamientos", required: true },
  { id: "structural-cracks", category: "Patologías Estructurales", label: "Fisuras y Grietas Estructurales", required: true },
  { id: "foundation-issues", category: "Patologías Estructurales", label: "Problemas de Cimentación", required: true },
  
  // Building Envelope
  { id: "humidity", category: "Patologías de Envolvente", label: "Humedad", required: true },
  { id: "roof-damage", category: "Patologías de Envolvente", label: "Daños en Cubierta/Techo", required: true },
  { id: "facade-deterioration", category: "Patologías de Envolvente", label: "Deterioro de Fachada", required: false },
  
  // Material Deterioration
  { id: "corrosion", category: "Deterioro de Materiales", label: "Corrosión en Elementos Metálicos", required: false },
  { id: "concrete-degradation", category: "Deterioro de Materiales", label: "Degradación del Hormigón", required: false },
  { id: "wood-rot", category: "Deterioro de Materiales", label: "Pudrición de Madera", required: false },
  
  // Installations
  { id: "electrical-issues", category: "Instalaciones", label: "Problemas Eléctricos", required: false },
  { id: "plumbing-issues", category: "Instalaciones", label: "Problemas Hidrosanitarios", required: false },
  
  // Finishes
  { id: "paint-deterioration", category: "Acabados", label: "Deterioro de Pintura", required: false },
  { id: "flooring-damage", category: "Acabados", label: "Daños en Pisos", required: false },
  { id: "carpentry-damage", category: "Acabados", label: "Daños en Carpintería", required: false },
];

export function InspectionChecklist({
  propertyType,
  initialPathologies,
  initialConservationState,
  onChange,
  readOnly = false,
}: InspectionChecklistProps) {
  const [pathologies, setPathologies] = useState<PathologyItem[]>(() => {
    if (initialPathologies && initialPathologies.length > 0) {
      return initialPathologies;
    }
    
    return DEFAULT_PATHOLOGIES.map((item) => ({
      ...item,
      detected: false,
      notes: "",
    }));
  });

  const [conservationState, setConservationState] = useState<
    "EXCELLENT" | "GOOD" | "REGULAR" | "POOR" | "VERY_POOR" | undefined
  >(initialConservationState);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const togglePathology = (id: string) => {
    if (readOnly) return;
    
    const updated = pathologies.map((item) =>
      item.id === id ? { ...item, detected: !item.detected } : item
    );
    setPathologies(updated);
    onChange({ pathologies: updated, conservationState });
  };

  const updateSeverity = (id: string, severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => {
    if (readOnly) return;
    
    const updated = pathologies.map((item) =>
      item.id === id ? { ...item, severity } : item
    );
    setPathologies(updated);
    onChange({ pathologies: updated, conservationState });
  };

  const updateNotes = (id: string, notes: string) => {
    if (readOnly) return;
    
    const updated = pathologies.map((item) =>
      item.id === id ? { ...item, notes } : item
    );
    setPathologies(updated);
    onChange({ pathologies: updated, conservationState });
  };

  const updateConservationState = (state: "EXCELLENT" | "GOOD" | "REGULAR" | "POOR" | "VERY_POOR") => {
    if (readOnly) return;
    
    setConservationState(state);
    onChange({ pathologies, conservationState: state });
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Group by category
  const categories = pathologies.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PathologyItem[]>);

  const totalItems = pathologies.length;
  const detectedPathologies = pathologies.filter((item) => item.detected).length;
  const criticalIssues = pathologies.filter(
    (item) => item.detected && item.severity === "CRITICAL"
  ).length;
  const requiredItems = pathologies.filter((item) => item.required).length;
  const inspectedRequiredItems = pathologies.filter(
    (item) => item.required && (item.detected || item.notes)
  ).length;

  const getSeverityColor = (severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => {
    switch (severity) {
      case "LOW":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "MEDIUM":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "HIGH":
        return "text-red-600 bg-red-50 border-red-200";
      case "CRITICAL":
        return "text-red-800 bg-red-100 border-red-300";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getConservationStateColor = (state?: string) => {
    switch (state) {
      case "EXCELLENT":
        return "bg-green-600";
      case "GOOD":
        return "bg-blue-600";
      case "REGULAR":
        return "bg-yellow-600";
      case "POOR":
        return "bg-orange-600";
      case "VERY_POOR":
        return "bg-red-600";
      default:
        return "bg-gray-400";
    }
  };

  const getConservationStateLabel = (state?: string) => {
    switch (state) {
      case "EXCELLENT":
        return "Excelente";
      case "GOOD":
        return "Bueno";
      case "REGULAR":
        return "Regular";
      case "POOR":
        return "Malo";
      case "VERY_POOR":
        return "Muy Malo";
      default:
        return "No evaluado";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Inspección de Patologías Constructivas
        </h3>
        <p className="text-sm text-gray-600">
          Evalúa el estado de conservación e identifica patologías estructurales
        </p>
      </div>

      {/* Conservation State Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">
          Estado General de Conservación
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {["EXCELLENT", "GOOD", "REGULAR", "POOR", "VERY_POOR"].map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => updateConservationState(state as any)}
              disabled={readOnly}
              className={`relative px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                conservationState === state
                  ? `${getConservationStateColor(state)} text-white border-transparent`
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
              } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
            >
              {getConservationStateLabel(state)}
              {conservationState === state && (
                <CheckCircle className="absolute top-2 right-2 w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Ítems Inspeccionados</p>
            <p className="text-2xl font-bold text-gray-900">
              {inspectedRequiredItems} / {requiredItems}
            </p>
            <p className="text-xs text-gray-500 mt-1">Ítems requeridos</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Patologías Detectadas</p>
            <p className="text-2xl font-bold text-orange-600">
              {detectedPathologies}
            </p>
            <p className="text-xs text-gray-500 mt-1">De {totalItems} evaluados</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Problemas Críticos</p>
            <p className="text-2xl font-bold text-red-600">
              {criticalIssues}
            </p>
            <p className="text-xs text-gray-500 mt-1">Requieren atención inmediata</p>
          </div>
        </div>
      </div>

      {/* Warning for incomplete required items */}
      {inspectedRequiredItems < requiredItems && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-900">
              Inspección incompleta
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Faltan {requiredItems - inspectedRequiredItems} ítems requeridos por evaluar
            </p>
          </div>
        </div>
      )}

      {/* Critical Issues Alert */}
      {criticalIssues > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">
              Problemas críticos detectados
            </p>
            <p className="text-sm text-red-700 mt-1">
              Se encontraron {criticalIssues} patologías críticas que requieren atención inmediata
            </p>
          </div>
        </div>
      )}

      {/* Pathologies by Category */}
      <div className="space-y-4">
        {Object.entries(categories).map(([category, items]) => (
          <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900">{category}</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <button
                      type="button"
                      onClick={() => togglePathology(item.id)}
                      disabled={readOnly}
                      className={`flex-shrink-0 mt-0.5 ${
                        readOnly ? "cursor-default" : "cursor-pointer"
                      }`}
                    >
                      {item.detected ? (
                        <XCircle className="w-6 h-6 text-red-600" />
                      ) : (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <label
                          className={`text-sm font-medium ${
                            item.detected ? "text-red-900" : "text-gray-900"
                          } ${readOnly ? "" : "cursor-pointer"}`}
                          onClick={() => !readOnly && togglePathology(item.id)}
                        >
                          {item.label}
                          {item.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                          {item.detected && (
                            <span className="ml-2 text-xs font-semibold text-red-600">
                              DETECTADA
                            </span>
                          )}
                        </label>
                      </div>

                      {/* Severity Selection (only if detected) */}
                      {item.detected && (
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Severidad
                          </label>
                          <div className="flex space-x-2">
                            {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((severity) => (
                              <button
                                key={severity}
                                type="button"
                                onClick={() => updateSeverity(item.id, severity as any)}
                                disabled={readOnly}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                                  item.severity === severity
                                    ? getSeverityColor(severity as any)
                                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                                } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                              >
                                {severity === "LOW" && "Baja"}
                                {severity === "MEDIUM" && "Media"}
                                {severity === "HIGH" && "Alta"}
                                {severity === "CRITICAL" && "Crítica"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.id)}
                        className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
                      >
                        {expandedItems.has(item.id) ? "Ocultar" : "Agregar"} observaciones
                      </button>

                      {/* Notes Textarea */}
                      {expandedItems.has(item.id) && (
                        <div className="mt-3">
                          <textarea
                            value={item.notes || ""}
                            onChange={(e) => updateNotes(item.id, e.target.value)}
                            placeholder="Describir la patología, ubicación, extensión, y recomendaciones..."
                            disabled={readOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Resumen de Inspección</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>
            • Estado de conservación: <strong>{getConservationStateLabel(conservationState)}</strong>
          </p>
          <p>
            • Patologías detectadas: <strong>{detectedPathologies}</strong>
          </p>
          {criticalIssues > 0 && (
            <p className="text-red-700 font-semibold">
              • ⚠️ Problemas críticos: <strong>{criticalIssues}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
