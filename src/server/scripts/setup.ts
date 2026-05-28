import { db } from "../db";
import bcryptjs from "bcryptjs";
import { env } from "../env";

async function setup() {
  console.log("Iniciando configuración de la base de datos...");

  // NOTA ARQUITECTÓNICA:
  // La creación de Buckets (property-photos, legal-documents, reports)
  // y sus políticas de acceso público ahora se gestionan directamente
  // desde el Dashboard de Supabase Storage.

  // 1. Crear el usuario administrador por defecto
  const adminEmail = "admin@tasacionec.com";
  try {
    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcryptjs.hash(env.ADMIN_PASSWORD, 10);
      await db.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: "Administrator",
          role: "ADMIN",
        },
      });
      console.log(`✅ Usuario administrador creado: ${adminEmail}`);
    } else {
      console.log(`ℹ️ El usuario administrador ya existe.`);
    }
  } catch (error) {
    console.error(
      "❌ Error verificando/creando el usuario administrador:",
      error,
    );
  }

  // 2. Configurar PostGIS y los índices espaciales
  try {
    // Activar extensión PostGIS (Si ya está activa en Supabase, no hará nada)
    await db.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    console.log("✅ Extensión PostGIS habilitada");

    // Crear índice espacial GIST para consultas eficientes de radio/distancia
    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS prop_geo_idx
      ON "Property"
      USING GIST (ST_MakePoint(longitude, latitude));
    `);
    console.log(
      "✅ Índice espacial GIST creado para geolocalización de propiedades",
    );
  } catch (error) {
    console.error("❌ Error configurando PostGIS:", error);
  }
}

setup()
  .then(() => {
    console.log("🎉 setup.ts completado con éxito.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error fatal en setup.ts:", error);
    process.exit(1);
  });
