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

// Helper to preprocess optional number fields - converts NaN to undefined
const optionalNumber = z.preprocess((val) => {
  if (typeof val === "number" && isNaN(val)) {
    return undefined;
  }
  return val;
}, z.number().optional());

export const createProperty = baseProcedure
  .input(
    z.object({
      token: z.string(),
      // Basic Information
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string().optional(),
      type: z.enum(["HOUSE", "APARTMENT", "COMMERCIAL", "LAND", "INDUSTRIAL"]),
      latitude: z.number(),
      longitude: z.number(),

      // Areas - using optionalNumber to handle NaN
      landArea: optionalNumber,
      builtArea: optionalNumber,
      areaAccordingToDeed: optionalNumber,
      areaOnSite: optionalNumber,

      // Physical Characteristics - using optionalNumber to handle NaN
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

      // Boundaries - using optionalNumber to handle NaN
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

      // ========== SBS COMPLIANCE FIELDS (Anexo 1) ==========
      propertyRegime: z
        .enum(["PRIVATE", "PUBLIC", "COMMUNAL", "HORIZONTAL_PROPERTY"])
        .optional(),
      inspectionDate: z.coerce.date().optional(), // coerce convierte el string que viene del frontend a Date
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

      // Construction Details (existing - mantener para compatibilidad)
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

    const { token, ...propertyData } = input;

    const property = await db.property.create({
      data: {
        ...propertyData,
        userId,
        status: "DRAFT",
      },
    });

    // Create audit log
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

    // Verify ownership
    if (property.userId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user?.role !== "ADMIN" && user?.role !== "SUPERVISOR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to access this property",
        });
      }
    }

    return property;
  });

export const getPropertyStats = baseProcedure
  .input(
    z.object({
      token: z.string(),
    }),
  )
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
        include: {
          _count: {
            select: { photos: true },
          },
        },
      }),
      db.valuationReport.count({
        where: {
          userId,
          status: "APPROVED",
        },
      }),
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
      type: z
        .enum(["HOUSE", "APARTMENT", "COMMERCIAL", "LAND", "INDUSTRIAL"])
        .optional(),

      // Areas - using optionalNumber to handle NaN
      landArea: optionalNumber,
      builtArea: optionalNumber,
      areaAccordingToDeed: optionalNumber,
      areaOnSite: optionalNumber,

      // Physical Characteristics - using optionalNumber to handle NaN
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

      // Boundaries - using optionalNumber to handle NaN
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

      // ========== SBS COMPLIANCE FIELDS (Anexo 1) ==========
      propertyRegime: z
        .enum(["PRIVATE", "PUBLIC", "COMMUNAL", "HORIZONTAL_PROPERTY"])
        .optional(),
      inspectionDate: z.coerce.date().optional(), // coerce convierte el string que viene del frontend a Date
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

      // Construction Details (existing)
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

    // Get existing property
    const existingProperty = await db.property.findUnique({
      where: { id: input.propertyId },
    });

    if (!existingProperty) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Property not found",
      });
    }

    // Verify ownership
    if (existingProperty.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to edit this property",
      });
    }

    // Only allow editing if property is in DRAFT status
    if (existingProperty.status !== "DRAFT") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only properties in DRAFT status can be edited",
      });
    }

    // Update property
    const { token, propertyId, ...updateData } = input;
    const property = await db.property.update({
      where: { id: input.propertyId },
      data: updateData,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: "PROPERTY_UPDATED",
        entity: "Property",
        entityId: property.id,
        propertyId: property.id,
        metadata: JSON.stringify(updateData),
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

    // Only allow deleting DRAFT properties
    if (property.status !== "DRAFT") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only properties in DRAFT status can be deleted",
      });
    }

    await db.property.delete({
      where: { id: input.propertyId },
    });

    // Create audit log
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
          type: z.enum([
            "HOUSE",
            "APARTMENT",
            "COMMERCIAL",
            "LAND",
            "INDUSTRIAL",
          ]),
          latitude: z.number(),
          longitude: z.number(),

          // Areas - using optionalNumber to handle NaN
          landArea: optionalNumber,
          builtArea: optionalNumber,
          areaAccordingToDeed: optionalNumber,
          areaOnSite: optionalNumber,

          // Physical Characteristics - using optionalNumber to handle NaN
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

          // Boundaries - using optionalNumber to handle NaN
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

          // Construction Details (existing)
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

          // Optional: if provided, will update existing property instead of creating new
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
          // Update existing property
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
          // Create new property
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

    // Create audit log
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
