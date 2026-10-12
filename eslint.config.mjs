import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import json from '@eslint/json';

export default [
    {
        ignores: ['dist', 'node_modules'],
    },
    {
        files: ['**/*.ts', '**/*.tsx', '**/*.mjs'],
        languageOptions: {
            parser: tsParser,
        },
        plugins: {
            '@typescript-eslint': ts,
            prettier: prettierPlugin,
        },
        rules: {
            ...ts.configs.recommended.rules,
            'prettier/prettier': 'error', // Prettier runs as ESLint rule
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/triple-slash-reference': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            indent: ['error', 4],
            '@typescript-eslint/indent': ['error', 4],
        },
    },
    {
        plugins: {
            json,
        },
        files: ['**/*.json'],
        language: 'json/json',
        rules: {
            'json/no-duplicate-keys': 'error',
        },
    },
    prettierConfig, // disables conflicting ESLint rules
];
