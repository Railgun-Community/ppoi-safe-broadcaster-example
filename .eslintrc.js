module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['airbnb-base', 'plugin:import/typescript'],
  globals: {
    Optional: 'readonly',
    MapType: 'readonly',
    NumMapType: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 0,
    'no-shadow': 0,
    'implicit-arrow-linebreak': 0,
    'no-restricted-syntax': 0,
    'import/prefer-default-export': 0,
    'import/no-unresolved': 0,
    'arrow-body-style': 0,
    'operator-linebreak': 0,
    'function-paren-newline': 0,
    'import/extensions': ['error', 'ignorePackages', { ts: 'never' }],
  },
};
