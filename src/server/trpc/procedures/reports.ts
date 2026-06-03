import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "../main";
import { db } from "~/server/db";
import { generateText, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";
import crypto from "crypto";

async function getUserIdFromToken(token: string): Promise<number> {
  try {
    const verified = jwt.verify(token, env.JWT_SECRET);
    const parsed = z.object({ userId: z.number() }).parse(verified);
    return parsed.userId;
  } catch (error) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }
}

// ========== DEPRECIATION CALCULATION FUNCTIONS ==========

/**
 * Calculate depreciation using the Ross-Heidecke method
 * Formula: D = (Edad / Vida Útil Total) × (1 + (Edad / Vida Útil Total)) × Factor Estado × 0.5
 */
function calculateRossHeideckeDepreciation(
  chronologicalAge: number,
  totalUsefulLife: number,
  conservationState: string,
): { depreciationPercent: number; remainingUsefulLife: number } {
  // State factors based on conservation state
  const stateFactors: Record<string, number> = {
    EXCELLENT: 0.0, // 0% depreciation factor
    GOOD: 0.32, // 32% depreciation factor
    REGULAR: 0.5, // 50% depreciation factor
    POOR: 0.72, // 72% depreciation factor
    VERY_POOR: 0.9, // 90% depreciation factor
  };

  const stateFactor = stateFactors[conservationState] || 0.5;

  // Prevent division by zero
  if (totalUsefulLife === 0) {
    return { depreciationPercent: 100, remainingUsefulLife: 0 };
  }

  const ageRatio = chronologicalAge / totalUsefulLife;

  // Ross-Heidecke formula
  const depreciationPercent = Math.min(
    100,
    ageRatio * (1 + ageRatio) * stateFactor * 50,
  );

  // Calculate remaining useful life considering both age and conservation state
  const effectiveAge = chronologicalAge * (1 + stateFactor);
  const remainingUsefulLife = Math.max(0, totalUsefulLife - effectiveAge);

  return {
    depreciationPercent: Math.round(depreciationPercent * 100) / 100,
    remainingUsefulLife: Math.round(remainingUsefulLife * 100) / 100,
  };
}

/**
 * Calculate depreciation using the Fitto-Corvini method
 * Formula: D = [1 - ((Vida Útil Remanente / Vida Útil Total)^2)] × 100
 */
function calculateFittoCorviniDepreciation(
  chronologicalAge: number,
  totalUsefulLife: number,
  conservationState: string,
): { depreciationPercent: number; remainingUsefulLife: number } {
  // State adjustment factors for effective age
  const stateAdjustments: Record<string, number> = {
    EXCELLENT: 0.8, // Property ages 20% slower
    GOOD: 1.0, // Normal aging
    REGULAR: 1.2, // Property ages 20% faster
    POOR: 1.5, // Property ages 50% faster
    VERY_POOR: 2.0, // Property ages twice as fast
  };

  const stateAdjustment = stateAdjustments[conservationState] || 1.0;

  // Calculate effective age considering conservation state
  const effectiveAge = chronologicalAge * stateAdjustment;

  // Prevent division by zero
  if (totalUsefulLife === 0) {
    return { depreciationPercent: 100, remainingUsefulLife: 0 };
  }

  const remainingUsefulLife = Math.max(0, totalUsefulLife - effectiveAge);
  const remainingRatio = remainingUsefulLife / totalUsefulLife;

  // Fitto-Corvini formula
  const depreciationPercent = Math.min(
    100,
    (1 - Math.pow(remainingRatio, 2)) * 100,
  );

  return {
    depreciationPercent: Math.round(depreciationPercent * 100) / 100,
    remainingUsefulLife: Math.round(remainingUsefulLife * 100) / 100,
  };
}

/**
 * Determine total useful life based on property type and construction quality
 */
function determineTotalUsefulLife(
  propertyType: string,
  structureType?: string,
  conservationState?: string,
): number {
  // Base useful life by property type (years)
  const baseUsefulLife: Record<string, number> = {
    HOUSE: 50,
    APARTMENT: 60,
    COMMERCIAL: 40,
    LAND: 0, // Land doesn't depreciate
    INDUSTRIAL: 35,
  };

  let usefulLife = baseUsefulLife[propertyType] || 50;

  // Adjust based on structure type
  if (structureType === "REINFORCED_CONCRETE") {
    usefulLife += 10;
  } else if (structureType === "STEEL") {
    usefulLife += 5;
  } else if (structureType === "WOOD") {
    usefulLife -= 10;
  } else if (structureType === "ADOBE" || structureType === "BAHAREQUE") {
    usefulLife -= 15;
  }

  return Math.max(20, usefulLife); // Minimum 20 years
}

/**
 * Calculate value of additional works with individual depreciation
 */
async function calculateAdditionalWorksValue(propertyId: number): Promise<{
  totalReplacementCost: number;
  totalDepreciatedValue: number;
  works: Array<{
    name: string;
    replacementCost: number;
    depreciatedValue: number;
  }>;
}> {
  const additionalWorks = await db.additionalWork.findMany({
    where: { propertyId },
  });

  let totalReplacementCost = 0;
  let totalDepreciatedValue = 0;
  const works = [];

  for (const work of additionalWorks) {
    totalReplacementCost += work.replacementCost;
    totalDepreciatedValue += work.depreciatedValue;

    works.push({
      name: work.name,
      replacementCost: work.replacementCost,
      depreciatedValue: work.depreciatedValue,
    });
  }

  return {
    totalReplacementCost,
    totalDepreciatedValue,
    works,
  };
}

// ========== TRPC PROCEDURES ==========

export const generateReport = baseProcedure
  .input(
    z.object({
      token: z.string(),
      propertyId: z.number(),
      depreciationMethod: z
        .enum(["Ross-Heidecke", "Fitto-Corvini", "Lineal"])
        .default("Ross-Heidecke"),
      // Optional: Manual overrides for valuation
      cadastralValue: z.number().optional(),
      estimatedMonthlyRent: z.number().optional(),
      operatingExpensesPercent: z.number().optional(), // As percentage of gross income
      capitalizationRate: z.number().optional(), // As percentage
    }),
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    // Get property with all related data
    const property = await db.property.findUnique({
      where: { id: input.propertyId },
      include: {
        valuationRequest: true,
        photos: true,
        comparables: {
          orderBy: { distance: "asc" },
          take: 5,
        },
        riskAssessments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        additionalWorks: true,
      },
    });

    if (!property || property.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Property not found or access denied",
      });
    }

    // Create report record
    const report = await db.valuationReport.create({
      data: {
        propertyId: input.propertyId,
        userId,
        status: "GENERATING",
      },
    });

    try {
      const riskAssessment = property.riskAssessments[0];

      // ========== GENERATE ENVIRONMENT DESCRIPTION WITH STRUCTURED DATA ==========
      const environmentPrompt = `You are a professional real estate appraiser writing for a bank valuation report in Ecuador (complying with Superintendencia de Bancos regulations).

Property Details:
- Address: ${property.address}, ${property.city}, ${property.state}
- Type: ${property.type}
- Coordinates: ${property.latitude}, ${property.longitude}
${property.valuationRequest?.valuationObject ? `- Objeto del Avalúo: ${property.valuationRequest.valuationObject}` : ""}

LINDEROS (EXACT BOUNDARIES):
${property.northBoundaryLength ? `- Norte: ${property.northBoundaryLength}m, colinda con ${property.northBoundaryAdjacent || "N/A"}` : ""}
${property.southBoundaryLength ? `- Sur: ${property.southBoundaryLength}m, colinda con ${property.southBoundaryAdjacent || "N/A"}` : ""}
${property.eastBoundaryLength ? `- Este: ${property.eastBoundaryLength}m, colinda con ${property.eastBoundaryAdjacent || "N/A"}` : ""}
${property.westBoundaryLength ? `- Oeste: ${property.westBoundaryLength}m, colinda con ${property.westBoundaryAdjacent || "N/A"}` : ""}

ENTORNO Y CLASIFICACIÓN:
- Clasificación de Zona: ${property.zoneClassification || "No especificada"}
- Consolidación Urbana: ${property.urbanConsolidation || "No especificada"}
- Densidad Poblacional: ${property.populationDensity || "No especificada"}
- Nivel Socioeconómico: ${property.socioeconomicLevel || "No especificado"}
- Índice de Saturación: ${property.saturationIndex ? `${property.saturationIndex}%` : "No especificado"}
- Tipo de Vía: ${property.roadType || "No especificada"}
- Condición de Vía: ${property.roadCondition || "No especificada"}
- Acera Disponible: ${property.sidewalkAvailable ? "Sí" : "No"}

SERVICIOS PÚBLICOS DISPONIBLES:
- Agua Potable: ${property.hasPotableWater ? "✓" : "✗"}
- Alcantarillado Pluvial: ${property.hasStormDrainage ? "✓" : "✗"}
- Alcantarillado Sanitario: ${property.hasSanitarySewer ? "✓" : "✗"}
- Electricidad Aérea: ${property.hasElectricityAerial ? "✓" : "✗"}
- Electricidad Subterránea: ${property.hasElectricityUnderground ? "✓" : "✗"}
- Teléfono: ${property.hasTelephone ? "✓" : "✗"}
- Internet: ${property.hasInternet ? "✓" : "✗"}
- Alumbrado Público: ${property.hasStreetLighting ? "✓" : "✗"}
- Recolección de Basura: ${property.hasGarbageCollection ? "✓" : "✗"}

${
  riskAssessment
    ? `EVALUACIÓN DE RIESGOS:
- Riesgo General: ${riskAssessment.overallRisk}
- Riesgo de Inundación: ${riskAssessment.floodRisk}
- Riesgo Sísmico: ${riskAssessment.seismicRisk}
- Riesgo de Deslizamiento: ${riskAssessment.landslideRisk}
- Cercanía a Zonas Protegidas: ${riskAssessment.nearProtectedArea ? `Sí - ${riskAssessment.protectedAreaName} (${riskAssessment.distanceToProtectedArea}m)` : "No"}
- Cercanía a Zonas de Alto Riesgo: ${riskAssessment.nearHighRiskZone ? `Sí - ${riskAssessment.highRiskZoneType} (${riskAssessment.distanceToHighRiskZone}m)` : "No"}
- Puntos de Interés Cercanos: ${riskAssessment.nearbyPOIs.join(", ")}
- Calidad de Acceso: ${riskAssessment.accessQuality || "No evaluada"}
`
    : ""
}

${
  property.comparables.length > 0
    ? `CONTEXTO DE MERCADO - ${property.comparables.length} Propiedades Comparables:
${property.comparables.map((c, i) => `${i + 1}. $${Math.round(c.price).toLocaleString()} (${c.distance.toFixed(0)}m de distancia) - ${c.area}m², ${c.bedrooms || "N/A"} hab, ${c.bathrooms || "N/A"} baños, Año ${c.yearBuilt || "N/A"}`).join("\n")}
Precio Promedio: $${Math.round(property.comparables.reduce((sum, c) => sum + c.price, 0) / property.comparables.length).toLocaleString()}
Precio Promedio por m²: $${Math.round(property.comparables.reduce((sum, c) => sum + c.pricePerM2, 0) / property.comparables.length).toLocaleString()}
`
    : ""
}

INSTRUCCIONES:
Escribe una descripción detallada de 3-4 párrafos del entorno y ubicación de la propiedad, incluyendo:
1. Características generales del área y nivel de desarrollo urbano (usar datos de consolidación urbana y densidad)
2. Servicios cercanos, comodidades y puntos de interés
3. Acceso, conectividad y opciones de transporte (mencionar tipo y condición de vía)
4. Calidad del vecindario y consideraciones de seguridad
5. Factores de riesgo y su impacto en el valor (usar datos estructurados de riesgos)
6. Tendencias del mercado y demanda en el área basada en propiedades comparables
7. Deseabilidad general y potencial de inversión de la ubicación

IMPORTANTE - CUMPLIMIENTO ESTRICTO SBS (Anexo 1, Sección 3.2.5):
- Usa ÚNICAMENTE los datos estructurados proporcionados. NO inventes información.
- Si un dato crítico no está disponible, DECLARA EXPLÍCITAMENTE esta limitación como "CONDICIÓN LIMITANTE" al inicio del párrafo correspondiente.
- Ejemplo: "CONDICIÓN LIMITANTE: No se proporcionó información sobre el nivel socioeconómico del sector, por lo que este análisis se basa en observaciones visuales durante la inspección."
- Todos los valores monetarios mencionados en el texto deben estar REDONDEADOS AL DÓLAR MÁS CERCANO, SIN CENTAVOS (Numeral 3.5.6).
- Ejemplo correcto: "$125,000" o "$850 por m²"
- Ejemplo incorrecto: "$125,450.75" o "$849.23 por m²"
- Cumple estrictamente con las normativas de la Superintendencia de Bancos y Seguros (SBS) de Ecuador.

Escribe en español, tono profesional, adecuado para documentación bancaria. Sé específico y analítico, referenciando los datos proporcionados.`;

      const { text: environmentDescription } = await generateText({
        model: google("gemini-3.5-flash"),
        prompt: environmentPrompt,
      });

      // ========== GENERATE TECHNICAL DESCRIPTION WITH GRANULAR SPECIFICATIONS ==========
      const technicalPrompt = `You are a professional real estate appraiser writing for a bank valuation report in Ecuador (complying with Superintendencia de Bancos regulations).

DATOS TÉCNICOS DE LA PROPIEDAD:
- Tipo: ${property.type}
- Régimen de Propiedad: ${property.propertyRegime || "No especificado"}
${property.type === "APARTMENT" && property.aliquotPercentage ? `- Alícuota (Propiedad Horizontal): ${property.aliquotPercentage}%` : ""}
- Área de Terreno: ${property.landArea || "N/A"} m²
- Área Construida: ${property.builtArea || "N/A"} m²
- Área según Escritura: ${property.areaAccordingToDeed || "N/A"} m²
- Área Medida en Sitio: ${property.areaOnSite || "N/A"} m²
${property.areaAccordingToDeed && property.areaOnSite ? `- Diferencia de Áreas: ${Math.abs(property.areaAccordingToDeed - property.areaOnSite).toFixed(2)} m² (${((Math.abs(property.areaAccordingToDeed - property.areaOnSite) / property.areaAccordingToDeed) * 100).toFixed(2)}%)` : ""}
- Frente: ${property.frontageWidth || "N/A"} m
- Número de Fachadas: ${property.numberOfFacades || "N/A"}
- Topografía: ${property.topography || "N/A"}
- Dormitorios: ${property.bedrooms || "N/A"}
- Baños: ${property.bathrooms || "N/A"}
- Pisos: ${property.floors || "N/A"}
- Parqueaderos: ${property.parking || "N/A"}
- Año de Construcción: ${property.yearBuilt || "N/A"}
- Estado de Conservación: ${property.conservationState || "N/A"}
- Estado de Ocupación: ${property.occupancyStatus || "N/A"}
${property.rentableUnits ? `- Unidades Arrendables: ${property.rentableUnits}` : ""}

ESPECIFICACIONES TÉCNICAS DETALLADAS (SBS 3.3):

Cimentación:
- Tipo: ${property.foundationType || "No especificado"}
- Descripción: ${property.foundationDescription || "N/A"}

Estructura:
- Tipo: ${property.structureType || "No especificado"}
- Descripción: ${property.structureDescription || "N/A"}

Mampostería:
- Tipo: ${property.masonryType || "No especificado"}
- Descripción: ${property.masonryDescription || "N/A"}

Entrepisos:
- Tipo: ${property.floorType || "No especificado"}
- Descripción: ${property.floorDescription || "N/A"}

Revestimientos:
- Exterior: ${property.exteriorCoating || "No especificado"}
- Interior: ${property.interiorCoating || "No especificado"}
- Descripción: ${property.coatingDescription || "N/A"}

Carpintería (Puertas y Ventanas):
- Tipo: ${property.carpentryType || "No especificado"}
- Descripción: ${property.carpentryDescription || "N/A"}

Cerrajería:
- Tipo: ${property.locksmithType || "No especificado"}
- Descripción: ${property.locksmithDescription || "N/A"}

Vidriería:
- Tipo: ${property.glazingType || "No especificado"}
- Descripción: ${property.glazingDescription || "N/A"}

Instalaciones Hidrosanitarias:
- Tipo: ${property.plumbingType || "No especificado"}
- Descripción: ${property.plumbingDescription || "N/A"}

Instalaciones Eléctricas:
- Tipo: ${property.electricalType || "No especificado"}
- Capacidad: ${property.electricalCapacity || "No especificado"}
- Descripción: ${property.electricalDescription || "N/A"}

ESTADO DE ELEMENTOS ESPECÍFICOS (SBS 3.3.4):
- Techo: ${property.roofCondition || "No evaluado"}
- Cerramiento/Cerca: ${property.fenceCondition || "No evaluado"}
- Cielo Raso: ${property.ceilingCondition || "No evaluado"}
- Escaleras: ${property.stairsCondition || "No evaluado"}

MANTENIMIENTO (SBS 3.3.5):
- Registros de Mantenimiento: ${property.hasMaintenanceLogs ? "Sí" : "No"}
${property.maintenanceNotes ? `- Notas: ${property.maintenanceNotes}` : ""}

MATERIALES DE CONSTRUCCIÓN (Compatibilidad):
- Material de Techo: ${property.roofMaterial || "N/A"}
- Material de Paredes: ${property.wallMaterial || "N/A"}
- Material de Pisos: ${property.floorMaterial || "N/A"}

${property.amenities && property.amenities.length > 0 ? `AMENIDADES: ${property.amenities.join(", ")}` : ""}

${
  riskAssessment && riskAssessment.detectedIssues.length > 0
    ? `PATOLOGÍAS CONSTRUCTIVAS DETECTADAS:
${riskAssessment.detectedIssues.join(", ")}
- Grietas Estructurales: ${riskAssessment.hasStructuralCracks ? "Sí" : "No"}
- Asentamientos: ${riskAssessment.hasSettlement ? "Sí" : "No"}
- Humedad: ${riskAssessment.hasHumidity ? "Sí" : "No"}
- Corrosión: ${riskAssessment.hasCorrosion ? "Sí" : "No"}
- Problemas de Cimentación: ${riskAssessment.hasFoundationIssues ? "Sí" : "No"}
- Daños en Techo: ${riskAssessment.hasRoofDamage ? "Sí" : "No"}
`
    : ""
}

INSTRUCCIONES:
Escribe una descripción técnica detallada de la propiedad (3-4 párrafos), incluyendo:
1. Características físicas, dimensiones y características del terreno
2. Materiales de construcción, calidad e integridad estructural (usar especificaciones técnicas detalladas)
3. Estado actual de conservación y deficiencias (mencionar patologías específicas si existen)
4. Distribución, funcionalidad y utilización del espacio
5. Amenidades, características especiales y elementos que agregan valor
6. Cumplimiento con regulaciones de zonificación y códigos de construcción
7. Consideraciones relacionadas con la edad y necesidades de mantenimiento
8. Cualquier problema estructural o preocupación que afecte la valoración

IMPORTANTE - CUMPLIMIENTO ESTRICTO SBS (Anexo 1, Sección 3.2.5):
- Usa ÚNICAMENTE los datos estructurados proporcionados. NO inventes especificaciones técnicas.
- Si un dato técnico crítico no está disponible, DECLARA EXPLÍCITAMENTE esta limitación como "CONDICIÓN LIMITANTE".
- Ejemplo: "CONDICIÓN LIMITANTE: No se realizaron pruebas destructivas de materiales, por lo que la evaluación estructural se basa en inspección visual."
- Todos los valores monetarios mencionados en el texto deben estar REDONDEADOS AL DÓLAR MÁS CERCANO, SIN CENTAVOS (Numeral 3.5.6).
- Si no se proporcionó documentación legal (escrituras), menciona explícitamente: "CONDICIÓN LIMITANTE: Las áreas reportadas no han sido verificadas contra escrituras públicas."
- Cumple estrictamente con las normativas de la Superintendencia de Bancos y Seguros (SBS) de Ecuador.

Escribe en español, tono profesional, adecuado para documentación bancaria. Sé minucioso y analítico.`;

      const { text: technicalDescription } = await generateText({
        model: google("gemini-3.5-flash"),
        prompt: technicalPrompt,
      });

      // ========== CALCULATE VALUES ==========

      // 1. MARKET VALUE (Homologation Method)
      const avgComparablePrice =
        property.comparables.length > 0
          ? property.comparables.reduce((sum, c) => sum + c.adjustedPrice, 0) /
            property.comparables.length
          : 0;
      const marketValue =
        avgComparablePrice || (property.builtArea || 100) * 800;

      // 2. COST VALUE (Replacement Cost Method)
      const constructionCostPerM2 = 650; // $/m² - This should come from parametersSnapshot
      const landValuePerM2 = 150; // $/m² - This should come from parametersSnapshot
      const landValue = (property.landArea || 0) * landValuePerM2;
      const constructionCostBase =
        (property.builtArea || 0) * constructionCostPerM2;

      // Calculate depreciation using selected method
      const age = property.yearBuilt
        ? new Date().getFullYear() - property.yearBuilt
        : 0;
      const totalUsefulLife = determineTotalUsefulLife(
        property.type,
        property.structureType || undefined,
        property.conservationState || undefined,
      );

      let depreciationResult;
      if (input.depreciationMethod === "Ross-Heidecke") {
        depreciationResult = calculateRossHeideckeDepreciation(
          age,
          totalUsefulLife,
          property.conservationState || "REGULAR",
        );
      } else if (input.depreciationMethod === "Fitto-Corvini") {
        depreciationResult = calculateFittoCorviniDepreciation(
          age,
          totalUsefulLife,
          property.conservationState || "REGULAR",
        );
      } else {
        // Linear depreciation (fallback)
        const depreciationRate = age > 5 ? Math.min((age - 5) * 0.05, 0.5) : 0;
        depreciationResult = {
          depreciationPercent: depreciationRate * 100,
          remainingUsefulLife: Math.max(0, totalUsefulLife - age),
        };
      }

      const depreciationAmount =
        constructionCostBase * (depreciationResult.depreciationPercent / 100);
      const constructionCost = constructionCostBase - depreciationAmount;

      // 3. ADDITIONAL WORKS VALUE
      const additionalWorksResult = await calculateAdditionalWorksValue(
        input.propertyId,
      );

      // 4. COST VALUE TOTAL
      const costValue =
        landValue +
        constructionCost +
        additionalWorksResult.totalDepreciatedValue;

      // 5. INCOME VALUE (Capitalization of Rents)
      let incomeValue: number | undefined;
      let estimatedMonthlyRent: number | undefined;
      let annualGrossIncome: number | undefined;
      let operatingExpenses: number | undefined;
      let annualNetIncome: number | undefined;
      let capitalizationRate: number | undefined;

      if (input.estimatedMonthlyRent && input.estimatedMonthlyRent > 0) {
        estimatedMonthlyRent = input.estimatedMonthlyRent;
        annualGrossIncome = estimatedMonthlyRent * 12;

        // Operating expenses (default 25% if not provided)
        const operatingExpensesPercent = input.operatingExpensesPercent || 25;
        operatingExpenses =
          annualGrossIncome * (operatingExpensesPercent / 100);
        annualNetIncome = annualGrossIncome - operatingExpenses;

        // Capitalization rate (default 8% if not provided)
        capitalizationRate = input.capitalizationRate || 8;
        incomeValue = annualNetIncome / (capitalizationRate / 100);
      }

      // 6. FINAL VALUE (weighted average or decision)
      let finalValue: number;
      if (incomeValue) {
        // If we have income value, use weighted average of all three methods
        finalValue = marketValue * 0.5 + costValue * 0.3 + incomeValue * 0.2;
      } else {
        // Otherwise use market and cost only
        finalValue = marketValue * 0.7 + costValue * 0.3;
      }

      // 7. CADASTRAL VALUE (if provided)
      const cadastralValue = input.cadastralValue;

      // 8. REALIZATION VALUE (typically 70-80% of market value for quick sale)
      const realizationValue = marketValue * 0.75;

      // ========== PARAMETERS SNAPSHOT FOR LEGAL IMMUTABILITY ==========
      const parametersSnapshot = {
        calculationDate: new Date().toISOString(),
        depreciationMethod: input.depreciationMethod,
        baseCosts: {
          constructionCostPerM2,
          landValuePerM2,
        },
        depreciationIndices: {
          totalUsefulLife,
          chronologicalAge: age,
          depreciationPercent: depreciationResult.depreciationPercent,
          remainingUsefulLife: depreciationResult.remainingUsefulLife,
        },
        conservationStateFactors: {
          EXCELLENT: 0.0,
          GOOD: 0.32,
          REGULAR: 0.5,
          POOR: 0.72,
          VERY_POOR: 0.9,
        },
        marketData: {
          comparablesCount: property.comparables.length,
          avgComparablePrice,
          avgPricePerM2:
            property.comparables.length > 0
              ? property.comparables.reduce((sum, c) => sum + c.pricePerM2, 0) /
                property.comparables.length
              : 0,
        },
        additionalWorks: additionalWorksResult.works,
        valuationWeights: incomeValue
          ? { market: 0.5, cost: 0.3, income: 0.2 }
          : { market: 0.7, cost: 0.3 },
        exchangeRate: 1.0, // USD
        propertySnapshot: {
          type: property.type,
          landArea: property.landArea,
          builtArea: property.builtArea,
          yearBuilt: property.yearBuilt,
          conservationState: property.conservationState,
          structureType: property.structureType,
        },
      };

      // ========== GENERATE VALUE JUSTIFICATION ==========
      const justificationPrompt = `You are a professional real estate appraiser writing for a bank valuation report in Ecuador (complying with Superintendencia de Bancos regulations).

Propiedad: ${property.address}, ${property.city}
Tipo de Propiedad: ${property.type}
${property.valuationRequest?.valuationObject ? `Objeto del Avalúo: ${property.valuationRequest.valuationObject}` : ""}
Área Construida: ${property.builtArea || "N/A"} m²
Área de Terreno: ${property.landArea || "N/A"} m²
Año de Construcción: ${property.yearBuilt || "N/A"}
Estado de Conservación: ${property.conservationState || "No especificado"}

RESULTADOS DE LA VALORACIÓN (TODOS LOS VALORES REDONDEADOS AL DÓLAR):
Valor de Mercado (Método de Homologación): $${Math.round(marketValue).toLocaleString("es-EC")}
Valor de Costo (Método de Reposición): $${Math.round(costValue).toLocaleString("es-EC")}
${incomeValue ? `Valor de Renta (Método de Capitalización): $${Math.round(incomeValue).toLocaleString("es-EC")}` : ""}
${cadastralValue ? `Valor Catastral: $${Math.round(cadastralValue).toLocaleString("es-EC")}` : ""}
Valor de Realización: $${Math.round(realizationValue).toLocaleString("es-EC")}
Valor Final del Avalúo: $${Math.round(finalValue).toLocaleString("es-EC")}

DESGLOSE DEL MÉTODO DE COSTO:
- Valor del Terreno: $${Math.round(landValue).toLocaleString("es-EC")} (${property.landArea || 0} m² × $${Math.round(landValuePerM2)}/m²)
- Costo de Construcción Base: $${Math.round(constructionCostBase).toLocaleString("es-EC")} (${property.builtArea || 0} m² × $${Math.round(constructionCostPerM2)}/m²)
- Depreciación (${input.depreciationMethod}): -$${Math.round(depreciationAmount).toLocaleString("es-EC")} (${depreciationResult.depreciationPercent.toFixed(2)}%)
  * Edad Cronológica: ${age} años
  * Vida Útil Total: ${totalUsefulLife} años
  * Vida Útil Remanente: ${depreciationResult.remainingUsefulLife.toFixed(2)} años
- Costo de Construcción Depreciado: $${Math.round(constructionCost).toLocaleString("es-EC")}
${
  additionalWorksResult.totalDepreciatedValue > 0
    ? `- Obras Adicionales: $${Math.round(additionalWorksResult.totalDepreciatedValue).toLocaleString("es-EC")}
  Detalle: ${additionalWorksResult.works.map((w) => `${w.name} ($${Math.round(w.depreciatedValue).toLocaleString("es-EC")})`).join(", ")}`
    : ""
}

${
  property.comparables.length > 0
    ? `ANÁLISIS DE PROPIEDADES COMPARABLES (${property.comparables.length} propiedades):
${property.comparables
  .map(
    (c, i) => `
Comparable ${i + 1}:
- Ubicación: ${c.address}
- Distancia: ${c.distance.toFixed(0)} metros
- Precio de Lista: $${Math.round(c.price).toLocaleString("es-EC")}
- Precio por m²: $${Math.round(c.pricePerM2).toLocaleString("es-EC")}
- Área: ${c.area} m²
- Dormitorios: ${c.bedrooms || "N/A"}, Baños: ${c.bathrooms || "N/A"}
- Año de Construcción: ${c.yearBuilt || "N/A"}
- Ajustes Aplicados:
  * Ubicación: ${(c.locationAdjustment * 100).toFixed(0)}%
  * Tamaño: ${(c.sizeAdjustment * 100).toFixed(0)}%
  * Edad: ${(c.ageAdjustment * 100).toFixed(0)}%
  * Calidad: ${(c.qualityAdjustment * 100).toFixed(0)}%
- Precio Ajustado: $${Math.round(c.adjustedPrice).toLocaleString("es-EC")}
`,
  )
  .join("\n")}

Precio Ajustado Promedio: $${Math.round(avgComparablePrice).toLocaleString("es-EC")}
Rango de Precios: $${Math.round(Math.min(...property.comparables.map((c) => c.adjustedPrice))).toLocaleString("es-EC")} - $${Math.round(Math.max(...property.comparables.map((c) => c.adjustedPrice))).toLocaleString("es-EC")}
`
    : "CONDICIÓN LIMITANTE: Datos limitados de comparables disponibles en el mercado local."
}

${
  incomeValue
    ? `ANÁLISIS DE CAPITALIZACIÓN DE RENTAS:
- Renta Mensual Estimada: $${Math.round(estimatedMonthlyRent || 0).toLocaleString("es-EC")}
- Ingreso Bruto Anual: $${Math.round(annualGrossIncome || 0).toLocaleString("es-EC")}
- Gastos Operativos (${input.operatingExpensesPercent || 25}%): -$${Math.round(operatingExpenses || 0).toLocaleString("es-EC")}
- Ingreso Neto Anual: $${Math.round(annualNetIncome || 0).toLocaleString("es-EC")}
- Tasa de Capitalización: ${capitalizationRate}%
- Valor por Capitalización: $${Math.round(incomeValue).toLocaleString("es-EC")}
`
    : ""
}

INSTRUCCIONES:
Escribe una justificación comprehensiva de 3-4 párrafos explicando:
1. Análisis de las propiedades comparables y cómo apoyan el valor de mercado
2. Discusión de los ajustes realizados a los comparables y su justificación
3. Cómo el método de costo valida o contrasta con el enfoque de mercado
4. Explicación del método de depreciación usado (${input.depreciationMethod}) y su aplicación
${incomeValue ? "5. Análisis del enfoque de capitalización de rentas y su relevancia\n6. " : "5. "}Por qué el valor final fue determinado usando la ponderación específica (${incomeValue ? "50% mercado, 30% costo, 20% renta" : "70% mercado, 30% costo"})
${incomeValue ? "7. " : "6. "}Factores clave que impulsan el valor y factores que afectan el valor de la propiedad
${incomeValue ? "8. " : "7. "}Condiciones actuales del mercado, tendencias y demanda en el área
${incomeValue ? "9. " : "8. "}Factores de riesgo y su impacto en la valoración final
${incomeValue ? "10. " : "9. "}Nivel de confianza en el avalúo y cualquier limitación
${incomeValue ? "11. " : "10. "}Conclusión final apoyando el valor tasado

IMPORTANTE - CUMPLIMIENTO ESTRICTO SBS (Anexo 1, Sección 3.2.5 y Numeral 3.5.6):
- Sé analítico, basado en datos y específico al referenciar las propiedades comparables y los cálculos.
- DECLARA EXPLÍCITAMENTE cualquier suposición o condición limitante utilizada en la valoración.
- Usa frases como: "SUPUESTO: Se asume que...", "CONDICIÓN LIMITANTE: Este avalúo no considera..."
- Todos los valores monetarios mencionados en el texto deben estar REDONDEADOS AL DÓLAR MÁS CERCANO, SIN CENTAVOS.
- Ejemplo correcto: "el valor de mercado de $125,000 se determinó..."
- Ejemplo incorrecto: "el valor de mercado de $125,450.75 se determinó..."
- Menciona explícitamente cualquier limitación en los datos disponibles y cómo esto afecta la confiabilidad del avalúo.
- Si no se proporcionaron comparables suficientes (menos de 3), declara: "CONDICIÓN LIMITANTE: El análisis de mercado se basa en [número] comparables, menos del mínimo recomendado de 3-5 propiedades similares."
- Cumple estrictamente con las normativas de la Superintendencia de Bancos y Seguros (SBS) de Ecuador.

Escribe en español, tono profesional, adecuado para documentación bancaria.`;

      const { text: valueJustification } = await generateText({
        model: google("gemini-3.5-flash"),
        prompt: justificationPrompt,
      });

      // Generate document hash
      const reportData = {
        propertyId: property.id,
        marketValue,
        costValue,
        incomeValue,
        cadastralValue,
        realizationValue,
        finalValue,
        environmentDescription,
        technicalDescription,
        valueJustification,
        parametersSnapshot,
      };
      const documentHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(reportData))
        .digest("hex");

      // Update report
      const updatedReport = await db.valuationReport.update({
        where: { id: report.id },
        data: {
          status: "DRAFT",
          valuationObject:
            property.valuationRequest?.valuationObject || undefined,
          marketValue,
          costValue,
          incomeValue,
          cadastralValue,
          realizationValue,
          finalValue,
          landValue,
          constructionCost,
          additionalWorksCost: additionalWorksResult.totalDepreciatedValue,
          depreciationAmount,
          depreciationMethod: input.depreciationMethod,
          totalUsefulLife,
          remainingUsefulLife: depreciationResult.remainingUsefulLife,
          chronologicalAge: age,
          estimatedMonthlyRent,
          annualGrossIncome,
          operatingExpenses,
          annualNetIncome,
          capitalizationRate,
          parametersSnapshot,
          environmentDescription,
          technicalDescription,
          valueJustification,
          documentHash,
          generatedAt: new Date(),
        },
      });

      // Create audit log
      await db.auditLog.create({
        data: {
          userId,
          action: "REPORT_GENERATED",
          entity: "ValuationReport",
          entityId: report.id,
          propertyId: input.propertyId,
          reportId: report.id,
          metadata: JSON.stringify({
            finalValue,
            depreciationMethod: input.depreciationMethod,
            additionalWorksCount: additionalWorksResult.works.length,
          }),
        },
      });

      return updatedReport;
    } catch (error) {
      console.error("🚨 ERROR FATAL AL GENERAR REPORTE CON IA:", error);
      // Update report status to failed
      await db.valuationReport.update({
        where: { id: report.id },
        data: {
          status: "DRAFT",
        },
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to generate report: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  });

export const getReport = baseProcedure
  .input(
    z.object({
      token: z.string(),
      reportId: z.number(),
    }),
  )
  .query(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const report = await db.valuationReport.findUnique({
      where: { id: input.reportId },
      include: {
        property: {
          include: {
            photos: true,
            comparables: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!report) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Report not found",
      });
    }

    // Verify access
    if (report.userId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user?.role !== "ADMIN" && user?.role !== "SUPERVISOR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }
    }

    return report;
  });

export const getReports = baseProcedure
  .input(
    z.object({
      token: z.string(),
      status: z
        .enum([
          "GENERATING",
          "DRAFT",
          "PENDING", // 👈 Corregido a "PENDING" para coincidir con tu frontend
          "APPROVED",
          "REJECTED",
        ])
        .optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }),
  )
  .query(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const where: any = { userId };
    if (input.status) {
      where.status = input.status;
    }

    const [reports, total] = await Promise.all([
      db.valuationReport.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              address: true,
              city: true,
              type: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      }),
      db.valuationReport.count({ where }),
    ]);

    return { reports, total };
  });

// 🚨 NUEVA FUNCIÓN PARA EL FLUJO DE APROBACIÓN
export const updateReportStatus = baseProcedure
  .input(
    z.object({
      token: z.string(),
      reportId: z.number(),
      status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]),
      rejectionReason: z.string().optional().nullable(),
    }),
  )
  .mutation(async ({ input }) => {
    // 1. Validamos quién es el usuario
    const userId = await getUserIdFromToken(input.token);

    // 2. Actualizamos el estado del reporte y guardamos el comentario si fue rechazado
    const updatedReport = await db.valuationReport.update({
      where: { id: input.reportId },
      data: {
        status: input.status,
        rejectionReason: input.rejectionReason,
      },
    });

    // 3. Dejamos huella en la bitácora de auditoría (Audit Log)
    await db.auditLog.create({
      data: {
        userId,
        action: `REPORT_${input.status}`,
        entity: "ValuationReport",
        entityId: input.reportId,
        reportId: input.reportId,
        metadata: JSON.stringify({ reason: input.rejectionReason }),
      },
    });

    return updatedReport;
  });
// 4. Bandeja de entrada para Supervisores y Administradores
export const getPendingReviews = baseProcedure
  .input(z.object({ token: z.string() }))
  .query(async ({ input }) => {
    // 1. Verificamos quién hace la petición
    const userId = await getUserIdFromToken(input.token);
    const currentUser = await db.user.findUnique({ where: { id: userId } });

    // 2. Bloqueamos a los Peritos normales
    if (currentUser?.role !== "ADMIN" && currentUser?.role !== "SUPERVISOR") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Acceso denegado. Solo Supervisores o Administradores.",
      });
    }

    // 3. Traemos TODOS los reportes pendientes de la empresa
    return db.valuationReport.findMany({
      where: { status: "PENDING" },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            type: true,
            status: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: "asc" }, // Los más antiguos primero (First In, First Out)
    });
  });
