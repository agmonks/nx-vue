import { tags } from '@angular-devkit/core';
import {
  checkFilesExist,
  cleanup,
  ensureNxProject,
  uniq,
} from '@nrwl/nx-plugin/testing';
import {
  runNxCommandAsyncStripped,
  runNxProdCommandAsync,
  testGeneratedApp,
} from './utils';

describe('app', () => {
  beforeAll(async () => {
    await runNxCommandAsyncStripped('reset');
    cleanup();
    ensureNxProject('nx-vue', 'dist/libs/vue');
  });

  afterAll(() => {
    cleanup();
  });

  it('should generate lib', async () => {
    const lib = uniq('lib');
    await runNxCommandAsyncStripped(`generate nx-vue:lib ${lib}`);

    const lintResult = await runNxCommandAsyncStripped(`lint ${lib}`);
    expect(lintResult.stdout).toContain('All files pass linting.');

    const testResult = await runNxCommandAsyncStripped(`test ${lib}`);
    expect(testResult.stderr).toContain(tags.stripIndent`
    Test Suites: 1 passed, 1 total
    Tests:       1 passed, 1 total
    Snapshots:   0 total
  `);
  }, 300000);

  it('should generate publishable lib', async () => {
    const lib = uniq('lib');
    await runNxCommandAsyncStripped(`generate nx-vue:lib ${lib} --publishable`);

    let buildResult = await runNxProdCommandAsync(`build ${lib}`);
    expect(buildResult.stdout).toContain('Compiled successfully');
    expect(() =>
      checkFilesExist(
        `dist/libs/${lib}/demo.html`,
        `dist/libs/${lib}/build.common.js`,
        `dist/libs/${lib}/build.common.js.map`,
        `dist/libs/${lib}/build.umd.js`,
        `dist/libs/${lib}/build.umd.js.map`,
        `dist/libs/${lib}/build.umd.min.js`,
        `dist/libs/${lib}/build.umd.min.js.map`,
        `dist/libs/${lib}/package.json`,
        `dist/libs/${lib}/README.md`
      )
    ).not.toThrow();

    buildResult = await runNxProdCommandAsync(`build ${lib} --name new-name`);
    expect(() =>
      checkFilesExist(
        `dist/libs/${lib}/new-name.common.js`,
        `dist/libs/${lib}/new-name.common.js.map`,
        `dist/libs/${lib}/new-name.umd.js`,
        `dist/libs/${lib}/new-name.umd.js.map`,
        `dist/libs/${lib}/new-name.umd.min.js`,
        `dist/libs/${lib}/new-name.umd.min.js.map`
      )
    ).not.toThrow();

    buildResult = await runNxProdCommandAsync(
      `build ${lib} --formats commonjs`
    );
    expect(() =>
      checkFilesExist(
        `dist/libs/${lib}/build.common.js`,
        `dist/libs/${lib}/build.common.js.map`
      )
    ).not.toThrow();
    expect(() =>
      checkFilesExist(
        `dist/libs/${lib}/build.umd.js`,
        `dist/libs/${lib}/build.umd.js.map`,
        `dist/libs/${lib}/build.umd.min.js`,
        `dist/libs/${lib}/build.umd.min.js.map`
      )
    ).toThrow();
  }, 300000);

  it('should generate component', async () => {
    const libName = uniq('lib');
    await runNxCommandAsyncStripped(`generate nx-vue:lib ${libName}`);

    await runNxCommandAsyncStripped(
      `generate nx-vue:component my-component --project ${libName}`
    );

    expect(() =>
      checkFilesExist(`libs/${libName}/src/lib/MyComponent.vue`)
    ).not.toThrow();
  }, 300000);
});
