import { S3Client } from "@aws-sdk/client-s3";

// Leemos el endpoint. Nota: El formato correcto es https://[tu-id].supabase.co/storage/v1/s3
const endpoint =
  process.env.S3_ENDPOINT ||
  process.env.MINIO_ENDPOINT ||
  "https://qsjumiapnunqsfrkkged.supabase.co/storage/v1/s3";

const isLocal = endpoint.includes("localhost");

export const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: endpoint,
  forcePathStyle: true, // Vital para Supabase
  credentials: {
    // Busca las llaves S3 primero, si no están busca las de MINIO
    accessKeyId:
      process.env.S3_ACCESS_KEY || process.env.MINIO_ACCESS_KEY || "",
    secretAccessKey:
      process.env.S3_SECRET_KEY || process.env.MINIO_SECRET_KEY || "",
  },
});

export const minioBaseUrl = isLocal
  ? "http://localhost:9000"
  : endpoint.replace("/s3", "/object/public");
