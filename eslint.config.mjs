import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", ".vercel/**", "coverage/**", "playwright-report/**", "src/types/database.generated.ts"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/server/**"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{ name: "@supabase/supabase-js", message: "Supabase hanya boleh diimpor dari src/server." }],
        patterns: [{ group: ["@/server/supabase", "@/server/supabase/*"], message: "Browser dan UI tidak boleh mengakses Supabase." }]
      }]
    }
  }
]);
