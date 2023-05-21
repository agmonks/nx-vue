const { getJestProjects } = require('@nx/jest');
module.exports = {
  projects: getJestProjects(),
  transformIgnorePatterns: [
    '/node_modules/(?!@ionic/core|@stencil/core|ionicons|swiper|ssr-window|dom7)',
  ],
  preset: 'ts-jest',
};
