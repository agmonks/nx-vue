import {
  addDependenciesToPackageJson,
  GeneratorCallback,
  getWorkspaceLayout,
  logger,
  names,
  offsetFromRoot,
  readJson,
  Tree,
  updateJson,
} from '@nx/devkit';
import { ApplicationGeneratorSchema } from './application/schema';
import { LibraryGeneratorSchema } from './library/schema';

export type NormalizedVueSchema<T> = {
  name: string;
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
} & T;

export function normalizeVueOptions<
  T extends LibraryGeneratorSchema | ApplicationGeneratorSchema
>(
  tree: Tree,
  schema: T,
  type: 'library' | 'application'
): NormalizedVueSchema<T> {
  const name = names(schema.name).fileName;
  const projectDirectory = schema.directory
    ? `${names(schema.directory).fileName}/${name}`
    : name;
  const dir = type === 'application' ? 'appsDir' : 'libsDir';
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree)[dir]}/${projectDirectory}`;
  const parsedTags = schema.tags
    ? schema.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...schema,
    name,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

type Options = NormalizedVueSchema<
  ApplicationGeneratorSchema | LibraryGeneratorSchema
>;

export function ensureGraphPluginSetup(tree: Tree): GeneratorCallback {
  updateJson(tree, './nx.json', (json) => {
    json.plugins = json.plugins || [];
    if (!json.plugins.includes('nx-vue')) {
      json.plugins.push('nx-vue');
    }
    return json;
  });
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  return () => {};
}

export async function addJest(tree: Tree, options: Options) {
  const { jestProjectGenerator, jestInitGenerator } = await import('@nx/jest');
  const jestInitTask = await jestInitGenerator(tree, { babelJest: false });
  const jestTask = await jestProjectGenerator(tree, {
    project: options.projectName,
    setupFile: 'none',
    skipSerializers: true,
    supportTsx: true,
    testEnvironment: 'jsdom',
    babelJest: false,
  });
  updateJson(tree, `${options.projectRoot}/tsconfig.spec.json`, (json) => {
    json.include = json.include.filter(
      (pattern: string) => !/\.jsx?$/.test(pattern)
    );
    json.compilerOptions = {
      ...json.compilerOptions,
      jsx: 'preserve',
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    };
    return json;
  });
  const content = `module.exports = {
  displayName: '${options.projectName}',
  preset: '${offsetFromRoot(options.projectRoot)}jest.preset.js',
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$':
      'jest-transform-stub',
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ["ts", "tsx", "vue", "js", "json"],
  coverageDirectory: '${offsetFromRoot(options.projectRoot)}coverage/${
    options.projectRoot
  }',
  snapshotSerializers: ['jest-serializer-vue'],
  globals: {
    'ts-jest': { 
      tsconfig: '${options.projectRoot}/tsconfig.spec.json',
      ${
        options.babel
          ? `babelConfig: '${options.projectRoot}/babel.config.js',`
          : ''
      }
    },
    'vue-jest': {
      tsConfig: '${options.projectRoot}/tsconfig.spec.json',
      ${
        options.babel
          ? `babelConfig: '${options.projectRoot}/babel.config.js',`
          : ''
      }
    },
  },
};
`;
  tree.write(`${options.projectRoot}/jest.config.ts`, content);

  const installTask = addDependenciesToPackageJson(
    tree,
    {},
    {
      'jest-serializer-vue': '^2.0.2',
      'jest-transform-stub': '^2.0.0',
      '@vue/vue3-jest': '^29.0.0',
      '@vue/test-utils': '^2.0.0-0',
    }
  );

  return [jestInitTask, jestTask, installTask];
}

function getEslintConfig(options: Options) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eslintConfig: any = {
    extends: [
      `${offsetFromRoot(options.projectRoot)}.eslintrc.json`,
      `plugin:vue/vue3-essential`,
      '@vue/typescript/recommended',
      'prettier',
    ],
    rules: {},
    ignorePatterns: ['!**/*'],
    env: {
      node: true,
    },
  };

  if (options.unitTestRunner === 'jest') {
    eslintConfig.overrides = [
      {
        files: ['**/*.spec.{j,t}s?(x)'],
        env: {
          jest: true,
        },
      },
    ];
  }

  return eslintConfig;
}

export async function addEsLint(tree: Tree, options: Options) {
  const { lintProjectGenerator, Linter } = await import('@nx/linter');
  const lintTask = await lintProjectGenerator(tree, {
    linter: Linter.EsLint,
    project: options.projectName,
    eslintFilePatterns: [`${options.projectRoot}/**/*.{ts,tsx,vue}`],
    skipFormat: true,
  });

  const content = JSON.stringify(getEslintConfig(options), null, 2);
  const configPath = `${options.projectRoot}/.eslintrc.json`;
  tree.write(configPath, content);

  const installTask = addDependenciesToPackageJson(
    tree,
    {},
    {
      '@vue/eslint-config-prettier': '6.0.0',
      '@vue/eslint-config-typescript': '^5.0.2',
      'eslint-plugin-prettier': '^3.1.3',
      'eslint-plugin-vue': '^7.0.0-0',
    }
  );

  return [lintTask, installTask];
}

export async function addBabel(tree: Tree, options: Options) {
  const babelConfigPath = `${options.projectRoot}/babel.config.js`;
  tree.write(
    babelConfigPath,
    `module.exports = {
  presets: ["@vue/cli-plugin-babel/preset"]
};`
  );

  const installTask = addDependenciesToPackageJson(
    tree,
    { 'core-js': '^3.6.5' },
    { '@vue/cli-plugin-babel': '~4.5.0' }
  );

  return [installTask];
}
