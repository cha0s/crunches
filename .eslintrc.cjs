/** @type {import('eslint').Linter.Config} */
module.exports = {
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
