import { readJson, readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { libraryGenerator } from './generator';
import { LibraryGeneratorSchema } from './schema';
import { getEslintConfigWithOffset } from '../application/generator.spec';

export const options: LibraryGeneratorSchema = {
  name: 'my-lib',
  unitTestRunner: 'jest',
  skipFormat: false,
  publishable: false,
  skipTsConfig: false,
  babel: false,
};

describe('library schematic', () => {
  let appTree: Tree;

  const treeRead = (path: string) => appTree.read(path, 'utf-8') || '';

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should update workspace.json and tsconfig.base.json', async () => {
    await libraryGenerator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-lib');

    expect(config.root).toBe('my-lib');
    expect(config.sourceRoot).toBe('./my-lib/src');
    expect(config.targets?.lint.executor).toBe('@nx/linter:eslint');
    expect(config.targets?.test.executor).toBe('@nx/jest:jest');

    const tsConfigBaseJson = readJson(appTree, 'tsconfig.base.json');
    expect(tsConfigBaseJson.compilerOptions.paths['@proj/my-lib']).toEqual([
      './my-lib/src/index.ts',
    ]);
  });

  it('should generate files', async () => {
    await libraryGenerator(appTree, options);

    /* TODO: fix this
    [
      './my-lib/tsconfig.spec.json',
      './my-lib/tsconfig.json',
      './my-lib/tsconfig.lib.json',
      './my-lib/jest.config.ts',
      './my-lib/.eslintrc.json',
      './my-lib/tests/unit/example.spec.ts',
      './my-lib/src/shims-tsx.d.ts',
      './my-lib/src/shims-vue.d.ts',
      './my-lib/src/index.ts',
      './my-lib/src/lib/HelloWorld.vue',
    ].forEach((path) => expect(appTree.exists(path)).toBeTruthy()); */

    const tsconfigLibJson = readJson(appTree, './my-lib/tsconfig.lib.json');
    expect(tsconfigLibJson.exclude).toEqual(['**/*.spec.ts', '**/*.spec.tsx']);

    const eslintConfig = JSON.parse(treeRead('./my-lib/.eslintrc.json'));
    expect(eslintConfig).toEqual(getEslintConfigWithOffset('../'));

    const tsConfigJson = readJson(appTree, './my-lib/tsconfig.json');
    expect(tsConfigJson.references[1]).toEqual({
      path: './tsconfig.spec.json',
    });
  });

  describe('--publishable', () => {
    it('should generate publishable configuration', async () => {
      await libraryGenerator(appTree, { ...options, publishable: true });

      const config = readProjectConfiguration(appTree, 'my-lib');

      const build = config.targets?.build;

      if (!build) throw new Error('build is undefined');

      expect(build.executor).toBe('nx-vue:library');
      expect(build.options).toEqual({
        dest: `dist/./my-lib`,
        entry: `./my-lib/src/index.ts`,
        tsConfig: `./my-lib/tsconfig.lib.json`,
      });

      expect(JSON.parse(treeRead('./my-lib/package.json'))).toEqual({
        name: '@proj/my-lib',
        version: '0.0.0',
      });
    });
  });

  describe('--unitTestRunner none', () => {
    it('should not generate test configuration', async () => {
      await libraryGenerator(appTree, { ...options, unitTestRunner: 'none' });

      const config = readProjectConfiguration(appTree, 'my-lib');

      expect(config.targets?.test).toBeUndefined();

      [
        './my-lib/tsconfig.spec.json',
        './my-lib/jest.config.ts',
        './my-lib/tests/unit/example.spec.ts',
      ].forEach((path) => expect(appTree.exists(path)).toBeFalsy());

      const tsconfigLibJson = readJson(appTree, './my-lib/tsconfig.lib.json');
      expect(tsconfigLibJson.exclude).toBeUndefined();

      const eslintConfig = JSON.parse(treeRead('./my-lib/.eslintrc.json'));
      const expected = getEslintConfigWithOffset('../');
      delete expected.overrides;
      expect(eslintConfig).toEqual(expected);

      expect(treeRead('./my-lib/.eslintrc.json')).not.toContain('"overrides":');

      const tsConfigJson = readJson(appTree, './my-lib/tsconfig.json');
      expect(tsConfigJson.references[1]).toBeUndefined();
    });
  });

  describe('--babel', () => {
    it('--should generate files', async () => {
      await libraryGenerator(appTree, { ...options, babel: true });

      expect(appTree.exists('./my-lib/babel.config.js')).toBeTruthy();

      const jestConfig = treeRead('./my-lib/jest.config.ts');
      expect(jestConfig).toContain(`
    'vue-jest': {
      tsConfig: './my-lib/tsconfig.spec.json',
      babelConfig: './my-lib/babel.config.js',
    },`);
    });
  });

  describe('--directory subdir', () => {
    it('should update workspace.json and tsconfig.base.json', async () => {
      await libraryGenerator(appTree, {
        ...options,
        directory: 'subdir',
        publishable: true,
      });

      const config = readProjectConfiguration(appTree, 'subdir-my-lib');
      expect(config.targets?.build.options).toEqual({
        dest: `dist/./subdir/my-lib`,
        entry: `./subdir/my-lib/src/index.ts`,
        tsConfig: `./subdir/my-lib/tsconfig.lib.json`,
      });

      expect(config.root).toBe('subdir/my-lib');
      expect(config.sourceRoot).toBe('./subdir/my-lib/src');

      const tsConfigBaseJson = readJson(appTree, 'tsconfig.base.json');
      expect(
        tsConfigBaseJson.compilerOptions.paths['@proj/subdir/my-lib']
      ).toEqual(['./subdir/my-lib/src/index.ts']);
    });

    it('should generate files', async () => {
      await libraryGenerator(appTree, {
        ...options,
        directory: 'subdir',
        publishable: true,
      });

      /* TODO: fix this
      [
        './subdir/my-lib/tsconfig.spec.json',
        './subdir/my-lib/tsconfig.json',
        './subdir/my-lib/tsconfig.lib.json',
        './subdir/my-lib/jest.config.ts',
        './subdir/my-lib/.eslintrc.json',
        './subdir/my-lib/tests/unit/example.spec.ts',
        './subdir/my-lib/src/shims-tsx.d.ts',
        './subdir/my-lib/src/shims-vue.d.ts',
        './subdir/my-lib/src/index.ts',
        './subdir/my-lib/src/lib/HelloWorld.vue',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());*/

      const tsconfigLibJson = readJson(
        appTree,
        './subdir/my-lib/tsconfig.lib.json'
      );
      expect(tsconfigLibJson.exclude).toEqual([
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ]);

      const eslintConfig = JSON.parse(
        treeRead('./subdir/my-lib/.eslintrc.json')
      );
      expect(eslintConfig).toEqual(getEslintConfigWithOffset('../../'));

      expect(JSON.parse(treeRead('./subdir/my-lib/package.json'))).toEqual({
        name: '@proj/my-lib',
        version: '0.0.0',
      });

      const tsConfigJson = readJson(appTree, './subdir/my-lib/tsconfig.json');
      expect(tsConfigJson.references[1]).toEqual({
        path: './tsconfig.spec.json',
      });
    });
  });

  describe('workspaceLayout', () => {
    beforeEach(() => {
      const nxJson = JSON.parse(treeRead('nx.json'));
      const updateNxJson = {
        ...nxJson,
        workspaceLayout: { libsDir: 'custom-libs-dir' },
      };
      appTree.write('nx.json', JSON.stringify(updateNxJson));
    });

    it('should update workspace.json and tsconfig.base.json', async () => {
      await libraryGenerator(appTree, { ...options, publishable: true });

      const config = readProjectConfiguration(appTree, 'my-lib');

      const build = config.targets?.build;

      expect(build).toBeDefined();

      expect(build?.options).toEqual({
        dest: `dist/custom-libs-dir/my-lib`,
        entry: `custom-libs-dir/my-lib/src/index.ts`,
        tsConfig: `custom-libs-dir/my-lib/tsconfig.lib.json`,
      });

      expect(config.root).toBe('custom-libs-dir/my-lib');
      expect(config.sourceRoot).toBe('custom-libs-dir/my-lib/src');

      const tsConfigBaseJson = readJson(appTree, 'tsconfig.base.json');
      expect(tsConfigBaseJson.compilerOptions.paths['@proj/my-lib']).toEqual([
        'custom-libs-dir/my-lib/src/index.ts',
      ]);
    });

    it('should generate files', async () => {
      await libraryGenerator(appTree, { ...options, publishable: true });

      /* TODO: fix this
      [
        'custom-libs-dir/my-lib/tsconfig.spec.json',
        'custom-libs-dir/my-lib/tsconfig.json',
        'custom-libs-dir/my-lib/tsconfig.lib.json',
        'custom-libs-dir/my-lib/jest.config.ts',
        'custom-libs-dir/my-lib/.eslintrc.json',
        'custom-libs-dir/my-lib/tests/unit/example.spec.ts',
        'custom-libs-dir/my-lib/src/shims-tsx.d.ts',
        'custom-libs-dir/my-lib/src/shims-vue.d.ts',
        'custom-libs-dir/my-lib/src/index.ts',
        'custom-libs-dir/my-lib/src/lib/HelloWorld.vue',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());*/

      const tsconfigLibJson = readJson(
        appTree,
        'custom-libs-dir/my-lib/tsconfig.lib.json'
      );
      expect(tsconfigLibJson.exclude).toEqual([
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ]);

      const eslintConfig = JSON.parse(
        treeRead('custom-libs-dir/my-lib/.eslintrc.json')
      );

      expect(eslintConfig).toEqual(getEslintConfigWithOffset('../../'));

      expect(readJson(appTree, 'custom-libs-dir/my-lib/package.json')).toEqual({
        name: '@proj/my-lib',
        version: '0.0.0',
      });

      const tsConfigJson = readJson(
        appTree,
        'custom-libs-dir/my-lib/tsconfig.json'
      );
      expect(tsConfigJson.references[1]).toEqual({
        path: './tsconfig.spec.json',
      });
    });
  });
});
