import { useForm } from "react-hook-form";
import { Tab } from "@headlessui/react";
import {
  Home,
  Building,
  Store,
  Landmark,
  Factory,
  CheckCircle,
  FileText,
  MapPin,
  Wrench,
  Shield,
  Building2,
} from "lucide-react";

interface PropertyFormData {
  // Basic Information
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  type: "HOUSE" | "APARTMENT" | "COMMERCIAL" | "LAND" | "INDUSTRIAL";
  
  // SBS Compliance Fields
  propertyRegime?: "PRIVATE" | "PUBLIC" | "COMMUNAL" | "HORIZONTAL_PROPERTY";
  inspectionDate?: string;
  personPresentAtInspection?: string;
  saturationIndex?: number;
  socioeconomicLevel?: "HIGH" | "MEDIUM_HIGH" | "MEDIUM" | "MEDIUM_LOW" | "LOW";
  cos?: number;
  cus?: number;
  easementsAndRestrictions?: string;
  panoramicCharacteristics?: string;
  rentableUnits?: number;
  roofCondition?: string;
  fenceCondition?: string;
  ceilingCondition?: string;
  stairsCondition?: string;
  numberOfFacades?: number;
  hasMaintenanceLogs?: boolean;
  maintenanceNotes?: string;
  aliquotPercentage?: number; // For APARTMENT type (Propiedad Horizontal)
  
  // Areas
  landArea?: number;
  builtArea?: number;
  areaAccordingToDeed?: number;
  areaOnSite?: number;
  
  // Physical Characteristics
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  yearBuilt?: number;
  frontageWidth?: number;
  topography?: string;
  occupancyStatus?: string;
  zoning?: string;
  parking?: number;
  amenities?: string[];
  
  // Valuation Request
  financialInstitution?: string;
  branchOffice?: string;
  creditOfficer?: string;
  clientName?: string;
  clientId?: string;
  clientPhone?: string;
  clientEmail?: string;
  legalOwnerName?: string;
  legalOwnerId?: string;
  purpose?: "MORTGAGE_LOAN" | "PURCHASE_SALE" | "INSURANCE" | "LEGAL_LITIGATION" | "INHERITANCE" | "ASSET_VALUATION" | "OTHER";
  purposeDescription?: string;
  valuationObject?: "MARKET_VALUE" | "LIQUIDATION_VALUE" | "RESCUE_VALUE" | "SCRAP_VALUE";
  requestedLoanAmount?: number;
  loanTerm?: number;
  requiredDate?: string;
  
  // Boundaries
  northBoundaryLength?: number;
  northBoundaryAdjacent?: string;
  southBoundaryLength?: number;
  southBoundaryAdjacent?: string;
  eastBoundaryLength?: number;
  eastBoundaryAdjacent?: string;
  westBoundaryLength?: number;
  westBoundaryAdjacent?: string;
  
  // Environment and Services
  zoneClassification?: "RESIDENTIAL" | "COMMERCIAL" | "MIXED_USE" | "INDUSTRIAL" | "AGRICULTURAL" | "INSTITUTIONAL";
  urbanConsolidation?: "CONSOLIDATED" | "IN_CONSOLIDATION" | "INCIPIENT" | "RURAL";
  populationDensity?: "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW";
  roadType?: "ASPHALT" | "CONCRETE" | "PAVING_STONES" | "DIRT" | "GRAVEL";
  roadCondition?: string;
  sidewalkAvailable?: boolean;
  hasPotableWater?: boolean;
  hasStormDrainage?: boolean;
  hasSanitarySewer?: boolean;
  hasElectricityAerial?: boolean;
  hasElectricityUnderground?: boolean;
  hasTelephone?: boolean;
  hasInternet?: boolean;
  hasStreetLighting?: boolean;
  hasGarbageCollection?: boolean;
  
  // Technical Specifications
  foundationType?: "ISOLATED_FOOTINGS" | "CONTINUOUS_FOOTINGS" | "SLAB_ON_GRADE" | "PILES" | "DEEP_FOUNDATION" | "NONE";
  foundationDescription?: string;
  structureType?: "REINFORCED_CONCRETE" | "STEEL" | "WOOD" | "MASONRY" | "MIXED" | "NONE";
  structureDescription?: string;
  masonryType?: "BRICK" | "CONCRETE_BLOCK" | "ADOBE" | "BAHAREQUE" | "PREFABRICATED_PANELS" | "NONE";
  masonryDescription?: string;
  floorType?: "REINFORCED_CONCRETE_SLAB" | "STEEL_BEAMS" | "WOOD_JOISTS" | "NONE";
  floorDescription?: string;
  exteriorCoating?: "CERAMIC" | "PORCELAIN" | "NATURAL_STONE" | "PAINT" | "PLASTER" | "STUCCO" | "WALLPAPER" | "WOOD_PANELING" | "NONE";
  interiorCoating?: "CERAMIC" | "PORCELAIN" | "NATURAL_STONE" | "PAINT" | "PLASTER" | "STUCCO" | "WALLPAPER" | "WOOD_PANELING" | "NONE";
  coatingDescription?: string;
  carpentryType?: "WOOD" | "ALUMINUM" | "PVC" | "METAL" | "NONE";
  carpentryDescription?: string;
  locksmithType?: string;
  locksmithDescription?: string;
  glazingType?: "CLEAR_GLASS" | "TEMPERED_GLASS" | "LAMINATED_GLASS" | "DOUBLE_GLAZED" | "NONE";
  glazingDescription?: string;
  plumbingType?: "PVC" | "COPPER" | "GALVANIZED_STEEL" | "PEX" | "NONE";
  plumbingDescription?: string;
  electricalType?: "CONDUIT" | "ARMORED_CABLE" | "NON_METALLIC_CABLE" | "EXPOSED" | "NONE";
  electricalDescription?: string;
  electricalCapacity?: string;
  
  // Construction Details (legacy compatibility)
  roofMaterial?: string;
  wallMaterial?: string;
  floorMaterial?: string;
  conservationState?: "EXCELLENT" | "GOOD" | "REGULAR" | "POOR" | "VERY_POOR";
  
  // Legal Information
  legalOwner?: string;
  cadastralNumber?: string;
  registrationNumber?: string;
  hasLiens?: boolean;
  hasEncumbrances?: boolean;
}

interface PropertyFormProps {
  initialValues?: Partial<PropertyFormData>;
  onSubmit: (data: PropertyFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function PropertyForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Guardar",
}: PropertyFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PropertyFormData>({
    defaultValues: {
      type: "HOUSE",
      state: "Pichincha",
      sidewalkAvailable: false,
      hasPotableWater: false,
      hasStormDrainage: false,
      hasSanitarySewer: false,
      hasElectricityAerial: false,
      hasElectricityUnderground: false,
      hasTelephone: false,
      hasInternet: false,
      hasStreetLighting: false,
      hasGarbageCollection: false,
      hasLiens: false,
      hasEncumbrances: false,
      hasMaintenanceLogs: false,
      ...initialValues,
    },
  });

  const propertyType = watch("type");

  // Helper function to clean NaN values from form data
  const cleanFormData = (data: PropertyFormData): PropertyFormData => {
    const cleaned = { ...data };
    
    // Convert NaN to undefined for all number fields
    const numberFields: (keyof PropertyFormData)[] = [
      'landArea', 'builtArea', 'areaAccordingToDeed', 'areaOnSite',
      'bedrooms', 'bathrooms', 'floors', 'yearBuilt', 'frontageWidth',
      'parking', 'saturationIndex', 'numberOfFacades', 'cos', 'cus',
      'aliquotPercentage', 'rentableUnits', 'northBoundaryLength',
      'southBoundaryLength', 'eastBoundaryLength', 'westBoundaryLength',
      'requestedLoanAmount', 'loanTerm'
    ];
    
    numberFields.forEach(field => {
      const value = cleaned[field];
      if (typeof value === 'number' && isNaN(value)) {
        // @ts-ignore - we know these are optional number fields
        cleaned[field] = undefined;
      }
    });
    
    return cleaned;
  };

  const handleFormSubmit = (data: PropertyFormData) => {
    const cleanedData = cleanFormData(data);
    onSubmit(cleanedData);
  };

  const propertyTypes = [
    { value: "HOUSE", label: "Casa", icon: Home },
    { value: "APARTMENT", label: "Apartamento", icon: Building },
    { value: "COMMERCIAL", label: "Comercial", icon: Store },
    { value: "LAND", label: "Terreno", icon: Landmark },
    { value: "INDUSTRIAL", label: "Industrial", icon: Factory },
  ];

  const tabs = [
    { name: "Básico", icon: Home },
    { name: "Solicitud", icon: FileText },
    { name: "Linderos", icon: MapPin },
    { name: "Entorno", icon: Building2 },
    { name: "Técnico", icon: Wrench },
    { name: "Estado", icon: Shield },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Tab.Group>
        <Tab.List className="flex space-x-2 rounded-xl bg-blue-50 p-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                ${
                  selected
                    ? "bg-white text-blue-700 shadow"
                    : "text-gray-600 hover:bg-white/[0.12] hover:text-gray-800"
                }`
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-6">
          {/* Tab 1: Basic Information */}
          <Tab.Panel className="space-y-6">
            {/* TODO: Interactive Map Integration */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Próxima actualización:</strong> Los campos de latitud y longitud serán reemplazados por un mapa interactivo donde podrá arrastrar un pin para fijar la ubicación exacta de la propiedad.
              </p>
            </div>

            {/* Property Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Propiedad *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {propertyTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      propertyType === type.value
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value={type.value}
                      {...register("type", { required: true })}
                      className="sr-only"
                    />
                    <type.icon
                      className={`w-8 h-8 mb-2 ${
                        propertyType === type.value
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        propertyType === type.value
                          ? "text-blue-900"
                          : "text-gray-700"
                      }`}
                    >
                      {type.label}
                    </span>
                    {propertyType === type.value && (
                      <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-blue-600" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información de Ubicación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    {...register("address", {
                      required: "La dirección es requerida",
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Av. Amazonas N24-03"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    {...register("city", { required: "La ciudad es requerida" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Quito"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provincia *
                  </label>
                  <select
                    {...register("state", { required: "La provincia es requerida" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Pichincha">Pichincha</option>
                    <option value="Guayas">Guayas</option>
                    <option value="Azuay">Azuay</option>
                    <option value="Manabí">Manabí</option>
                    <option value="Tungurahua">Tungurahua</option>
                  </select>
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.state.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    {...register("zipCode")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="170150"
                  />
                </div>
              </div>
            </div>

            {/* Areas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Áreas y Medidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Área del Terreno (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("landArea", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="250.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Área Construida (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("builtArea", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="180.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Área según Escritura (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("areaAccordingToDeed", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="250.00"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Área registrada en documentos legales
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Área Medida en Sitio (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("areaOnSite", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="248.50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Área medida durante la inspección
                  </p>
                </div>
              </div>
            </div>

            {/* Physical Characteristics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Características Físicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Año de Construcción
                  </label>
                  <input
                    type="number"
                    {...register("yearBuilt", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2015"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ancho de Frente (m)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("frontageWidth", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topografía
                  </label>
                  <select
                    {...register("topography")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="FLAT">Plano</option>
                    <option value="SLOPED">Inclinado</option>
                    <option value="IRREGULAR">Irregular</option>
                    <option value="HILLSIDE">Ladera</option>
                  </select>
                </div>

                {propertyType !== "LAND" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dormitorios
                      </label>
                      <input
                        type="number"
                        {...register("bedrooms", { valueAsNumber: true })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Baños
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        {...register("bathrooms", { valueAsNumber: true })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="2.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pisos
                      </label>
                      <input
                        type="number"
                        {...register("floors", { valueAsNumber: true })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="2"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de Ocupación
                  </label>
                  <select
                    {...register("occupancyStatus")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="OCCUPIED">Ocupado</option>
                    <option value="VACANT">Vacío</option>
                    <option value="UNDER_CONSTRUCTION">En Construcción</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estacionamientos
                  </label>
                  <input
                    type="number"
                    {...register("parking", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Amenidades
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: "pool", label: "Piscina" },
                    { value: "garden", label: "Jardín" },
                    { value: "security", label: "Seguridad 24/7" },
                    { value: "gym", label: "Gimnasio" },
                    { value: "playground", label: "Área de Juegos" },
                    { value: "elevator", label: "Ascensor" },
                    { value: "terrace", label: "Terraza" },
                    { value: "storage", label: "Bodega" },
                  ].map((amenity) => (
                    <label
                      key={amenity.value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={amenity.value}
                        {...register("amenities")}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* SBS Compliance Fields */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información SBS (Anexo 1, Sección 3)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Régimen de Propiedad
                  </label>
                  <select
                    {...register("propertyRegime")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="PRIVATE">Privada</option>
                    <option value="PUBLIC">Pública</option>
                    <option value="COMMUNAL">Comunal</option>
                    <option value="HORIZONTAL_PROPERTY">Propiedad Horizontal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inspección
                  </label>
                  <input
                    type="date"
                    {...register("inspectionDate")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persona Presente en Inspección
                  </label>
                  <input
                    type="text"
                    {...register("personPresentAtInspection")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre de quien recibió la inspección"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel Socioeconómico del Sector
                  </label>
                  <select
                    {...register("socioeconomicLevel")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="HIGH">Alto</option>
                    <option value="MEDIUM_HIGH">Medio Alto</option>
                    <option value="MEDIUM">Medio</option>
                    <option value="MEDIUM_LOW">Medio Bajo</option>
                    <option value="LOW">Bajo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Índice de Saturación (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("saturationIndex", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="75.50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Porcentaje de lotes construidos vs baldíos
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Fachadas
                  </label>
                  <input
                    type="number"
                    {...register("numberOfFacades", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1, 2, 3, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    COS (Coeficiente de Ocupación del Suelo)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("cos", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CUS (Coeficiente de Utilización del Suelo)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("cus", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2.40"
                  />
                </div>

                {propertyType === "APARTMENT" && (
                  <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Porcentaje de Alícuota (Propiedad Horizontal) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("aliquotPercentage", { 
                        valueAsNumber: true,
                        required: propertyType === "APARTMENT" ? "La alícuota es obligatoria para apartamentos" : false
                      })}
                      className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="15.50"
                    />
                    <p className="mt-1 text-xs text-blue-700">
                      <strong>Normativa SBS 2.3:</strong> Para apartamentos, se debe especificar el porcentaje de participación en áreas comunales. Este valor se aplicará al cálculo de áreas comunales en el costo de construcción.
                    </p>
                    {errors.aliquotPercentage && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.aliquotPercentage.message}
                      </p>
                    )}
                  </div>
                )}

                {(propertyType === "COMMERCIAL" || propertyType === "APARTMENT") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidades Arrendables
                    </label>
                    <input
                      type="number"
                      {...register("rentableUnits", { valueAsNumber: true })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Número de unidades que pueden generar renta
                    </p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Características Panorámicas (Vistas y Entorno)
                  </label>
                  <textarea
                    {...register("panoramicCharacteristics")}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción de vistas, paisaje circundante, elementos visuales destacados..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servidumbres y Restricciones
                  </label>
                  <textarea
                    {...register("easementsAndRestrictions")}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Servidumbres de paso, líneas eléctricas, restricciones de construcción, etc."
                  />
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Tab 2: Valuation Request */}
          <Tab.Panel className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Entidad Solicitante
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institución Financiera
                  </label>
                  <input
                    type="text"
                    {...register("financialInstitution")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Banco Pichincha"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sucursal
                  </label>
                  <input
                    type="text"
                    {...register("branchOffice")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Sucursal Norte"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oficial de Crédito
                  </label>
                  <input
                    type="text"
                    {...register("creditOfficer")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre del oficial responsable"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información del Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    {...register("clientName")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cédula/RUC del Cliente
                  </label>
                  <input
                    type="text"
                    {...register("clientId")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    {...register("clientPhone")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0991234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register("clientEmail")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="cliente@example.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Propietario Legal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Propietario Legal
                  </label>
                  <input
                    type="text"
                    {...register("legalOwnerName")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="María González"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Según escrituras públicas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cédula/RUC del Propietario
                  </label>
                  <input
                    type="text"
                    {...register("legalOwnerId")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0987654321"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Propósito del Avalúo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Propósito
                  </label>
                  <select
                    {...register("purpose")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="MORTGAGE_LOAN">Crédito Hipotecario</option>
                    <option value="PURCHASE_SALE">Compra-Venta</option>
                    <option value="INSURANCE">Seguro</option>
                    <option value="LEGAL_LITIGATION">Litigio Legal</option>
                    <option value="INHERITANCE">Herencia</option>
                    <option value="ASSET_VALUATION">Valoración de Activos</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objeto del Avalúo
                  </label>
                  <select
                    {...register("valuationObject")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="MARKET_VALUE">Valor Justo de Mercado</option>
                    <option value="LIQUIDATION_VALUE">Valor de Liquidación</option>
                    <option value="RESCUE_VALUE">Valor de Rescate</option>
                    <option value="SCRAP_VALUE">Valor de Desecho</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Determina el tipo de valor que se concluirá en el avalúo (SBS 3.1.8)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Requerida
                  </label>
                  <input
                    type="date"
                    {...register("requiredDate")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción Adicional
                  </label>
                  <textarea
                    {...register("purposeDescription")}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Detalles adicionales sobre el propósito del avalúo..."
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información del Préstamo (si aplica)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto del Préstamo Solicitado ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("requestedLoanAmount", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50000.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plazo del Préstamo (meses)
                  </label>
                  <input
                    type="number"
                    {...register("loanTerm", { valueAsNumber: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="120"
                  />
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Tab 3: Boundaries */}
          <Tab.Panel className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Linderos Exactos
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Especifique las medidas exactas y colindancias de cada lindero
              </p>

              <div className="space-y-6">
                {/* North */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">Norte</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitud (metros)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("northBoundaryLength", { valueAsNumber: true })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="15.50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Colinda con
                      </label>
                      <input
                        type="text"
                        {...register("northBoundaryAdjacent")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Calle Principal"
                      />
                    </div>
                  </div>
                </div>

                {/* South */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3">Sur</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitud (metros)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("southBoundaryLength", { valueAsNumber: true })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="15.50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Colinda con
                      </label>
                      <input
                        type="text"
                        {...register("southBoundaryAdjacent")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Propiedad de Juan Pérez"
                      />
                    </div>
                  </div>
                </div>

                {/* East */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-3">Este</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitud (metros)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("eastBoundaryLength", { valueAsNumber: true })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="20.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Colinda con
                      </label>
                      <input
                        type="text"
                        {...register("eastBoundaryAdjacent")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Propiedad de María González"
                      />
                    </div>
                  </div>
                </div>

                {/* West */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3">Oeste</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitud (metros)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("westBoundaryLength", { valueAsNumber: true })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="20.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Colinda con
                      </label>
                      <input
                        type="text"
                        {...register("westBoundaryAdjacent")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Quebrada"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Tab 4: Environment & Services */}
          <Tab.Panel className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Clasificación de Zona
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uso de Suelo
                  </label>
                  <select
                    {...register("zoneClassification")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="RESIDENTIAL">Residencial</option>
                    <option value="COMMERCIAL">Comercial</option>
                    <option value="MIXED_USE">Uso Mixto</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="AGRICULTURAL">Agrícola</option>
                    <option value="INSTITUTIONAL">Institucional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consolidación Urbana
                  </label>
                  <select
                    {...register("urbanConsolidation")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="CONSOLIDATED">Consolidado</option>
                    <option value="IN_CONSOLIDATION">En Consolidación</option>
                    <option value="INCIPIENT">Incipiente</option>
                    <option value="RURAL">Rural</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Densidad Poblacional
                  </label>
                  <select
                    {...register("populationDensity")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="HIGH">Alta</option>
                    <option value="MEDIUM">Media</option>
                    <option value="LOW">Baja</option>
                    <option value="VERY_LOW">Muy Baja</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Vías y Accesos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Vía
                  </label>
                  <select
                    {...register("roadType")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="ASPHALT">Asfalto</option>
                    <option value="CONCRETE">Hormigón</option>
                    <option value="PAVING_STONES">Adoquín</option>
                    <option value="DIRT">Tierra</option>
                    <option value="GRAVEL">Lastre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de la Vía
                  </label>
                  <select
                    {...register("roadCondition")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="EXCELLENT">Excelente</option>
                    <option value="GOOD">Bueno</option>
                    <option value="REGULAR">Regular</option>
                    <option value="POOR">Malo</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("sidewalkAvailable")}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Acera disponible
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Servicios Públicos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("hasPotableWater")}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Agua Potable</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("hasStormDrainage")}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Alcantarillado Pluvial</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("hasSanitarySewer")}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Alcantarillado Sanitario</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("hasElectricityAerial")}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Electricidad Aérea</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("hasElectricityUnderground")}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Electricidad Subterránea</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("hasTelephone")}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Teléfono</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("hasInternet")}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Internet</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("hasStreetLighting")}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Alumbrado Público</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("hasGarbageCollection")}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Recolección de Basura</span>
                </label>
              </div>
            </div>
          </Tab.Panel>

          {/* Tab 5: Technical Specifications */}
          <Tab.Panel className="space-y-6">
            {propertyType !== "LAND" && (
              <>
                {/* Foundation */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cimentación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Cimentación
                      </label>
                      <select
                        {...register("foundationType")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="ISOLATED_FOOTINGS">Zapatas Aisladas</option>
                        <option value="CONTINUOUS_FOOTINGS">Zapatas Corridas</option>
                        <option value="SLAB_ON_GRADE">Losa de Cimentación</option>
                        <option value="PILES">Pilotes</option>
                        <option value="DEEP_FOUNDATION">Cimentación Profunda</option>
                        <option value="NONE">Ninguno</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        {...register("foundationDescription")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detalles adicionales..."
                      />
                    </div>
                  </div>
                </div>

                {/* Structure */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Estructura
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Estructura
                      </label>
                      <select
                        {...register("structureType")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="REINFORCED_CONCRETE">Hormigón Armado</option>
                        <option value="STEEL">Acero</option>
                        <option value="WOOD">Madera</option>
                        <option value="MASONRY">Mampostería</option>
                        <option value="MIXED">Mixta</option>
                        <option value="NONE">Ninguno</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        {...register("structureDescription")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detalles adicionales..."
                      />
                    </div>
                  </div>
                </div>

                {/* Masonry */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Mampostería
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Mampostería
                      </label>
                      <select
                        {...register("masonryType")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="BRICK">Ladrillo</option>
                        <option value="CONCRETE_BLOCK">Bloque de Hormigón</option>
                        <option value="ADOBE">Adobe</option>
                        <option value="BAHAREQUE">Bahareque</option>
                        <option value="PREFABRICATED_PANELS">Paneles Prefabricados</option>
                        <option value="NONE">Ninguno</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        {...register("masonryDescription")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detalles adicionales..."
                      />
                    </div>
                  </div>
                </div>

                {/* Floors */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Entrepisos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Entrepiso
                      </label>
                      <select
                        {...register("floorType")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="REINFORCED_CONCRETE_SLAB">Losa de Hormigón Armado</option>
                        <option value="STEEL_BEAMS">Vigas de Acero</option>
                        <option value="WOOD_JOISTS">Viguetas de Madera</option>
                        <option value="NONE">Ninguno</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        {...register("floorDescription")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detalles adicionales..."
                      />
                    </div>
                  </div>
                </div>

                {/* Coatings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Revestimientos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Revestimiento Exterior
                      </label>
                      <select
                        {...register("exteriorCoating")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="CERAMIC">Cerámica</option>
                        <option value="PORCELAIN">Porcelanato</option>
                        <option value="NATURAL_STONE">Piedra Natural</option>
                        <option value="PAINT">Pintura</option>
                        <option value="PLASTER">Enlucido</option>
                        <option value="STUCCO">Estuco</option>
                        <option value="WALLPAPER">Papel Tapiz</option>
                        <option value="WOOD_PANELING">Revestimiento de Madera</option>
                        <option value="NONE">Ninguno</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Revestimiento Interior
                      </label>
                      <select
                        {...register("interiorCoating")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="CERAMIC">Cerámica</option>
                        <option value="PORCELAIN">Porcelanato</option>
                        <option value="NATURAL_STONE">Piedra Natural</option>
                        <option value="PAINT">Pintura</option>
                        <option value="PLASTER">Enlucido</option>
                        <option value="STUCCO">Estuco</option>
                        <option value="WALLPAPER">Papel Tapiz</option>
                        <option value="WOOD_PANELING">Revestimiento de Madera</option>
                        <option value="NONE">Ninguno</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción de Revestimientos
                      </label>
                      <input
                        type="text"
                        {...register("coatingDescription")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detalles adicionales..."
                      />
                    </div>
                  </div>
                </div>

                {/* Carpentry */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Carpintería (Puertas y Ventanas)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Carpintería
                      </label>
                      <select
                        {...register("carpentryType")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="WOOD">Madera</option>
                        <option value="ALUMINUM">Aluminio</option>
                        <option value="PVC">PVC</option>
                        <option value="METAL">Metal</option>
                        <option value="NONE">Ninguno</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        {...register("carpentryDescription")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detalles adicionales..."
                      />
                    </div>
                  </div>
                </div>

                {/* Locksmith */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cerrajería
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Cerrajería
                      </label>
                      <select
                        {...register("locksmithType")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="STANDARD">Estándar</option>
                        <option value="SECURITY">Seguridad</option>
                        <option value="HIGH_SECURITY">Alta Seguridad</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        {...register("locksmithDescription")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detalles adicionales..."
                      />
                    </div>
                  </div>
                </div>

                {/* Glazing */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Vidriería
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Vidrio
                      </label>
                      <select
                        {...register("glazingType")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="CLEAR_GLASS">Vidrio Claro</option>
                        <option value="TEMPERED_GLASS">Vidrio Templado</option>
                        <option value="LAMINATED_GLASS">Vidrio Laminado</option>
                        <option value="DOUBLE_GLAZED">Doble Vidrio</option>
                        <option value="NONE">Ninguno</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        {...register("glazingDescription")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detalles adicionales..."
                      />
                    </div>
                  </div>
                </div>

                {/* Plumbing */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Instalaciones Hidrosanitarias
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Tubería
                      </label>
                      <select
                        {...register("plumbingType")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="PVC">PVC</option>
                        <option value="COPPER">Cobre</option>
                        <option value="GALVANIZED_STEEL">Acero Galvanizado</option>
                        <option value="PEX">PEX</option>
                        <option value="NONE">Ninguno</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        {...register("plumbingDescription")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detalles adicionales..."
                      />
                    </div>
                  </div>
                </div>

                {/* Electrical */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Instalaciones Eléctricas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Instalación
                      </label>
                      <select
                        {...register("electricalType")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="CONDUIT">Conduit</option>
                        <option value="ARMORED_CABLE">Cable Armado</option>
                        <option value="NON_METALLIC_CABLE">Cable No Metálico</option>
                        <option value="EXPOSED">Expuesto</option>
                        <option value="NONE">Ninguno</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacidad
                      </label>
                      <input
                        type="text"
                        {...register("electricalCapacity")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="110V, 220V, Trifásico"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        {...register("electricalDescription")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detalles adicionales..."
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {propertyType === "LAND" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-gray-700">
                  Las especificaciones técnicas no aplican para terrenos sin construcción.
                </p>
              </div>
            )}
          </Tab.Panel>

          {/* Tab 6: Condition & Materials */}
          <Tab.Panel className="space-y-6">
            {propertyType !== "LAND" && (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Estado de Conservación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado General
                      </label>
                      <select
                        {...register("conservationState")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="EXCELLENT">Excelente</option>
                        <option value="GOOD">Bueno</option>
                        <option value="REGULAR">Regular</option>
                        <option value="POOR">Malo</option>
                        <option value="VERY_POOR">Muy Malo</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">
                    Desglose de Estado por Elemento
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Evaluación granular del estado de obra gris y acabados
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado del Techo
                      </label>
                      <select
                        {...register("roofCondition")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="EXCELLENT">Excelente</option>
                        <option value="GOOD">Bueno</option>
                        <option value="REGULAR">Regular</option>
                        <option value="POOR">Malo</option>
                        <option value="VERY_POOR">Muy Malo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado del Cerramiento/Cerca
                      </label>
                      <select
                        {...register("fenceCondition")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="EXCELLENT">Excelente</option>
                        <option value="GOOD">Bueno</option>
                        <option value="REGULAR">Regular</option>
                        <option value="POOR">Malo</option>
                        <option value="VERY_POOR">Muy Malo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado del Cielo Raso
                      </label>
                      <select
                        {...register("ceilingCondition")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="EXCELLENT">Excelente</option>
                        <option value="GOOD">Bueno</option>
                        <option value="REGULAR">Regular</option>
                        <option value="POOR">Malo</option>
                        <option value="VERY_POOR">Muy Malo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado de Escaleras
                      </label>
                      <select
                        {...register("stairsCondition")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="EXCELLENT">Excelente</option>
                        <option value="GOOD">Bueno</option>
                        <option value="REGULAR">Regular</option>
                        <option value="POOR">Malo</option>
                        <option value="VERY_POOR">Muy Malo</option>
                        <option value="N/A">No Aplica</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Registro de Mantenimiento
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("hasMaintenanceLogs")}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        La propiedad cuenta con registros de mantenimiento
                      </span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas de Mantenimiento
                      </label>
                      <textarea
                        {...register("maintenanceNotes")}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detalles sobre el historial de mantenimiento, reparaciones realizadas, etc."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Materiales de Construcción (Compatibilidad)
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Campos opcionales para compatibilidad con sistemas antiguos
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Material del Techo
                      </label>
                      <input
                        type="text"
                        {...register("roofMaterial")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Hormigón, Zinc, Teja, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Material de Paredes
                      </label>
                      <input
                        type="text"
                        {...register("wallMaterial")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ladrillo, Bloque, Madera, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Material del Piso
                      </label>
                      <input
                        type="text"
                        {...register("floorMaterial")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Cerámica, Porcelanato, Madera, etc."
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información Legal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Propietario Legal
                  </label>
                  <input
                    type="text"
                    {...register("legalOwner")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre del propietario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número Catastral
                  </label>
                  <input
                    type="text"
                    {...register("cadastralNumber")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Registro
                  </label>
                  <input
                    type="text"
                    {...register("registrationNumber")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="REG-123456"
                  />
                </div>

                <div className="flex flex-col space-y-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("hasLiens")}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Tiene Gravámenes
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("hasEncumbrances")}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Tiene Hipotecas
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Submit Button */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          {isSubmitting ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
