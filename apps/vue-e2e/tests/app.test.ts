import {
  checkFilesExist,
  cleanup,
  ensureNxProject,
  uniq,
  updateFile,
} from '@nx/plugin/testing';
import { runNxCommandAsyncStripped, testGeneratedApp } from './utils';

describe('app', () => {
  beforeAll(async () => {
    cleanup();
    ensureNxProject('nx-vue', 'dist/libs/vue');
  });

  afterAll(() => {
    cleanup();
  });

  it('should generate app', async () => {
    const appName = uniq('app');
    console.log('appName', appName);

    await runNxCommandAsyncStripped(`generate nx-vue:app ${appName}`);

    await testGeneratedApp(appName, {
      lint: true,
      test: true,
      e2e: true,
      build: true,
      buildProd: true,
    });
  }, 300000);

  it('should generate app with routing', async () => {
    const appName = uniq('app');
    await runNxCommandAsyncStripped(`generate nx-vue:app ${appName} --routing`);

    await testGeneratedApp(appName, {
      lint: true,
      test: false,
      e2e: true,
      build: true,
      buildProd: true,
    });

    expect(() =>
      checkFilesExist(
        `dist/apps/${appName}/js/about.js`,
        `dist/apps/${appName}/js/about.js.map`
      )
    ).not.toThrow();
  }, 300000);

  it('should generate component', async () => {
    const appName = uniq('app');
    await runNxCommandAsyncStripped(`generate nx-vue:app ${appName}`);

    await runNxCommandAsyncStripped(
      `generate nx-vue:component my-component --project ${appName}`
    );

    expect(() =>
      checkFilesExist(`apps/${appName}/src/MyComponent.vue`)
    ).not.toThrow();
  }, 300000);

  it('should report lint error in App.vue', async () => {
    const appName = uniq('app');
    await runNxCommandAsyncStripped(`generate nx-vue:app ${appName}`);

    updateFile(
      `apps/${appName}/src/App.vue`,
      '<script lang="ts">let myVar: {}</script>'
    );

    const result = await runNxCommandAsyncStripped(`lint ${appName}`, {
      silenceError: true,
    });
    expect(result.stderr).toContain('Lint errors found in the listed files.');
  }, 300000);
});
