import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "../main";
import { db } from "~/server/db";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";

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

/**
 * Calculate depreciation for additional works
 */
function calculateAdditionalWorkDepreciation(
  replacementCost: number,
  yearBuilt: number | null,
  conservationState: string | null
): { depreciationPercent: number; depreciatedValue: number } {
  if (!yearBuilt || !conservationState) {
    // No depreciation if we don't have age or state
    return {
      depreciationPercent: 0,
      depreciatedValue: replacementCost,
    };
  }

  const age = new Date().getFullYear() - yearBuilt;
  
  // State factors for depreciation
  const stateFactors: Record<string, number> = {
    EXCELLENT: 0.05,  // 5% depreciation
    GOOD: 0.15,       // 15% depreciation
    REGULAR: 0.30,    // 30% depreciation
    POOR: 0.50,       // 50% depreciation
    VERY_POOR: 0.70,  // 70% depreciation
  };

  const stateFactor = stateFactors[conservationState] || 0.30;
  
  // Calculate age-based depreciation (2% per year, max 50%)
  const ageDepreciation = Math.min(age * 0.02, 0.50);
  
  // Combined depreciation
  const totalDepreciation = Math.min(ageDepreciation + stateFactor, 0.90); // Max 90%
  const depreciationPercent = totalDepreciation * 100;
  const depreciatedValue = replacementCost * (1 - totalDepreciation);

  return {
    depreciationPercent: Math.round(depreciationPercent * 100) / 100,
    depreciatedValue: Math.round(depreciatedValue * 100) / 100,
  };
}

export const createAdditionalWork = baseProcedure
  .input(
    z.object({
      token: z.string(),
      propertyId: z.number(),
      
      name: z.string(),
      description: z.string().optional(),
      category: z.string(), // "POOL", "PERGOLA", "DOMOTICS", "FENCE", "GARDEN", "GARAGE", "OTHER"
      
      area: z.number().optional(),
      yearBuilt: z.number().optional(),
      
      replacementCost: z.number(),
      conservationState: z.enum(["EXCELLENT", "GOOD", "REGULAR", "POOR", "VERY_POOR"]).optional(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    // Verify property exists and user has access
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
        message: "Access denied",
      });
    }

    // Calculate depreciation
    const { depreciationPercent, depreciatedValue } = calculateAdditionalWorkDepreciation(
      input.replacementCost,
      input.yearBuilt || null,
      input.conservationState || null
    );

    const { token, propertyId, ...workData } = input;

    const additionalWork = await db.additionalWork.create({
      data: {
        ...workData,
        propertyId,
        depreciationPercent,
        depreciatedValue,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: "ADDITIONAL_WORK_CREATED",
        entity: "AdditionalWork",
        entityId: additionalWork.id,
        propertyId,
        metadata: JSON.stringify({
          name: input.name,
          category: input.category,
          replacementCost: input.replacementCost,
          depreciatedValue,
        }),
      },
    });

    return additionalWork;
  });

export const getAdditionalWorks = baseProcedure
  .input(
    z.object({
      token: z.string(),
      propertyId: z.number(),
    })
  )
  .query(async ({ input }) => {
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

    // Verify access
    if (property.userId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user?.role !== "ADMIN" && user?.role !== "SUPERVISOR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }
    }

    const additionalWorks = await db.additionalWork.findMany({
      where: { propertyId: input.propertyId },
      orderBy: { createdAt: "desc" },
    });

    return additionalWorks;
  });

export const getAdditionalWork = baseProcedure
  .input(
    z.object({
      token: z.string(),
      workId: z.number(),
    })
  )
  .query(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const additionalWork = await db.additionalWork.findUnique({
      where: { id: input.workId },
      include: { property: true },
    });

    if (!additionalWork) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Additional work not found",
      });
    }

    // Verify access
    if (additionalWork.property.userId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user?.role !== "ADMIN" && user?.role !== "SUPERVISOR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }
    }

    return additionalWork;
  });

export const updateAdditionalWork = baseProcedure
  .input(
    z.object({
      token: z.string(),
      workId: z.number(),
      
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      
      area: z.number().optional(),
      yearBuilt: z.number().optional(),
      
      replacementCost: z.number().optional(),
      conservationState: z.enum(["EXCELLENT", "GOOD", "REGULAR", "POOR", "VERY_POOR"]).optional(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const existingWork = await db.additionalWork.findUnique({
      where: { id: input.workId },
      include: { property: true },
    });

    if (!existingWork) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Additional work not found",
      });
    }

    if (existingWork.property.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied",
      });
    }

    const { token, workId, ...updateData } = input;

    // Recalculate depreciation if relevant fields changed
    let depreciationUpdate = {};
    if (
      input.replacementCost !== undefined ||
      input.yearBuilt !== undefined ||
      input.conservationState !== undefined
    ) {
      const replacementCost = input.replacementCost ?? existingWork.replacementCost;
      const yearBuilt = input.yearBuilt ?? existingWork.yearBuilt;
      const conservationState = input.conservationState ?? existingWork.conservationState;

      const { depreciationPercent, depreciatedValue } = calculateAdditionalWorkDepreciation(
        replacementCost,
        yearBuilt,
        conservationState
      );

      depreciationUpdate = {
        depreciationPercent,
        depreciatedValue,
      };
    }

    const updatedWork = await db.additionalWork.update({
      where: { id: input.workId },
      data: {
        ...updateData,
        ...depreciationUpdate,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: "ADDITIONAL_WORK_UPDATED",
        entity: "AdditionalWork",
        entityId: updatedWork.id,
        propertyId: existingWork.propertyId,
        metadata: JSON.stringify(updateData),
      },
    });

    return updatedWork;
  });

export const deleteAdditionalWork = baseProcedure
  .input(
    z.object({
      token: z.string(),
      workId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const additionalWork = await db.additionalWork.findUnique({
      where: { id: input.workId },
      include: { property: true },
    });

    if (!additionalWork) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Additional work not found",
      });
    }

    if (additionalWork.property.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied",
      });
    }

    await db.additionalWork.delete({
      where: { id: input.workId },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: "ADDITIONAL_WORK_DELETED",
        entity: "AdditionalWork",
        entityId: additionalWork.id,
        propertyId: additionalWork.propertyId,
        metadata: JSON.stringify({
          name: additionalWork.name,
          category: additionalWork.category,
        }),
      },
    });

    return { success: true };
  });
