import {
  cleanup,
  ensureNxProject,
  readJson,
  uniq,
  updateFile,
} from '@nx/plugin/testing';
import { runNxCommandAsyncStripped, testGeneratedApp } from './utils';

describe('graph plugin', () => {
  beforeAll(async () => {
    cleanup();
    ensureNxProject('nx-vue', 'dist/libs/vue');
  });

  afterAll(() => {
    cleanup();
  });
  it('Should use graph plugin to build dependencies from .vue files', async () => {
    const appName = uniq('app');
    const lib1Name = uniq('lib');
    const lib2Name = uniq('lib');

    await runNxCommandAsyncStripped(`generate nx-vue:app ${appName}`);

    await runNxCommandAsyncStripped(`generate nx-vue:lib ${lib1Name}`);

    await runNxCommandAsyncStripped(`generate nx-vue:lib ${lib2Name}`);

    updateFile(
      `apps/${appName}/src/App.vue`,
      `<template>
    <img alt="Vue logo" src="./assets/logo.png" />
    <HelloWorld msg="Welcome to Your Vue.js + TypeScript App" />
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { HelloWorld } from '@proj/${lib1Name}';
  
  export default defineComponent({
    name: 'App',
    components: {
      HelloWorld,
    },
  });
  </script>
  
  <style>
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }
  </style>`
    );

    await runNxCommandAsyncStripped(`reset`);

    await runNxCommandAsyncStripped(`graph --file=graph.json`);

    let graph = readJson('graph.json');

    const expectedJson = `
  {
    "${appName}-e2e": [
      {
        "source": "${appName}-e2e",
        "target": "${appName}",
        "type": "implicit"
      }
    ],
    "${appName}": [
      {
        "source": "${appName}",
        "target": "${lib1Name}",
        "type": "static"
      }
    ],
    "${lib2Name}": [],
    "${lib1Name}": []
  }`;

    expect(graph.graph.dependencies).toEqual(JSON.parse(expectedJson));
  }, 300000);
});
