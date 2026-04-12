// name=eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  // For Next.js 15, using flat config format
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "node_modules/**",
      ".git/**",
    ],
  },
  // Basic JavaScript/TypeScript rules
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-console": "warn",
      "no-unused-vars": "off", // TypeScript handles this
    },
  },
]);

export default eslintConfig;