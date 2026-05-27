import { z } from "zod";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "../main";
import { db } from "~/server/db";
import { env } from "~/server/env";

export const signup = baseProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(input.password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: "APPRAISER",
      },
    });

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: "30d",
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  });

export const login = baseProcedure
  .input(
    z.object({
      email: z.string().email(),
      password: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    // Find user
    const user = await db.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Verify password
    const valid = await bcryptjs.compare(input.password, user.password);

    if (!valid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: "30d",
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  });

export const getCurrentUser = baseProcedure
  .input(
    z.object({
      token: z.string(),
    })
  )
  .query(async ({ input }) => {
    try {
      const verified = jwt.verify(input.token, env.JWT_SECRET);
      const parsed = z.object({ userId: z.number() }).parse(verified);

      const user = await db.user.findUnique({
        where: { id: parsed.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired token",
      });
    }
  });
