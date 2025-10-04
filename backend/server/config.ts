import { z } from "zod";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform((val) => parseInt(val, 10)).default("5000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
  MAX_FILE_SIZE: z.string().transform((val) => parseInt(val, 10)).default("104857600"), // 100MB
  CLIENT_URL: z.string().url().default("http://localhost:5000"),
  API_URL: z.string().url().default("http://localhost:5000/api"),
  
  // AI Configuration
  GEMINI_API_KEY: z.string().optional(),
  GITHUB_MODELS_API_KEY: z.string().optional(),
  GITHUB_MODELS_ENDPOINT: z.string().url().default("https://models.inference.ai.azure.com"),
  OPENAI_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(["gemini", "github_models", "openai"]).default("gemini"),
  AI_FALLBACK_PROVIDER: z.enum(["gemini", "github_models", "openai"]).default("github_models"),
  AI_MODEL_NAME: z.string().default("gemini-1.5-flash"),
  GITHUB_MODEL_NAME: z.string().default("gpt-4o-mini"),
  AI_MAX_TOKENS: z.string().transform((val) => parseInt(val, 10)).default("1000"),
  AI_TEMPERATURE: z.string().transform((val) => parseFloat(val)).default("0.7"),
});

function getConfig() {
  const result = configSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error("❌ Invalid environment configuration:");
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const config = getConfig();

// Type for the configuration
export type Config = z.infer<typeof configSchema>;
