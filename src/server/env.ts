import { z } from "zod";

// Cargar el archivo .env de forma nativa (Soportado en Node >= 20.12)
// Usamos un try/catch por si el archivo no existe (como pasaría en producción)
try {
  process.loadEnvFile();
} catch (error) {
  // Ignoramos el error, asumimos que las variables ya están inyectadas en el sistema
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  BASE_URL: z.string().optional(),
  BASE_URL_OTHER_PORT: z.string().optional(),
  ADMIN_PASSWORD: z.string(),
  JWT_SECRET: z.string(),
  OPENAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
