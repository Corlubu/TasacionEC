import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

// En Supabase, el endpoint suele ser: https://[tu-id].supabase.co/storage/v1/s3
const endpoint =
  process.env.MINIO_ENDPOINT ||
  "https://qsjumiapnunqsfrkkged.storage.supabase.co/storage/v1/s3";

// Si el endpoint contiene 'localhost', forzamos ciertas configuraciones para desarrollo local
const isLocal = endpoint.includes("localhost");

export const s3Client = new S3Client({
  region: "us-east-1", // Región por defecto (Supabase la ignora pero AWS la requiere)
  endpoint: endpoint,
  forcePathStyle: true, // Vital para Supabase y MinIO local
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "admin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || env.ADMIN_PASSWORD,
  },
});

// Exportamos la URL base pública para que el frontend pueda ver las fotos
export const minioBaseUrl = isLocal
  ? "http://localhost:9000"
  : // Si es Supabase, la URL pública es diferente a la de la API S3
    endpoint.replace("/s3", "/object/public");
