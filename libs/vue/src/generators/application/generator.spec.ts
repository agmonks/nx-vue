import { readJson, readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from './generator';
import { ApplicationGeneratorSchema } from './schema';

export const options: ApplicationGeneratorSchema = {
  name: 'my-app',
  unitTestRunner: 'jest',
  e2eTestRunner: 'cypress',
  routing: false,
  style: 'css',
  skipFormat: false,
  babel: false,
};

describe('application schematic', () => {
  let appTree: Tree;

  const treeRead = (path: string) => appTree.read(path, 'utf-8') || '';

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should update workspace.json', async () => {
    await applicationGenerator(appTree, options);

    const config = readProjectConfiguration(appTree, 'my-app');

    expect(config.root).toBe('my-app');
    expect(config.sourceRoot).toBe('./my-app/src');
    expect(config.targets?.build.executor).toBe('nx-vue:browser');
    expect(config.targets?.build.options).toEqual({
      dest: 'dist/./my-app',
      index: './my-app/public/index.html',
      main: './my-app/src/main.ts',
      tsConfig: './my-app/tsconfig.app.json',
    });
    expect(config.targets?.build.configurations?.production).toEqual({
      mode: 'production',
      filenameHashing: true,
      productionSourceMap: true,
      css: {
        extract: true,
        sourceMap: false,
      },
    });
    expect(config.targets?.serve.executor).toBe('nx-vue:dev-server');
    expect(config.targets?.serve.options).toEqual({
      browserTarget: 'my-app:build',
    });
    expect(config.targets?.serve.configurations?.production).toEqual({
      browserTarget: 'my-app:build:production',
    });
    expect(config.targets?.lint.executor).toBe('@nx/linter:eslint');
    expect(config.targets?.test.executor).toBe('@nx/jest:jest');

    expect(readProjectConfiguration(appTree, 'my-app-e2e')).toBeDefined();
  });

  it('should generate files', async () => {
    await applicationGenerator(appTree, options);

    [
      './my-app/tsconfig.spec.json',
      './my-app/tsconfig.json',
      './my-app/tsconfig.app.json',
      './my-app/jest.config.ts',
      './my-app/.eslintrc.json',
      './my-app/tests/unit/example.spec.ts',
      './my-app/src/shims-vue.d.ts',
      './my-app/src/main.ts',
      './my-app/src/App.vue',
      './my-app/src/components/HelloWorld.vue',
      './my-app/src/assets/logo.png',
      './my-app/public/index.html',
    ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

    const tsconfigAppJson = readJson(appTree, './my-app/tsconfig.app.json');
    expect(tsconfigAppJson.exclude).toEqual(['**/*.spec.ts', '**/*.spec.tsx']);

    const eslintConfig = JSON.parse(treeRead('./my-app/.eslintrc.json'));
    expect(eslintConfig).toEqual(getEslintConfigWithOffset('../'));

    expect(treeRead('./my-app-e2e/src/e2e/app.cy.ts')).toContain(
      "'Welcome to Your Vue.js + TypeScript App'"
    );

    expect(treeRead('./my-app/src/App.vue')).toContain(`
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>`);

    expect(treeRead('./my-app/src/components/HelloWorld.vue')).toContain(`
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>`);

    const tsConfigJson = readJson(appTree, './my-app/tsconfig.json');
    expect(tsConfigJson.references[1]).toEqual({
      path: './tsconfig.spec.json',
    });
  });

  describe('--style', () => {
    it('should generate a scss style block', async () => {
      await applicationGenerator(appTree, { ...options, style: 'scss' });

      expect(treeRead('./my-app/src/App.vue')).toContain('<style lang="scss">');
      expect(treeRead('./my-app/src/components/HelloWorld.vue')).toContain(
        '<style scoped lang="scss">'
      );
    });

    it('should generate a less style block', async () => {
      await applicationGenerator(appTree, { ...options, style: 'less' });

      expect(treeRead('./my-app/src/App.vue')).toContain('<style lang="less">');
      expect(treeRead('./my-app/src/components/HelloWorld.vue')).toContain(
        '<style scoped lang="less">'
      );
    });

    it('should generate a stylus style block', async () => {
      await applicationGenerator(appTree, { ...options, style: 'stylus' });

      expect(treeRead('./my-app/src/App.vue')).toContain(`
<style lang="stylus">
#app
  font-family Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  text-align center
  color #2c3e50
  margin-top 60px
</style>`);

      expect(treeRead('./my-app/src/components/HelloWorld.vue')).toContain(`
<style scoped lang="stylus">
h3
  margin 40px 0 0

ul
  list-style-type none
  padding 0

li
  display inline-block
  margin 0 10px

a
  color #42b983
</style>`);
    });
  });

  describe('--unitTestRunner none', () => {
    it('should not generate test configuration', async () => {
      await applicationGenerator(appTree, {
        ...options,
        unitTestRunner: 'none',
      });

      const config = readProjectConfiguration(appTree, 'my-app');

      expect(config.targets?.test).toBeUndefined();

      [
        './my-app/tsconfig.spec.json',
        './my-app/jest.config.ts',
        './my-app/tests/unit/example.spec.ts',
      ].forEach((path) => expect(appTree.exists(path)).toBeFalsy());

      const tsconfigAppJson = readJson(appTree, './my-app/tsconfig.app.json');
      expect(tsconfigAppJson.exclude).toBeUndefined();

      const eslintConfig = JSON.parse(treeRead('./my-app/.eslintrc.json'));

      const expected = getEslintConfigWithOffset('../');
      delete expected.overrides;
      expect(eslintConfig).toEqual(expected);

      const tsConfigJson = readJson(appTree, './my-app/tsconfig.json');
      expect(tsConfigJson.references[1]).toBeUndefined();
    });
  });

  describe('--e2eTestRunner none', () => {
    it('should not generate e2e configuration', async () => {
      await applicationGenerator(appTree, {
        ...options,
        e2eTestRunner: 'none',
      });

      const e2eDir = appTree.children('./my-app-e2e');
      expect(e2eDir.length).toBe(0);
    });
  });

  describe('--routing', () => {
    it('should generate routing configuration', async () => {
      await applicationGenerator(appTree, { ...options, routing: true });

      const packageJson = readJson(appTree, 'package.json');
      expect(packageJson.dependencies['vue-router']).toBeDefined();

      [
        './my-app/src/views/Home.vue',
        './my-app/src/views/About.vue',
        './my-app/src/router/index.ts',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

      const main = treeRead('./my-app/src/main.ts');
      expect(main).toContain("import router from './router';");
      expect(main).toContain(`.use(router)`);

      expect(treeRead('./my-app/src/App.vue')).toContain(`
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view />`);

      expect(treeRead('./my-app/src/App.vue')).toContain(`
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>`);
    });
  });

  describe('--babel', () => {
    it('--should generate files', async () => {
      await applicationGenerator(appTree, { ...options, babel: true });

      expect(appTree.exists('./my-app/babel.config.js')).toBeTruthy();

      const jestConfig = treeRead('./my-app/jest.config.ts');
      expect(jestConfig).toContain(`
    'vue-jest': {
      tsConfig: './my-app/tsconfig.spec.json',
      babelConfig: './my-app/babel.config.js',
    },`);
    });
  });

  describe('--directory subdir', () => {
    it('should update workspace.json', async () => {
      await applicationGenerator(appTree, { ...options, directory: 'subdir' });

      const config = readProjectConfiguration(appTree, 'subdir-my-app');

      expect(config.root).toBe('subdir/my-app');
      expect(config.sourceRoot).toBe('./subdir/my-app/src');
      expect(config.targets?.build.options).toEqual({
        dest: 'dist/./subdir/my-app',
        index: './subdir/my-app/public/index.html',
        main: './subdir/my-app/src/main.ts',
        tsConfig: './subdir/my-app/tsconfig.app.json',
      });
      expect(config.targets?.serve.options).toEqual({
        browserTarget: 'subdir-my-app:build',
      });
      expect(config.targets?.serve.configurations?.production).toEqual({
        browserTarget: 'subdir-my-app:build:production',
      });
    });

    it('should generate files', async () => {
      await applicationGenerator(appTree, { ...options, directory: 'subdir' });

      [
        './subdir/my-app/tsconfig.spec.json',
        './subdir/my-app/tsconfig.json',
        './subdir/my-app/tsconfig.app.json',
        './subdir/my-app/jest.config.ts',
        './subdir/my-app/.eslintrc.json',
        './subdir/my-app/tests/unit/example.spec.ts',
        './subdir/my-app/src/shims-vue.d.ts',
        './subdir/my-app/src/main.ts',
        './subdir/my-app/src/App.vue',
        './subdir/my-app/src/components/HelloWorld.vue',
        './subdir/my-app/src/assets/logo.png',
        './subdir/my-app/public/index.html',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

      const tsconfigAppJson = readJson(
        appTree,
        './subdir/my-app/tsconfig.app.json'
      );
      expect(tsconfigAppJson.exclude).toEqual([
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ]);

      const eslintConfig = JSON.parse(
        treeRead('./subdir/my-app/.eslintrc.json')
      );
      expect(eslintConfig).toEqual(getEslintConfigWithOffset('../../'));

      expect(treeRead('./subdir/my-app-e2e/src/e2e/app.cy.ts')).toContain(
        "'Welcome to Your Vue.js + TypeScript App'"
      );

      const tsConfigJson = readJson(appTree, './subdir/my-app/tsconfig.json');
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
        workspaceLayout: { appsDir: 'custom-apps-dir' },
      };
      appTree.write('nx.json', JSON.stringify(updateNxJson));
    });

    it('should update workspace.json', async () => {
      await applicationGenerator(appTree, options);

      const config = readProjectConfiguration(appTree, 'my-app');

      expect(config.root).toBe('custom-apps-dir/my-app');
      expect(config.sourceRoot).toBe('custom-apps-dir/my-app/src');
      expect(config.targets?.build.options).toEqual({
        dest: 'dist/custom-apps-dir/my-app',
        index: 'custom-apps-dir/my-app/public/index.html',
        main: 'custom-apps-dir/my-app/src/main.ts',
        tsConfig: 'custom-apps-dir/my-app/tsconfig.app.json',
      });
      expect(config.targets?.serve.options).toEqual({
        browserTarget: 'my-app:build',
      });
      expect(config.targets?.serve.configurations?.production).toEqual({
        browserTarget: 'my-app:build:production',
      });
    });

    it('should generate files', async () => {
      await applicationGenerator(appTree, options);

      [
        'custom-apps-dir/my-app/tsconfig.spec.json',
        'custom-apps-dir/my-app/tsconfig.json',
        'custom-apps-dir/my-app/tsconfig.app.json',
        'custom-apps-dir/my-app/jest.config.ts',
        'custom-apps-dir/my-app/.eslintrc.json',
        'custom-apps-dir/my-app/tests/unit/example.spec.ts',
        'custom-apps-dir/my-app/src/shims-vue.d.ts',
        'custom-apps-dir/my-app/src/main.ts',
        'custom-apps-dir/my-app/src/App.vue',
        'custom-apps-dir/my-app/src/components/HelloWorld.vue',
        'custom-apps-dir/my-app/src/assets/logo.png',
        'custom-apps-dir/my-app/public/index.html',
      ].forEach((path) => expect(appTree.exists(path)).toBeTruthy());

      const tsconfigAppJson = readJson(
        appTree,
        'custom-apps-dir/my-app/tsconfig.app.json'
      );
      expect(tsconfigAppJson.exclude).toEqual([
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ]);

      const eslintConfig = JSON.parse(
        treeRead('custom-apps-dir/my-app/.eslintrc.json')
      );
      expect(eslintConfig).toEqual(getEslintConfigWithOffset('../../'));

      expect(
        treeRead('custom-apps-dir/my-app-e2e/src/e2e/app.cy.ts')
      ).toContain("'Welcome to Your Vue.js + TypeScript App'");

      const tsConfigJson = readJson(
        appTree,
        'custom-apps-dir/my-app/tsconfig.json'
      );
      expect(tsConfigJson.references[1]).toEqual({
        path: './tsconfig.spec.json',
      });
    });
  });
});

export function getEslintConfigWithOffset(offset: string) {
  const config = {
    extends: [
      `${offset}.eslintrc.json`,
      `plugin:vue/vue3-essential`,
      '@vue/typescript/recommended',
      'prettier',
    ],
    rules: {},
    ignorePatterns: ['!**/*'],
    overrides: [
      {
        files: ['**/*.spec.{j,t}s?(x)'],
        env: {
          jest: true,
        },
      },
    ],
    env: {
      node: true,
    },
  };

  return config as Partial<typeof config>;
}
