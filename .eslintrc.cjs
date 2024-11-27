/** @type {import('eslint').Linter.Config} */
module.exports = {
  globals: {
    BigInt: false,
    BigInt64Array: false,
    BigUint64Array: false,
  },
  root: true,
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  extends: ['eslint:recommended'],
  overrides: [
    // Node
    {
      files: [
        '.eslintrc.cjs',
        'benchmark.js',
        'vite.config.js',
      ],
      env: {
        node: true,
      },
    },
  ],
};
