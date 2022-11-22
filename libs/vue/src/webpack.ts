import { ExecutorContext } from '@nrwl/devkit';
import * as path from 'path';
import * as semver from 'semver';
import { BrowserExecutorSchema } from './executors/browser/schema';
import { LibraryExecutorSchema } from './executors/library/schema';
import { loadModule } from './utils';

// Deal with this later
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ANY = any;

export function modifyIndexHtmlPath(
  config: ANY,
  options: BrowserExecutorSchema,
  context: ExecutorContext
): void {
  config.plugin('html').tap((args: ANY) => {
    args[0].template = path.join(context.root, options.index);
    return args;
  });
}

export function modifyEntryPoint(
  config: ANY,
  options: BrowserExecutorSchema,
  context: ExecutorContext
): void {
  config.entry('app').clear();
  config.entry('app').add(path.join(context.root, options.main));
}

export function modifyTsConfigPaths(
  config: ANY,
  options: BrowserExecutorSchema | LibraryExecutorSchema,
  context: ExecutorContext
): void {
  const tsConfigPath = path.join(context.root, options.tsConfig);
  const vue = loadModule('vue', context.root);

  config.module
    .rule('ts')
    .use('ts-loader')
    .tap((loaderOptions: ANY) => {
      loaderOptions.configFile = tsConfigPath;
      return loaderOptions;
    });
  config.module
    .rule('tsx')
    .use('ts-loader')
    .tap((loaderOptions: ANY) => {
      loaderOptions.configFile = tsConfigPath;
      return loaderOptions;
    });
  config.plugin('fork-ts-checker').tap((args: ANY) => {
    args[0].typescript.configFile = tsConfigPath;
  });
}

export function modifyTypescriptAliases(
  config: ANY,
  options: BrowserExecutorSchema | LibraryExecutorSchema,
  context: ExecutorContext
) {
  const tsConfigPath = path.join(context.root, options.tsConfig);
  const extensions = [
    '.tsx',
    '.ts',
    '.mjs',
    '.js',
    '.jsx',
    '.vue',
    '.json',
    '.wasm',
  ];
  config.resolve.alias.delete('@');
  config.resolve
    .plugin('tsconfig-paths')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .use(require('tsconfig-paths-webpack-plugin'), [
      {
        configFile: tsConfigPath,
        extensions,
      },
    ]);
}

export function modifyCopyAssets(
  config: ANY,
  options: LibraryExecutorSchema,
  context: ExecutorContext,
  projectRoot: string
): void {
  const transformedAssetPatterns = ['package.json', 'README.md'].map(
    (file) => ({
      from: path.join(projectRoot, file),
      to: path.join(context.root, options.dest),
    })
  );

  config
    .plugin('copy')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .use(require('copy-webpack-plugin'), [transformedAssetPatterns]);
}

export function modifyBabelLoader(config: ANY, babelConfig: string) {
  ['js', 'ts', 'tsx'].forEach((ext) =>
    config.module
      .rule(ext)
      .use('babel-loader')
      .tap((options: ANY) => ({
        ...options,
        configFile: babelConfig,
      }))
  );
}
