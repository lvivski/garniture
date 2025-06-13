import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config([
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parserOptions: {
				project: './tsconfig.json',
				tsconfigRootDir: import.meta.dirname,
			},
		},
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			tseslint.configs.recommendedTypeChecked,
		],
		rules: {
			quotes: ['error', 'single'],
			indent: ['warn', 'tab'],
			'no-mixed-spaces-and-tabs': 'warn',
			'@typescript-eslint/consistent-type-definitions': 'warn',
			'@typescript-eslint/unbound-method': 'warn',
			'@typescript-eslint/prefer-nullish-coalescing': [
				'error',
				{
					ignoreTernaryTests: true,
					ignoreConditionalTests: true,
				},
			],
		},
	},
	{
		ignores: ['lib/*', 'example/*'],
	},
])
