import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  names,
  offsetFromRoot,
  Tree,
} from '@nx/devkit';
import { runTasksInSerial } from '@nx/workspace/src/utilities/run-tasks-in-serial';
import * as path from 'path';
import {
  addBabel,
  addEsLint,
  addJest,
  ensureGraphPluginSetup,
  NormalizedVueSchema,
  normalizeVueOptions,
} from '../shared';
import { ApplicationGeneratorSchema } from './schema';

type NormalizedSchema = NormalizedVueSchema<ApplicationGeneratorSchema>;

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    dot: '.',
    baseUrl: '<%= BASE_URL %>',
    htmlWebpackPluginTitle: '<%= htmlWebpackPlugin.options.title %>',
  };
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );

  const fileChanges = tree.listChanges();
  if (options.unitTestRunner === 'none') {
    const { path } =
      fileChanges.find(({ path }) => path.includes('example.spec.ts')) || {};
    if (path) {
      tree.delete(path);
    }
  }

  if (!options.routing) {
    const routerFiles = [
      '/src/router/index.ts',
      '/src/views/About.vue',
      '/src/views/Home.vue',
    ];
    fileChanges
      .filter(({ path }) => routerFiles.some((file) => path.includes(file)))
      .forEach(({ path }) => tree.delete(path));
  }

  const fcPath = (
    fileChanges.find(({ path }) => path.includes('/src/shims-tsx.d.ts')) || {}
  ).path;
  if (fcPath) {
    tree.delete(fcPath);
  }
}

async function addCypress(tree: Tree, options: NormalizedSchema) {
  const { cypressInitGenerator, cypressProjectGenerator } = await import(
    '@nx/cypress'
  );
  const { Linter } = await import('@nx/linter');
  const cypressInitTask = await cypressInitGenerator(tree, {});
  const cypressTask = await cypressProjectGenerator(tree, {
    project: options.projectName,
    name: options.name + '-e2e',
    directory: options.directory,
    linter: Linter.EsLint,
    js: false,
  });

  const appSpecPath = options.projectRoot + '-e2e/src/e2e/app.cy.ts';
  tree.write(
    appSpecPath,
    `describe('${options.projectName}', () => {
  it('should display welcome message', () => {
    cy.visit('/')
    cy.contains('h1', 'Welcome to Your Vue.js + TypeScript App')
  });
});
`
  );

  return [cypressInitTask, cypressTask];
}

export async function applicationGenerator(
  tree: Tree,
  schema: ApplicationGeneratorSchema
) {
  const options = normalizeVueOptions(tree, schema, 'application');
  addProjectConfiguration(tree, options.projectName, {
    root: options.projectRoot,
    projectType: 'application',
    sourceRoot: `${options.projectRoot}/src`,
    targets: {
      build: {
        executor: 'nx-vue:browser',
        options: {
          dest: `dist/${options.projectRoot}`,
          index: `${options.projectRoot}/public/index.html`,
          main: `${options.projectRoot}/src/main.ts`,
          tsConfig: `${options.projectRoot}/tsconfig.app.json`,
        },
        configurations: {
          production: {
            mode: 'production',
            filenameHashing: true,
            productionSourceMap: true,
            css: {
              extract: true,
              sourceMap: false,
            },
          },
        },
      },
      serve: {
        executor: 'nx-vue:dev-server',
        options: {
          browserTarget: `${options.projectName}:build`,
        },
        configurations: {
          production: {
            browserTarget: `${options.projectName}:build:production`,
          },
        },
      },
    },
    tags: options.parsedTags,
  });

  addFiles(tree, options);

  const lintTasks = await addEsLint(tree, options);

  const cypressTasks =
    options.e2eTestRunner === 'cypress' ? await addCypress(tree, options) : [];

  const jestTasks =
    options.unitTestRunner === 'jest' ? await addJest(tree, options) : [];

  const babelTasks = options.babel ? await addBabel(tree, options) : [];

  const installTask = addDependenciesToPackageJson(
    tree,
    {
      vue: '^3.0.0',
      ...(options.routing ? { 'vue-router': '^4.0.0-0' } : {}),
    },
    {
      '@vue/cli-plugin-typescript': '~4.5.0',
      '@vue/cli-service': '~4.5.0',
      ...{ '@vue/compiler-sfc': '^3.0.0' },
      '@vue/eslint-config-typescript': '^5.0.2',
      'eslint-plugin-vue': '^7.8.0',
    }
  );

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(
    ...lintTasks,
    ...cypressTasks,
    ...jestTasks,
    ...babelTasks,
    installTask,
    ensureGraphPluginSetup(tree)
  );
}

export const applicationSchematic = convertNxGenerator(applicationGenerator);
