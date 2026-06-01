import js from "@eslint/js"
import tanstackQuery from "@tanstack/eslint-plugin-query"
import tanstackRouter from "@tanstack/eslint-plugin-router"
import eslintConfigPrettier from "eslint-config-prettier"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import { fileURLToPath } from "node:url"
import tseslint from "typescript-eslint"

const tsconfigRootDir = fileURLToPath(new URL(".", import.meta.url))
const typedConfigs = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: ["**/*.{ts,tsx}"],
}))

export default tseslint.config(
  {
    ignores: [
      "coverage",
      "dist",
      "node_modules",
      "src/bindings.ts",
      "src-tauri/target",
      "src/routeTree.gen.ts",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      sourceType: "module",
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
      sourceType: "commonjs",
    },
  },
  ...typedConfigs,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
      sourceType: "module",
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ...reactRefresh.configs.vite,
  },
  {
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  ...tanstackQuery.configs["flat/recommended"].map((config) => ({
    ...config,
    files: ["src/**/*.{ts,tsx}"],
  })),
  ...tanstackRouter.configs["flat/recommended"].map((config) => ({
    ...config,
    files: ["src/routes/**/*.{ts,tsx}"],
  })),
  eslintConfigPrettier,
)
