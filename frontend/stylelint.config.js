/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-tailwindcss'],
  rules: {
    // Allow Tailwind directives
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'layer',
          'config',
          'variants',
          'responsive',
          'screen',
          'theme',
          'source',
          'utility',
          'variant',
          'plugin',
        ],
      },
    ],
    // Allow Tailwind functions
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['theme', 'screen', 'config'],
      },
    ],
    // Disable rules that conflict with Tailwind
    'no-descending-specificity': null,
    'declaration-block-no-redundant-longhand-properties': null,
  },
  ignoreFiles: ['dist/**', 'node_modules/**', 'coverage/**'],
};
