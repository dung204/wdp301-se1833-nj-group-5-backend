// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'webpack-hmr.config.js'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    ignores: ['.husky/install.mjs'],
    rules: {
      'no-console': [
        'error',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  }, // No console.log()
  {
    ignores: ['.husky/install.mjs'],
    rules: {
      'no-console': [
        'error',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },

  // No console.log()
  {
    ignores: ['.husky/install.mjs'],
    rules: {
      'no-console': [
        'error',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },

  // Only use camelCase as naming convention
  {
    rules: {
      camelcase: [
        'error',
        {
          properties: 'never',
          ignoreDestructuring: true,
          ignoreImports: true,
          ignoreGlobals: true,
        },
      ],
    },
  },

  // No default exports (i.e. export default function Foo() {})
  {
    ignores: ['*.config.*'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Use named exports instead (i.e. export const foo = ...)',
        },
      ],
    },
  },
);
