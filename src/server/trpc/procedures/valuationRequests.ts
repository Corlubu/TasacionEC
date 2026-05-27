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

export const createValuationRequest = baseProcedure
  .input(
    z.object({
      token: z.string(),
      propertyId: z.number(),
      
      // Requesting Entity
      financialInstitution: z.string(),
      branchOffice: z.string().optional(),
      creditOfficer: z.string(),
      
      // Client Information
      clientName: z.string(),
      clientId: z.string(), // Cédula/RUC
      clientPhone: z.string().optional(),
      clientEmail: z.string().email().optional(),
      
      // Legal Owner
      legalOwnerName: z.string(),
      legalOwnerId: z.string(), // Cédula/RUC
      
      // Purpose
      purpose: z.enum([
        "MORTGAGE_LOAN",
        "PURCHASE_SALE",
        "INSURANCE",
        "LEGAL_LITIGATION",
        "INHERITANCE",
        "ASSET_VALUATION",
        "OTHER",
      ]),
      purposeDescription: z.string().optional(),
      
      // Loan Information
      requestedLoanAmount: z.number().optional(),
      loanTerm: z.number().optional(), // months
      
      // Request Metadata
      requiredDate: z.string().datetime().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    // Verify property exists and user has access
    const property = await db.property.findUnique({
      where: { id: input.propertyId },
      include: { valuationRequest: true },
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

    // Check if valuation request already exists
    if (property.valuationRequest) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Valuation request already exists for this property",
      });
    }

    const { token, propertyId, requiredDate, ...requestData } = input;

    const valuationRequest = await db.valuationRequest.create({
      data: {
        ...requestData,
        propertyId,
        requiredDate: requiredDate ? new Date(requiredDate) : undefined,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: "VALUATION_REQUEST_CREATED",
        entity: "ValuationRequest",
        entityId: valuationRequest.id,
        propertyId,
        metadata: JSON.stringify({
          financialInstitution: input.financialInstitution,
          purpose: input.purpose,
        }),
      },
    });

    return valuationRequest;
  });

export const getValuationRequest = baseProcedure
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
      include: { valuationRequest: true },
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

    if (!property.valuationRequest) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Valuation request not found for this property",
      });
    }

    return property.valuationRequest;
  });

export const updateValuationRequest = baseProcedure
  .input(
    z.object({
      token: z.string(),
      propertyId: z.number(),
      
      // Requesting Entity
      financialInstitution: z.string().optional(),
      branchOffice: z.string().optional(),
      creditOfficer: z.string().optional(),
      
      // Client Information
      clientName: z.string().optional(),
      clientId: z.string().optional(),
      clientPhone: z.string().optional(),
      clientEmail: z.string().email().optional(),
      
      // Legal Owner
      legalOwnerName: z.string().optional(),
      legalOwnerId: z.string().optional(),
      
      // Purpose
      purpose: z.enum([
        "MORTGAGE_LOAN",
        "PURCHASE_SALE",
        "INSURANCE",
        "LEGAL_LITIGATION",
        "INHERITANCE",
        "ASSET_VALUATION",
        "OTHER",
      ]).optional(),
      purposeDescription: z.string().optional(),
      
      // Loan Information
      requestedLoanAmount: z.number().optional(),
      loanTerm: z.number().optional(),
      
      // Request Metadata
      requiredDate: z.string().datetime().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const property = await db.property.findUnique({
      where: { id: input.propertyId },
      include: { valuationRequest: true },
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

    if (!property.valuationRequest) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Valuation request not found",
      });
    }

    const { token, propertyId, requiredDate, ...updateData } = input;

    const updatedRequest = await db.valuationRequest.update({
      where: { propertyId: input.propertyId },
      data: {
        ...updateData,
        requiredDate: requiredDate ? new Date(requiredDate) : undefined,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: "VALUATION_REQUEST_UPDATED",
        entity: "ValuationRequest",
        entityId: updatedRequest.id,
        propertyId,
        metadata: JSON.stringify(updateData),
      },
    });

    return updatedRequest;
  });

export const deleteValuationRequest = baseProcedure
  .input(
    z.object({
      token: z.string(),
      propertyId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const property = await db.property.findUnique({
      where: { id: input.propertyId },
      include: { valuationRequest: true },
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

    if (!property.valuationRequest) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Valuation request not found",
      });
    }

    await db.valuationRequest.delete({
      where: { propertyId: input.propertyId },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: "VALUATION_REQUEST_DELETED",
        entity: "ValuationRequest",
        entityId: property.valuationRequest.id,
        propertyId: input.propertyId,
      },
    });

    return { success: true };
  });
