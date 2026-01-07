import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";
import babelParser from "@babel/eslint-parser";

export default [
  {
    ignores: ["dist", "node_modules"], // Ignore unnecessary files
  },
  {
    files: ["**/*.{js,jsx}"],
    ignores: ["**/*.test.js", "**/*.test.jsx", "**/__tests__/**"],
  },
  {
    files: [
      "**/hooks/useTimeout.js",
      "**/hooks/useInterval.js",
      "**/hooks/useDelayedCallback.js",
    ],
    rules: {
      "no-restricted-globals": "off", // These hooks intentionally use setTimeout/setInterval
    },
  },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
      parser: babelParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"],
        },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
      prettier, // Prettier Plugin for Formatting
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // React Rules
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": [
        "warn",
        {
          ignore: [],
          customValidators: [],
          skipUndeclared: false,
        },
      ],
      "react/display-name": "warn",
      "react/no-unescaped-entities": "warn",
      "react/no-unused-prop-types": "warn",

      // React Hooks Rules - Enhanced
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": [
        "warn",
        {
          additionalHooks: "(useTimeout|useInterval|useDelayedCallback)",
        },
      ],

      // Cleanup Rules - Warn about potential memory leaks
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^[A-Z_]",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Accessibility Rules - Critical
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/heading-has-content": "warn",
      "jsx-a11y/iframe-has-title": "warn",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/no-access-key": "warn",

      // Code Quality Rules
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "prettier/prettier": "error",

      // Warn about setTimeout/setInterval without cleanup
      "no-restricted-globals": [
        "warn",
        {
          name: "setTimeout",
          message:
            "Consider using useTimeout hook for proper cleanup. If you must use setTimeout directly, ensure it's cleaned up in useEffect return.",
        },
        {
          name: "setInterval",
          message:
            "Consider using useInterval hook for proper cleanup. If you must use setInterval directly, ensure it's cleaned up in useEffect return.",
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  eslintConfigPrettier,
];
