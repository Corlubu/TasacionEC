import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "../main";
import { db } from "~/server/db";
import { minioClient, minioBaseUrl } from "~/server/minio";
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

export const generateUploadUrl = baseProcedure
  .input(
    z.object({
      token: z.string(),
      propertyId: z.number(),
      fileName: z.string(),
      fileType: z.string(),
      category: z.enum(["facade", "interior", "kitchen", "bathroom", "damage", "document"]),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    // Verify property ownership
    const property = await db.property.findUnique({
      where: { id: input.propertyId },
    });

    if (!property || property.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Property not found or access denied",
      });
    }

    // Generate unique object key
    const timestamp = Date.now();
    const objectKey = `property-${input.propertyId}/${timestamp}-${input.fileName}`;

    // Generate presigned URL (valid for 10 minutes)
    const uploadUrl = await minioClient.presignedPutObject(
      "property-photos",
      objectKey,
      600
    );

    return {
      uploadUrl,
      objectKey,
    };
  });

export const confirmPhotoUpload = baseProcedure
  .input(
    z.object({
      token: z.string(),
      propertyId: z.number(),
      objectKey: z.string(),
      category: z.string(),
      caption: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      timestamp: z.string().optional(),
      deviceInfo: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    // Verify property ownership
    const property = await db.property.findUnique({
      where: { id: input.propertyId },
    });

    if (!property || property.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Property not found or access denied",
      });
    }

    // Generate permanent URL
    const url = `${minioBaseUrl}/property-photos/${input.objectKey}`;

    // Save photo metadata
    const photo = await db.propertyPhoto.create({
      data: {
        propertyId: input.propertyId,
        minioKey: input.objectKey,
        url,
        category: input.category,
        caption: input.caption,
        latitude: input.latitude,
        longitude: input.longitude,
        timestamp: input.timestamp ? new Date(input.timestamp) : null,
        deviceInfo: input.deviceInfo,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: "PHOTO_UPLOADED",
        entity: "PropertyPhoto",
        entityId: photo.id,
        propertyId: input.propertyId,
        metadata: JSON.stringify({ category: input.category }),
      },
    });

    return photo;
  });

export const getPropertyPhotos = baseProcedure
  .input(
    z.object({
      token: z.string(),
      propertyId: z.number(),
    })
  )
  .query(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    // Verify property ownership
    const property = await db.property.findUnique({
      where: { id: input.propertyId },
    });

    if (!property || property.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Property not found or access denied",
      });
    }

    const photos = await db.propertyPhoto.findMany({
      where: { propertyId: input.propertyId },
      orderBy: { createdAt: "desc" },
    });

    return photos;
  });

export const generateBatchUploadUrls = baseProcedure
  .input(
    z.object({
      token: z.string(),
      propertyId: z.number(),
      files: z.array(
        z.object({
          fileName: z.string(),
          fileType: z.string(),
          category: z.enum(["facade", "interior", "kitchen", "bathroom", "damage", "document"]),
        })
      ).min(1).max(20),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    // Verify property ownership
    const property = await db.property.findUnique({
      where: { id: input.propertyId },
      include: {
        photos: true,
      },
    });

    if (!property || property.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Property not found or access denied",
      });
    }

    // Check photo count limits (5-20 total)
    const currentPhotoCount = property.photos.length;
    const newPhotoCount = currentPhotoCount + input.files.length;

    if (newPhotoCount > 20) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot upload ${input.files.length} photos. Maximum is 20 photos per property. Current count: ${currentPhotoCount}`,
      });
    }

    // Generate presigned URLs for all files
    const uploadUrls = await Promise.all(
      input.files.map(async (file) => {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const objectKey = `property-${input.propertyId}/${timestamp}-${randomId}-${file.fileName}`;

        const uploadUrl = await minioClient.presignedPutObject(
          "property-photos",
          objectKey,
          600
        );

        return {
          fileName: file.fileName,
          category: file.category,
          uploadUrl,
          objectKey,
        };
      })
    );

    return {
      uploadUrls,
      currentPhotoCount,
      newTotalCount: newPhotoCount,
    };
  });

export const deletePropertyPhoto = baseProcedure
  .input(
    z.object({
      token: z.string(),
      photoId: z.number(),
    })
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    // Get photo with property info
    const photo = await db.propertyPhoto.findUnique({
      where: { id: input.photoId },
      include: {
        property: true,
      },
    });

    if (!photo) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Photo not found",
      });
    }

    // Verify ownership
    if (photo.property.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied",
      });
    }

    // Only allow deleting photos if property is in DRAFT status
    if (photo.property.status !== "DRAFT") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Photos can only be deleted when property is in DRAFT status",
      });
    }

    // Delete from database
    await db.propertyPhoto.delete({
      where: { id: input.photoId },
    });

    // Optionally delete from MinIO (commented out to preserve data)
    // try {
    //   await minioClient.removeObject("property-photos", photo.minioKey);
    // } catch (error) {
    //   console.error("Error deleting from MinIO:", error);
    // }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        action: "PHOTO_DELETED",
        entity: "PropertyPhoto",
        entityId: photo.id,
        propertyId: photo.propertyId,
        metadata: JSON.stringify({ category: photo.category }),
      },
    });

    return { success: true };
  });
