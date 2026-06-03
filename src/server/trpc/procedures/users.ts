import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "../main";
import { db } from "~/server/db";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";
import bcrypt from "bcrypt";

// 🚨 VALIDADOR ESTRICTO DE ADMINISTRADOR
async function verifyAdmin(token: string): Promise<number> {
  try {
    const verified = jwt.verify(token, env.JWT_SECRET) as { userId: number };
    const user = await db.user.findUnique({ where: { id: verified.userId } });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    if (user.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Acceso denegado. Solo los Administradores pueden ver esta sección.",
      });
    }

    return user.id;
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Token inválido o expirado",
    });
  }
}

// 1. Obtener la lista de todos los usuarios
export const getUsers = baseProcedure
  .input(z.object({ token: z.string() }))
  .query(async ({ input }) => {
    await verifyAdmin(input.token);

    return db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { properties: true, valuationReports: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  });

// 2. Actualizar el rol de un usuario
export const updateUserRole = baseProcedure
  .input(
    z.object({
      token: z.string(),
      userId: z.number(),
      role: z.enum(["APPRAISER", "SUPERVISOR", "ADMIN"]),
    }),
  )
  .mutation(async ({ input }) => {
    const adminId = await verifyAdmin(input.token);

    // Evitar que el admin se quite los permisos a sí mismo por accidente
    if (adminId === input.userId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No puedes cambiar tu propio rol por seguridad.",
      });
    }

    const updatedUser = await db.user.update({
      where: { id: input.userId },
      data: { role: input.role },
    });

    // Dejamos huella en la bitácora
    await db.auditLog.create({
      data: {
        userId: adminId,
        action: "USER_ROLE_UPDATED",
        entity: "User",
        entityId: input.userId,
        metadata: JSON.stringify({
          newRole: input.role,
          targetUser: updatedUser.email,
        }),
      },
    });

    return { success: true, role: updatedUser.role };
  });

export const createUser = baseProcedure
  .input(
    z.object({
      token: z.string(),
      name: z.string().min(2, "El nombre es muy corto"),
      email: z.string().email("Correo electrónico inválido"),
      password: z
        .string()
        .min(6, "La contraseña debe tener al menos 6 caracteres"),
      role: z.enum(["APPRAISER", "SUPERVISOR", "ADMIN"]).default("APPRAISER"),
    }),
  )
  .mutation(async ({ input }) => {
    // 1. Verificamos que quien pide esto sea un ADMIN
    const adminId = await verifyAdmin(input.token);

    // 2. Verificamos que el correo no esté registrado ya
    const existingUser = await db.user.findUnique({
      where: { email: input.email },
    });
    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Ya existe un usuario registrado con este correo electrónico.",
      });
    }

    // 3. Encriptamos la contraseña por seguridad
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // 4. Creamos al usuario
    const newUser = await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role,
      },
    });

    // 5. Dejamos huella en la bitácora de auditoría
    await db.auditLog.create({
      data: {
        userId: adminId,
        action: "USER_CREATED",
        entity: "User",
        entityId: newUser.id,
        metadata: JSON.stringify({ email: newUser.email, role: newUser.role }),
      },
    });

    return { success: true, user: { id: newUser.id, email: newUser.email } };
  });
