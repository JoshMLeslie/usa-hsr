import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
	{languageOptions: {globals: globals.browser}},
	pluginJs.configs.recommended,
	{
		rules: {
			// note you must disable the base rule
			// as it can report incorrect errors
			'no-unused-vars': 'off',
			'no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
				},
			],
		},
	},
];
