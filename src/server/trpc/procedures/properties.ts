import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "../main";
import { db } from "~/server/db";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

// Helper to verify token and get userId
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

// Helper mejorado para procesar campos numéricos
const optionalNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const parsed = Number(val);
  if (isNaN(parsed)) return undefined;
  return parsed;
}, z.number().optional());

// Esquema para los bloques de construcción dinámicos
const constructionBlockSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  area: z.coerce.number(),
  yearBuilt: z.coerce.number(),
  conservationState: z.enum([
    "EXCELLENT",
    "GOOD",
    "REGULAR",
    "POOR",
    "VERY_POOR",
  ]),
  replacementCostPerM2: optionalNumber,
});

export const createProperty = baseProcedure
  .input(
    z.object({
      token: z.string(),
      // Basic Information
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string().optional(),
      parish: z.string().optional(), // 👈 NUEVO
      neighborhood: z.string().optional(), // 👈 NUEVO
      type: z.enum(["HOUSE", "APARTMENT", "COMMERCIAL", "LAND", "INDUSTRIAL"]),
      latitude: z.coerce.number(),
      longitude: z.coerce.number(),

      // Areas
      landArea: optionalNumber,
      builtArea: optionalNumber,
      areaAccordingToDeed: optionalNumber,
      areaOnSite: optionalNumber,

      // Physical Characteristics
      bedrooms: optionalNumber,
      bathrooms: optionalNumber,
      floors: optionalNumber,
      yearBuilt: optionalNumber,
      frontageWidth: optionalNumber,
      topography: z.string().optional(),
      occupancyStatus: z.string().optional(),
      zoning: z.string().optional(),
      parking: optionalNumber,
      amenities: z.array(z.string()).optional(),
      roomDistribution: z.string().optional(), // 👈 NUEVO
      sectorAppreciation: z.string().optional(), // 👈 NUEVO

      // Bloques de Construcción (Dinámicos)
      constructionBlocks: z.array(constructionBlockSchema).optional(), // 👈 NUEVO

      // ========== SBS COMPLIANCE FIELDS ==========
      propertyRegime: z
        .enum(["PRIVATE", "PUBLIC", "COMMUNAL", "HORIZONTAL_PROPERTY"])
        .optional(),
      inspectionDate: z.coerce.date().optional(),
      personPresentAtInspection: z.string().optional(),
      saturationIndex: optionalNumber,
      socioeconomicLevel: z
        .enum(["HIGH", "MEDIUM_HIGH", "MEDIUM", "MEDIUM_LOW", "LOW"])
        .optional(),
      cos: optionalNumber,
      cus: optionalNumber,
      easementsAndRestrictions: z.string().optional(),
      panoramicCharacteristics: z.string().optional(),
      rentableUnits: optionalNumber,
      aliquotPercentage: optionalNumber,
      roofCondition: z.string().optional(),
      fenceCondition: z.string().optional(),
      ceilingCondition: z.string().optional(),
      stairsCondition: z.string().optional(),
      numberOfFacades: optionalNumber,
      hasMaintenanceLogs: z.boolean().optional(),
      maintenanceNotes: z.string().optional(),

      // Boundaries
      northBoundaryLength: optionalNumber,
      northBoundaryAdjacent: z.string().optional(),
      southBoundaryLength: optionalNumber,
      southBoundaryAdjacent: z.string().optional(),
      eastBoundaryLength: optionalNumber,
      eastBoundaryAdjacent: z.string().optional(),
      westBoundaryLength: optionalNumber,
      westBoundaryAdjacent: z.string().optional(),

      // Environment and Services
      zoneClassification: z
        .enum([
          "RESIDENTIAL",
          "COMMERCIAL",
          "MIXED_USE",
          "INDUSTRIAL",
          "AGRICULTURAL",
          "INSTITUTIONAL",
        ])
        .optional(),
      urbanConsolidation: z
        .enum(["CONSOLIDATED", "IN_CONSOLIDATION", "INCIPIENT", "RURAL"])
        .optional(),
      populationDensity: z
        .enum(["HIGH", "MEDIUM", "LOW", "VERY_LOW"])
        .optional(),
      roadType: z
        .enum(["ASPHALT", "CONCRETE", "PAVING_STONES", "DIRT", "GRAVEL"])
        .optional(),
      roadCondition: z.string().optional(),
      sidewalkAvailable: z.boolean().optional(),
      hasPotableWater: z.boolean().optional(),
      hasStormDrainage: z.boolean().optional(),
      hasSanitarySewer: z.boolean().optional(),
      hasElectricityAerial: z.boolean().optional(),
      hasElectricityUnderground: z.boolean().optional(),
      hasTelephone: z.boolean().optional(),
      hasInternet: z.boolean().optional(),
      hasStreetLighting: z.boolean().optional(),
      hasGarbageCollection: z.boolean().optional(),

      // ========== CAMPOS DE SOLICITUD ==========
      financialInstitution: z.string().optional(),
      branchOffice: z.string().optional(),
      creditOfficer: z.string().optional(),
      clientName: z.string().optional(),
      clientId: z.string().optional(),
      clientPhone: z.string().optional(),
      clientEmail: z.string().optional(),
      legalOwnerName: z.string().optional(),
      legalOwnerId: z.string().optional(),
      purpose: z
        .enum([
          "MORTGAGE_LOAN",
          "PURCHASE_SALE",
          "INSURANCE",
          "LEGAL_LITIGATION",
          "INHERITANCE",
          "ASSET_VALUATION",
          "OTHER",
        ])
        .optional(),
      purposeDescription: z.string().optional(),
      valuationObject: z
        .enum([
          "MARKET_VALUE",
          "LIQUIDATION_VALUE",
          "RESCUE_VALUE",
          "SCRAP_VALUE",
        ])
        .optional(),
      requestedLoanAmount: optionalNumber,
      loanTerm: optionalNumber,
      requiredDate: z.string().optional(),

      // Technical Specifications
      foundationType: z
        .enum([
          "ISOLATED_FOOTINGS",
          "CONTINUOUS_FOOTINGS",
          "SLAB_ON_GRADE",
          "PILES",
          "DEEP_FOUNDATION",
          "NONE",
        ])
        .optional(),
      foundationDescription: z.string().optional(),
      structureType: z
        .enum([
          "REINFORCED_CONCRETE",
          "STEEL",
          "WOOD",
          "MASONRY",
          "MIXED",
          "NONE",
        ])
        .optional(),
      structureDescription: z.string().optional(),
      masonryType: z
        .enum([
          "BRICK",
          "CONCRETE_BLOCK",
          "ADOBE",
          "BAHAREQUE",
          "PREFABRICATED_PANELS",
          "NONE",
        ])
        .optional(),
      masonryDescription: z.string().optional(),
      floorType: z
        .enum([
          "REINFORCED_CONCRETE_SLAB",
          "STEEL_BEAMS",
          "WOOD_JOISTS",
          "NONE",
        ])
        .optional(),
      floorDescription: z.string().optional(),
      exteriorCoating: z
        .enum([
          "CERAMIC",
          "PORCELAIN",
          "NATURAL_STONE",
          "PAINT",
          "PLASTER",
          "STUCCO",
          "WALLPAPER",
          "WOOD_PANELING",
          "NONE",
        ])
        .optional(),
      interiorCoating: z
        .enum([
          "CERAMIC",
          "PORCELAIN",
          "NATURAL_STONE",
          "PAINT",
          "PLASTER",
          "STUCCO",
          "WALLPAPER",
          "WOOD_PANELING",
          "NONE",
        ])
        .optional(),
      coatingDescription: z.string().optional(),
      carpentryType: z
        .enum(["WOOD", "ALUMINUM", "PVC", "METAL", "NONE"])
        .optional(),
      carpentryDescription: z.string().optional(),
      locksmithType: z.string().optional(),
      locksmithDescription: z.string().optional(),
      glazingType: z
        .enum([
          "CLEAR_GLASS",
          "TEMPERED_GLASS",
          "LAMINATED_GLASS",
          "DOUBLE_GLAZED",
          "NONE",
        ])
        .optional(),
      glazingDescription: z.string().optional(),
      plumbingType: z
        .enum(["PVC", "COPPER", "GALVANIZED_STEEL", "PEX", "NONE"])
        .optional(),
      plumbingDescription: z.string().optional(),
      electricalType: z
        .enum([
          "CONDUIT",
          "ARMORED_CABLE",
          "NON_METALLIC_CABLE",
          "EXPOSED",
          "NONE",
        ])
        .optional(),
      electricalDescription: z.string().optional(),
      electricalCapacity: z.string().optional(),

      // Construction Details
      roofMaterial: z.string().optional(),
      wallMaterial: z.string().optional(),
      floorMaterial: z.string().optional(),
      conservationState: z
        .enum(["EXCELLENT", "GOOD", "REGULAR", "POOR", "VERY_POOR"])
        .optional(),

      // Legal Information
      legalOwner: z.string().optional(),
      cadastralNumber: z.string().optional(),
      registrationNumber: z.string().optional(),
      hasLiens: z.boolean().optional(),
      hasEncumbrances: z.boolean().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const {
      token,
      financialInstitution,
      branchOffice,
      creditOfficer,
      clientName,
      clientId,
      clientPhone,
      clientEmail,
      legalOwnerName,
      legalOwnerId,
      purpose,
      purposeDescription,
      valuationObject,
      requestedLoanAmount,
      loanTerm,
      requiredDate,
      constructionBlocks, // 👈 Extraemos los bloques
      ...propertyData
    } = input;

    const property = await db.property.create({
      data: {
        ...propertyData,
        userId,
        status: "DRAFT",
        // 👈 Creamos los bloques de construcción si existen
        constructionBlocks:
          constructionBlocks && constructionBlocks.length > 0
            ? {
                create: constructionBlocks.map((block) => ({
                  name: block.name,
                  area: block.area,
                  yearBuilt: block.yearBuilt,
                  conservationState: block.conservationState,
                  replacementCostPerM2: block.replacementCostPerM2,
                })),
              }
            : undefined,
        valuationRequest:
          financialInstitution || clientName || purpose
            ? {
                create: {
                  financialInstitution,
                  branchOffice,
                  creditOfficer,
                  clientName,
                  clientId,
                  clientPhone,
                  clientEmail,
                  legalOwnerName,
                  legalOwnerId,
                  purpose,
                  purposeDescription,
                  valuationObject,
                  requestedLoanAmount,
                  loanTerm,
                  requiredDate: requiredDate
                    ? new Date(requiredDate)
                    : undefined,
                },
              }
            : undefined,
      },
    });

    await db.auditLog.create({
      data: {
        userId,
        action: "PROPERTY_CREATED",
        entity: "Property",
        entityId: property.id,
        propertyId: property.id,
        metadata: JSON.stringify({ address: input.address }),
      },
    });

    return property;
  });

export const getProperties = baseProcedure
  .input(
    z.object({
      token: z.string(),
      status: z
        .enum([
          "DRAFT",
          "IN_PROGRESS",
          "PENDING_REVIEW",
          "COMPLETED",
          "ARCHIVED",
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

    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        include: {
          _count: {
            select: {
              photos: true,
              valuationReports: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      }),
      db.property.count({ where }),
    ]);

    return { properties, total };
  });

export const getProperty = baseProcedure
  .input(
    z.object({
      token: z.string(),
      propertyId: z.number(),
    }),
  )
  .query(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const property = await db.property.findUnique({
      where: { id: input.propertyId },
      include: {
        valuationRequest: true,
        constructionBlocks: true, // 👈 IMPORTANTE: Traemos los bloques para que el Frontend los vea
        photos: {
          orderBy: { createdAt: "desc" },
        },
        comparables: {
          orderBy: { distance: "asc" },
          take: 5,
        },
        valuationReports: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        riskAssessments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        additionalWorks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!property) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Property not found",
      });
    }

    return property;
  });

export const getPropertyStats = baseProcedure
  .input(z.object({ token: z.string() }))
  .query(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const [
      totalProperties,
      inProgress,
      completed,
      recentProperties,
      totalReports,
    ] = await Promise.all([
      db.property.count({ where: { userId } }),
      db.property.count({ where: { userId, status: "IN_PROGRESS" } }),
      db.property.count({ where: { userId, status: "COMPLETED" } }),
      db.property.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { photos: true } } },
      }),
      db.valuationReport.count({ where: { userId, status: "APPROVED" } }),
    ]);

    return {
      totalProperties,
      inProgress,
      completed,
      totalReports,
      recentProperties,
    };
  });

export const updateProperty = baseProcedure
  .input(
    z.object({
      token: z.string(),
      propertyId: z.number(),
      // Basic Information
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      parish: z.string().optional(), // 👈 NUEVO
      neighborhood: z.string().optional(), // 👈 NUEVO
      type: z
        .enum(["HOUSE", "APARTMENT", "COMMERCIAL", "LAND", "INDUSTRIAL"])
        .optional(),
      latitude: z.coerce.number().optional(),
      longitude: z.coerce.number().optional(),

      // Areas
      landArea: optionalNumber,
      builtArea: optionalNumber,
      areaAccordingToDeed: optionalNumber,
      areaOnSite: optionalNumber,

      // Physical Characteristics
      bedrooms: optionalNumber,
      bathrooms: optionalNumber,
      floors: optionalNumber,
      yearBuilt: optionalNumber,
      frontageWidth: optionalNumber,
      topography: z.string().optional(),
      occupancyStatus: z.string().optional(),
      zoning: z.string().optional(),
      parking: optionalNumber,
      amenities: z.array(z.string()).optional(),
      roomDistribution: z.string().optional(), // 👈 NUEVO
      sectorAppreciation: z.string().optional(), // 👈 NUEVO

      // Bloques de Construcción
      constructionBlocks: z.array(constructionBlockSchema).optional(), // 👈 NUEVO

      // ========== SBS COMPLIANCE FIELDS ==========
      propertyRegime: z
        .enum(["PRIVATE", "PUBLIC", "COMMUNAL", "HORIZONTAL_PROPERTY"])
        .optional(),
      inspectionDate: z.coerce.date().optional(),
      personPresentAtInspection: z.string().optional(),
      saturationIndex: optionalNumber,
      socioeconomicLevel: z
        .enum(["HIGH", "MEDIUM_HIGH", "MEDIUM", "MEDIUM_LOW", "LOW"])
        .optional(),
      cos: optionalNumber,
      cus: optionalNumber,
      easementsAndRestrictions: z.string().optional(),
      panoramicCharacteristics: z.string().optional(),
      rentableUnits: optionalNumber,
      aliquotPercentage: optionalNumber,
      roofCondition: z.string().optional(),
      fenceCondition: z.string().optional(),
      ceilingCondition: z.string().optional(),
      stairsCondition: z.string().optional(),
      numberOfFacades: optionalNumber,
      hasMaintenanceLogs: z.boolean().optional(),
      maintenanceNotes: z.string().optional(),

      // Boundaries
      northBoundaryLength: optionalNumber,
      northBoundaryAdjacent: z.string().optional(),
      southBoundaryLength: optionalNumber,
      southBoundaryAdjacent: z.string().optional(),
      eastBoundaryLength: optionalNumber,
      eastBoundaryAdjacent: z.string().optional(),
      westBoundaryLength: optionalNumber,
      westBoundaryAdjacent: z.string().optional(),

      // Environment and Services
      zoneClassification: z
        .enum([
          "RESIDENTIAL",
          "COMMERCIAL",
          "MIXED_USE",
          "INDUSTRIAL",
          "AGRICULTURAL",
          "INSTITUTIONAL",
        ])
        .optional(),
      urbanConsolidation: z
        .enum(["CONSOLIDATED", "IN_CONSOLIDATION", "INCIPIENT", "RURAL"])
        .optional(),
      populationDensity: z
        .enum(["HIGH", "MEDIUM", "LOW", "VERY_LOW"])
        .optional(),
      roadType: z
        .enum(["ASPHALT", "CONCRETE", "PAVING_STONES", "DIRT", "GRAVEL"])
        .optional(),
      roadCondition: z.string().optional(),
      sidewalkAvailable: z.boolean().optional(),
      hasPotableWater: z.boolean().optional(),
      hasStormDrainage: z.boolean().optional(),
      hasSanitarySewer: z.boolean().optional(),
      hasElectricityAerial: z.boolean().optional(),
      hasElectricityUnderground: z.boolean().optional(),
      hasTelephone: z.boolean().optional(),
      hasInternet: z.boolean().optional(),
      hasStreetLighting: z.boolean().optional(),
      hasGarbageCollection: z.boolean().optional(),

      // ========== CAMPOS DE SOLICITUD ==========
      financialInstitution: z.string().optional(),
      branchOffice: z.string().optional(),
      creditOfficer: z.string().optional(),
      clientName: z.string().optional(),
      clientId: z.string().optional(),
      clientPhone: z.string().optional(),
      clientEmail: z.string().optional(),
      legalOwnerName: z.string().optional(),
      legalOwnerId: z.string().optional(),
      purpose: z
        .enum([
          "MORTGAGE_LOAN",
          "PURCHASE_SALE",
          "INSURANCE",
          "LEGAL_LITIGATION",
          "INHERITANCE",
          "ASSET_VALUATION",
          "OTHER",
        ])
        .optional(),
      purposeDescription: z.string().optional(),
      valuationObject: z
        .enum([
          "MARKET_VALUE",
          "LIQUIDATION_VALUE",
          "RESCUE_VALUE",
          "SCRAP_VALUE",
        ])
        .optional(),
      requestedLoanAmount: optionalNumber,
      loanTerm: optionalNumber,
      requiredDate: z.string().optional(),

      // Technical Specifications
      foundationType: z
        .enum([
          "ISOLATED_FOOTINGS",
          "CONTINUOUS_FOOTINGS",
          "SLAB_ON_GRADE",
          "PILES",
          "DEEP_FOUNDATION",
          "NONE",
        ])
        .optional(),
      foundationDescription: z.string().optional(),
      structureType: z
        .enum([
          "REINFORCED_CONCRETE",
          "STEEL",
          "WOOD",
          "MASONRY",
          "MIXED",
          "NONE",
        ])
        .optional(),
      structureDescription: z.string().optional(),
      masonryType: z
        .enum([
          "BRICK",
          "CONCRETE_BLOCK",
          "ADOBE",
          "BAHAREQUE",
          "PREFABRICATED_PANELS",
          "NONE",
        ])
        .optional(),
      masonryDescription: z.string().optional(),
      floorType: z
        .enum([
          "REINFORCED_CONCRETE_SLAB",
          "STEEL_BEAMS",
          "WOOD_JOISTS",
          "NONE",
        ])
        .optional(),
      floorDescription: z.string().optional(),
      exteriorCoating: z
        .enum([
          "CERAMIC",
          "PORCELAIN",
          "NATURAL_STONE",
          "PAINT",
          "PLASTER",
          "STUCCO",
          "WALLPAPER",
          "WOOD_PANELING",
          "NONE",
        ])
        .optional(),
      interiorCoating: z
        .enum([
          "CERAMIC",
          "PORCELAIN",
          "NATURAL_STONE",
          "PAINT",
          "PLASTER",
          "STUCCO",
          "WALLPAPER",
          "WOOD_PANELING",
          "NONE",
        ])
        .optional(),
      coatingDescription: z.string().optional(),
      carpentryType: z
        .enum(["WOOD", "ALUMINUM", "PVC", "METAL", "NONE"])
        .optional(),
      carpentryDescription: z.string().optional(),
      locksmithType: z.string().optional(),
      locksmithDescription: z.string().optional(),
      glazingType: z
        .enum([
          "CLEAR_GLASS",
          "TEMPERED_GLASS",
          "LAMINATED_GLASS",
          "DOUBLE_GLAZED",
          "NONE",
        ])
        .optional(),
      glazingDescription: z.string().optional(),
      plumbingType: z
        .enum(["PVC", "COPPER", "GALVANIZED_STEEL", "PEX", "NONE"])
        .optional(),
      plumbingDescription: z.string().optional(),
      electricalType: z
        .enum([
          "CONDUIT",
          "ARMORED_CABLE",
          "NON_METALLIC_CABLE",
          "EXPOSED",
          "NONE",
        ])
        .optional(),
      electricalDescription: z.string().optional(),
      electricalCapacity: z.string().optional(),

      // Construction Details
      roofMaterial: z.string().optional(),
      wallMaterial: z.string().optional(),
      floorMaterial: z.string().optional(),
      conservationState: z
        .enum(["EXCELLENT", "GOOD", "REGULAR", "POOR", "VERY_POOR"])
        .optional(),

      // Legal Information
      legalOwner: z.string().optional(),
      cadastralNumber: z.string().optional(),
      registrationNumber: z.string().optional(),
      hasLiens: z.boolean().optional(),
      hasEncumbrances: z.boolean().optional(),

      status: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const existingProperty = await db.property.findUnique({
      where: { id: input.propertyId },
    });

    if (!existingProperty || existingProperty.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Property not found or access denied",
      });
    }

    if (existingProperty.status !== "DRAFT") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only DRAFT properties can be edited",
      });
    }

    const {
      token,
      propertyId,
      financialInstitution,
      branchOffice,
      creditOfficer,
      clientName,
      clientId,
      clientPhone,
      clientEmail,
      legalOwnerName,
      legalOwnerId,
      purpose,
      purposeDescription,
      valuationObject,
      requestedLoanAmount,
      loanTerm,
      requiredDate,
      constructionBlocks, // 👈 Extraemos los bloques
      ...updateData
    } = input;

    const cleanedUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined),
    );

    const requestData = Object.fromEntries(
      Object.entries({
        financialInstitution,
        branchOffice,
        creditOfficer,
        clientName,
        clientId,
        clientPhone,
        clientEmail,
        legalOwnerName,
        legalOwnerId,
        purpose,
        purposeDescription,
        valuationObject,
        requestedLoanAmount,
        loanTerm,
        requiredDate: requiredDate ? new Date(requiredDate) : undefined,
      }).filter(([_, v]) => v !== undefined),
    );

    const property = await db.property.update({
      where: { id: input.propertyId },
      data: {
        ...cleanedUpdateData,
        // 👈 Actualizamos los bloques (borramos los viejos y creamos los nuevos para evitar duplicados)
        constructionBlocks: constructionBlocks
          ? {
              deleteMany: {}, // Limpiamos los anteriores
              create: constructionBlocks.map((block) => ({
                name: block.name,
                area: block.area,
                yearBuilt: block.yearBuilt,
                conservationState: block.conservationState,
                replacementCostPerM2: block.replacementCostPerM2,
              })),
            }
          : undefined,
        ...(Object.keys(requestData).length > 0
          ? {
              valuationRequest: {
                upsert: { create: requestData, update: requestData },
              },
            }
          : {}),
      },
    });

    return property;
  });

export const deleteProperty = baseProcedure
  .input(
    z.object({
      token: z.string(),
      propertyId: z.number(),
    }),
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const property = await db.property.findUnique({
      where: { id: input.propertyId },
    });

    if (!property) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Property not found",
      });
    }

    if (property.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to delete this property",
      });
    }

    if (property.status !== "DRAFT") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only properties in DRAFT status can be deleted",
      });
    }

    await db.property.delete({
      where: { id: input.propertyId },
    });

    await db.auditLog.create({
      data: {
        userId,
        action: "PROPERTY_DELETED",
        entity: "Property",
        entityId: property.id,
        metadata: JSON.stringify({ address: property.address }),
      },
    });

    return { success: true };
  });

export const importProperties = baseProcedure
  .input(
    z.object({
      token: z.string(),
      properties: z.array(
        z.object({
          // Basic Information
          address: z.string(),
          city: z.string(),
          state: z.string(),
          zipCode: z.string().optional(),
          parish: z.string().optional(), // 👈 NUEVO AÑADIDO PARA IMPORTACIÓN
          neighborhood: z.string().optional(), // 👈 NUEVO AÑADIDO PARA IMPORTACIÓN
          type: z.enum([
            "HOUSE",
            "APARTMENT",
            "COMMERCIAL",
            "LAND",
            "INDUSTRIAL",
          ]),
          latitude: z.coerce.number(),
          longitude: z.coerce.number(),

          // Areas
          landArea: optionalNumber,
          builtArea: optionalNumber,
          areaAccordingToDeed: optionalNumber,
          areaOnSite: optionalNumber,

          // Physical Characteristics
          bedrooms: optionalNumber,
          bathrooms: optionalNumber,
          floors: optionalNumber,
          yearBuilt: optionalNumber,
          frontageWidth: optionalNumber,
          topography: z.string().optional(),
          occupancyStatus: z.string().optional(),
          zoning: z.string().optional(),
          parking: optionalNumber,
          amenities: z.array(z.string()).optional(),
          roomDistribution: z.string().optional(), // 👈 NUEVO AÑADIDO PARA IMPORTACIÓN
          sectorAppreciation: z.string().optional(), // 👈 NUEVO AÑADIDO PARA IMPORTACIÓN

          // Boundaries
          northBoundaryLength: optionalNumber,
          northBoundaryAdjacent: z.string().optional(),
          southBoundaryLength: optionalNumber,
          southBoundaryAdjacent: z.string().optional(),
          eastBoundaryLength: optionalNumber,
          eastBoundaryAdjacent: z.string().optional(),
          westBoundaryLength: optionalNumber,
          westBoundaryAdjacent: z.string().optional(),

          // Environment and Services
          zoneClassification: z
            .enum([
              "RESIDENTIAL",
              "COMMERCIAL",
              "MIXED_USE",
              "INDUSTRIAL",
              "AGRICULTURAL",
              "INSTITUTIONAL",
            ])
            .optional(),
          urbanConsolidation: z
            .enum(["CONSOLIDATED", "IN_CONSOLIDATION", "INCIPIENT", "RURAL"])
            .optional(),
          populationDensity: z
            .enum(["HIGH", "MEDIUM", "LOW", "VERY_LOW"])
            .optional(),
          roadType: z
            .enum(["ASPHALT", "CONCRETE", "PAVING_STONES", "DIRT", "GRAVEL"])
            .optional(),
          roadCondition: z.string().optional(),
          sidewalkAvailable: z.boolean().optional(),
          hasPotableWater: z.boolean().optional(),
          hasStormDrainage: z.boolean().optional(),
          hasSanitarySewer: z.boolean().optional(),
          hasElectricityAerial: z.boolean().optional(),
          hasElectricityUnderground: z.boolean().optional(),
          hasTelephone: z.boolean().optional(),
          hasInternet: z.boolean().optional(),
          hasStreetLighting: z.boolean().optional(),
          hasGarbageCollection: z.boolean().optional(),

          // Technical Specifications
          foundationType: z
            .enum([
              "ISOLATED_FOOTINGS",
              "CONTINUOUS_FOOTINGS",
              "SLAB_ON_GRADE",
              "PILES",
              "DEEP_FOUNDATION",
              "NONE",
            ])
            .optional(),
          foundationDescription: z.string().optional(),
          structureType: z
            .enum([
              "REINFORCED_CONCRETE",
              "STEEL",
              "WOOD",
              "MASONRY",
              "MIXED",
              "NONE",
            ])
            .optional(),
          structureDescription: z.string().optional(),
          masonryType: z
            .enum([
              "BRICK",
              "CONCRETE_BLOCK",
              "ADOBE",
              "BAHAREQUE",
              "PREFABRICATED_PANELS",
              "NONE",
            ])
            .optional(),
          masonryDescription: z.string().optional(),
          floorType: z
            .enum([
              "REINFORCED_CONCRETE_SLAB",
              "STEEL_BEAMS",
              "WOOD_JOISTS",
              "NONE",
            ])
            .optional(),
          floorDescription: z.string().optional(),
          exteriorCoating: z
            .enum([
              "CERAMIC",
              "PORCELAIN",
              "NATURAL_STONE",
              "PAINT",
              "PLASTER",
              "STUCCO",
              "WALLPAPER",
              "WOOD_PANELING",
              "NONE",
            ])
            .optional(),
          interiorCoating: z
            .enum([
              "CERAMIC",
              "PORCELAIN",
              "NATURAL_STONE",
              "PAINT",
              "PLASTER",
              "STUCCO",
              "WALLPAPER",
              "WOOD_PANELING",
              "NONE",
            ])
            .optional(),
          coatingDescription: z.string().optional(),
          carpentryType: z
            .enum(["WOOD", "ALUMINUM", "PVC", "METAL", "NONE"])
            .optional(),
          carpentryDescription: z.string().optional(),
          locksmithType: z.string().optional(),
          locksmithDescription: z.string().optional(),
          glazingType: z
            .enum([
              "CLEAR_GLASS",
              "TEMPERED_GLASS",
              "LAMINATED_GLASS",
              "DOUBLE_GLAZED",
              "NONE",
            ])
            .optional(),
          glazingDescription: z.string().optional(),
          plumbingType: z
            .enum(["PVC", "COPPER", "GALVANIZED_STEEL", "PEX", "NONE"])
            .optional(),
          plumbingDescription: z.string().optional(),
          electricalType: z
            .enum([
              "CONDUIT",
              "ARMORED_CABLE",
              "NON_METALLIC_CABLE",
              "EXPOSED",
              "NONE",
            ])
            .optional(),
          electricalDescription: z.string().optional(),
          electricalCapacity: z.string().optional(),

          // Construction Details
          roofMaterial: z.string().optional(),
          wallMaterial: z.string().optional(),
          floorMaterial: z.string().optional(),
          conservationState: z
            .enum(["EXCELLENT", "GOOD", "REGULAR", "POOR", "VERY_POOR"])
            .optional(),

          // Legal Information
          legalOwner: z.string().optional(),
          cadastralNumber: z.string().optional(),
          registrationNumber: z.string().optional(),
          hasLiens: z.boolean().optional(),
          hasEncumbrances: z.boolean().optional(),

          existingPropertyId: optionalNumber,
        }),
      ),
    }),
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as { index: number; error: string; address: string }[],
    };

    for (let i = 0; i < input.properties.length; i++) {
      const propertyData = input.properties[i];

      try {
        if (propertyData.existingPropertyId) {
          const existing = await db.property.findUnique({
            where: { id: propertyData.existingPropertyId },
          });

          if (!existing) {
            results.failed++;
            results.errors.push({
              index: i,
              error: "Property not found",
              address: propertyData.address,
            });
            continue;
          }

          if (existing.userId !== userId) {
            results.failed++;
            results.errors.push({
              index: i,
              error: "Access denied",
              address: propertyData.address,
            });
            continue;
          }

          if (existing.status !== "DRAFT") {
            results.failed++;
            results.errors.push({
              index: i,
              error: "Only DRAFT properties can be updated",
              address: propertyData.address,
            });
            continue;
          }

          const { existingPropertyId, ...updateData } = propertyData;
          await db.property.update({
            where: { id: propertyData.existingPropertyId },
            data: updateData,
          });

          results.updated++;
        } else {
          const { existingPropertyId, ...createData } = propertyData;
          await db.property.create({
            data: {
              ...createData,
              userId,
              status: "DRAFT",
            },
          });

          results.created++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error.message || "Unknown error",
          address: propertyData.address,
        });
      }
    }

    await db.auditLog.create({
      data: {
        userId,
        action: "PROPERTIES_IMPORTED",
        entity: "Property",
        entityId: 0,
        metadata: JSON.stringify(results),
      },
    });

    return results;
  });
