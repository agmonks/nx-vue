const nxPreset = require('@nrwl/jest/preset').default;
const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  ...nxPreset,
  transform: {
    ...tsjPreset.transform,
    // [...]
  },
};
