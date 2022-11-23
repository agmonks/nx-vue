const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    supportFile: false,
    specPattern: 'apps/*-e2e/**/*.test.{js,jsx,ts,tsx}',
  },
});
