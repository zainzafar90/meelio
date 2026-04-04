/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/server.js"],
  ignorePatterns: [".eslintrc.js"],
  globals: {
    chrome: "readonly",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  rules: {
    "no-unused-vars": "off",
  },
};
