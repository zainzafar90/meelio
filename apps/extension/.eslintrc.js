/** @type {import("eslint").Linter.Config} */

module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    "@repo/eslint-config/react-internal.js",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  globals: {
    chrome: "readonly",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.eslint.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["react-refresh"],
  rules: {
    "no-unused-vars": "off",
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
};
