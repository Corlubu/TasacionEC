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

export const searchPropertiesNearLocation = baseProcedure
  .input(
    z.object({
      token: z.string(),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radiusKm: z.number().min(0.1).max(100).default(5), // Default 5km radius
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    })
  )
  .query(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    // Use PostGIS to calculate distances
    // ST_Distance calculates distance in degrees, so we convert to meters using ST_DistanceSphere
    // Then filter by radius and sort by distance
    const radiusMeters = input.radiusKm * 1000;

    // Raw SQL query using PostGIS functions
    const properties = await db.$queryRaw<
      Array<{
        id: number;
        userId: number;
        address: string;
        city: string;
        state: string;
        zipCode: string | null;
        type: string;
        status: string;
        latitude: number;
        longitude: number;
        landArea: number | null;
        builtArea: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        floors: number | null;
        yearBuilt: number | null;
        roofMaterial: string | null;
        wallMaterial: string | null;
        floorMaterial: string | null;
        conservationState: string | null;
        legalOwner: string | null;
        cadastralNumber: string | null;
        registrationNumber: string | null;
        hasLiens: boolean;
        hasEncumbrances: boolean;
        createdAt: Date;
        completedAt: Date | null;
        distance: number;
      }>
    >`
      SELECT 
        *,
        ST_DistanceSphere(
          ST_MakePoint(longitude, latitude),
          ST_MakePoint(${input.longitude}, ${input.latitude})
        ) as distance
      FROM "Property"
      WHERE ST_DistanceSphere(
        ST_MakePoint(longitude, latitude),
        ST_MakePoint(${input.longitude}, ${input.latitude})
      ) <= ${radiusMeters}
      ORDER BY distance ASC
      LIMIT ${input.limit}
      OFFSET ${input.offset}
    `;

    // Get total count for pagination
    const countResult = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "Property"
      WHERE ST_DistanceSphere(
        ST_MakePoint(longitude, latitude),
        ST_MakePoint(${input.longitude}, ${input.latitude})
      ) <= ${radiusMeters}
    `;

    const total = Number(countResult[0].count);

    // Get photo counts for each property
    const propertyIds = properties.map((p) => p.id);
    const photoCounts = await db.propertyPhoto.groupBy({
      by: ["propertyId"],
      where: {
        propertyId: { in: propertyIds },
      },
      _count: {
        id: true,
      },
    });

    const photoCountMap = new Map(
      photoCounts.map((pc) => [pc.propertyId, pc._count.id])
    );

    // Enrich properties with photo counts and format distance
    const enrichedProperties = properties.map((property) => ({
      ...property,
      distanceKm: property.distance / 1000, // Convert meters to kilometers
      _count: {
        photos: photoCountMap.get(property.id) || 0,
      },
    }));

    return {
      properties: enrichedProperties,
      total,
      searchLocation: {
        latitude: input.latitude,
        longitude: input.longitude,
      },
      radiusKm: input.radiusKm,
    };
  });
