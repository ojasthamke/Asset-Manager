import { defineConfig } from "drizzle-kit";
import * as fs from "fs";
import * as path from "path";

// Manually load .env if process.env.DATABASE_URL is missing
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const match = envContent.match(/DATABASE_URL=(.*)/);
      if (match && match[1]) {
        process.env.DATABASE_URL = match[1].trim().replace(/['"]/g, "");
      }
    }
  } catch (e) {
    console.error("Error manually reading .env file:", e);
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not found. Please ensure your .env file exists in the project root.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
