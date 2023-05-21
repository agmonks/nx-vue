[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ![GitHub top language](https://img.shields.io/github/languages/top/agmonks/nx-vue) [![Node.js CI](https://github.com/agmonks/nx-vue/actions/workflows/node.js.yml/badge.svg)](https://github.com/agmonks/nx-vue/actions/workflows/node.js.yml) [![npm version](https://badge.fury.io/js/nx-vue.svg)](https://badge.fury.io/js/nx-vue)

# Nx Vue

An nx plugin to add vue support to your workspace. This plugin is based off @nx-plus/vue, however updated to add new features are drop others to keep the plugin as simple as possible.

### Feature comparison with @nx-plus/vue

| Tables          |       nx-vue       |     @nx-plus/vue     |
| --------------- | :----------------: | :------------------: |
| Vue 2 Support   |        :x:         |  :heavy_check_mark:  |
| Vue 3 Support   | :heavy_check_mark: |  :heavy_check_mark:  |
| Vite Support    |        :x:         |  :heavy_check_mark:  |
| Vuex Generator  |        :x:         |  :heavy_check_mark:  |
| Webpack 4       |        :x:         |  :heavy_check_mark:  |
| Webpack 5       | :heavy_check_mark: |         :x:          |
| Nx Graph Plugin | :heavy_check_mark: | :heavy_check_mark:\* |

\* Nx plus uses a post install script to modify nx source files to add vue support. This plugin uses a dep-graph extension for nx

## Prerequisite

### Nx Workspace

If you have not already, [create an Nx workspace](https://github.com/nrwl/nx#creating-an-nx-workspace) with the following:

```
npx create-nx-workspace@^15.2.0
```

### Peer Dependencies

If you have not already, install peer dependencies with the following:

```
# npm
npm install @nx/cypress@^14.0.0 @nx/jest@^14.0.0 @nx/linter@^14.0.0 --save-dev

# yarn
yarn add @nx/cypress@^14.0.0 @nx/jest@^14.0.0 @nx/linter@^14.0.0 --dev
```

## Getting Started

### Install Plugin

```
# npm
npm install nx-vue --save-dev

# yarn
yarn add nx-vue --dev
```

### Generate Your App

```
nx g nx-vue:app my-app
```

### Serve Your App

```
nx serve my-app
```

## Schematics (i.e. code generation)

### Application

`nx g nx-vue:app <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options            | Default   | Description                                    |
| ------------------ | --------- | ---------------------------------------------- |
| `--tags`           | -         | Tags to use for linting (comma-delimited).     |
| `--directory`      | `apps`    | A directory where the project is placed.       |
| `--style`          | `css`     | The file extension to be used for style files. |
| `--unitTestRunner` | `jest`    | Test runner to use for unit tests.             |
| `--e2eTestRunner`  | `cypress` | Test runner to use for end to end (e2e) tests. |
| `--routing`        | `false`   | Generate routing configuration.                |
| `--skipFormat`     | `false`   | Skip formatting files.                         |
| `--babel`          | `false`   | Add Babel support.                             |

### Library

`nx g nx-vue:lib <name> [options]`

| Arguments | Description               |
| --------- | ------------------------- |
| `<name>`  | The name of your library. |

| Options            | Default | Description                                             |
| ------------------ | ------- | ------------------------------------------------------- |
| `--tags`           | -       | Tags to use for linting (comma-delimited).              |
| `--directory`      | `libs`  | A directory where the project is placed.                |
| `--unitTestRunner` | `jest`  | Test runner to use for unit tests.                      |
| `--skipFormat`     | `false` | Skip formatting files.                                  |
| `--skipTsConfig`   | `false` | Do not update tsconfig.json for development experience. |
| `--publishable`    | `false` | Create a buildable library.                             |
| `--babel`          | `false` | Add Babel support.                                      |

### Component

`nx g nx-vue:component <name> [options]`

| Arguments | Description                 |
| --------- | --------------------------- |
| `<name>`  | The name of your component. |

| Options       | Default | Description                                    |
| ------------- | ------- | ---------------------------------------------- |
| `--project`   | -       | Tags to use for linting (comma-delimited).     |
| `--directory` | -       | A directory where the component is placed.     |
| `--style`     | `css`   | The file extension to be used for style files. |

## Builders (i.e. task runners)

### Dev Server

`nx serve <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options                      | Default       | Description                                                                                                                                                                                                                          |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--open`                     | `false`       | Open browser on server start.                                                                                                                                                                                                        |
| `--copy`                     | `false`       | Copy url to clipboard on server start.                                                                                                                                                                                               |
| `--stdin`                    | `false`       | Close when stdin ends.                                                                                                                                                                                                               |
| `--mode`                     | `development` | Specify env mode (default: development).                                                                                                                                                                                             |
| `--host`                     | `0.0.0.0`     | Specify host (default: 0.0.0.0).                                                                                                                                                                                                     |
| `--port`                     | `8080`        | Specify port (default: 8080).                                                                                                                                                                                                        |
| `--https`                    | `false`       | Use https (default: false).                                                                                                                                                                                                          |
| `--public`                   | -             | Specify the public network URL for the HMR client.                                                                                                                                                                                   |
| `--skipPlugins`              | -             | Comma-separated list of plugin names to skip for this run.                                                                                                                                                                           |
| `--browserTarget`            | -             | Target to serve.                                                                                                                                                                                                                     |
| `--watch`                    | `true`        | Watch for changes.                                                                                                                                                                                                                   |
| `--publicPath`               | `/`           | The base URL your application bundle will be deployed at.                                                                                                                                                                            |
| `--transpileDependencies`    | []            | By default babel-loader ignores all files inside node_modules. If you want to explicitly transpile a dependency with Babel, you can list it in this option.                                                                          |
| `css.requireModuleExtension` | `true`        | By default, only files that end in `*.module.[ext]` are treated as CSS modules. Setting this to `false` will allow you to drop `.module` in the filenames and treat all `*.(css\|scss\|sass\|less\|styl(us)?)` files as CSS modules. |
| `css.extract`                | `false`       | Whether to extract CSS in your components into a standalone CSS file (instead of inlined in JavaScript and injected dynamically).                                                                                                    |
| `css.sourceMap`              | `false`       | Whether to enable source maps for CSS. Setting this to `true` may affect build performance.                                                                                                                                          |
| `css.loaderOptions`          | `{}`          | Pass options to CSS-related loaders.                                                                                                                                                                                                 |
| `devServer`                  | `{}`          | All options for `webpack-dev-server` are supported.                                                                                                                                                                                  |

### Browser

`nx build <name> [options]`

| Arguments | Description           |
| --------- | --------------------- |
| `<name>`  | The name of your app. |

| Options                      | Default       | Description                                                                                                                                                                                                                          |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--mode`                     | `development` | Specify env mode (default: development).                                                                                                                                                                                             |
| `--dest`                     | -             | Specify output directory.                                                                                                                                                                                                            |
| `--clean`                    | `true`        | Remove the dist directory before building the project.                                                                                                                                                                               |
| `--report`                   | `false`       | Generate report.html to help analyze bundle content.                                                                                                                                                                                 |
| `--reportJson`               | `false`       | Generate report.json to help analyze bundle content.                                                                                                                                                                                 |
| `--skipPlugins`              | -             | Comma-separated list of plugin names to skip for this run.                                                                                                                                                                           |
| `--watch`                    | `false`       | Watch for changes.                                                                                                                                                                                                                   |
| `--index`                    | -             | The path of a file to use for the application's HTML index. The filename of the specified path will be used for the generated file and will be created in the root of the application's configured output path.                      |
| `--main`                     | -             | The full path for the main entry point to the app, relative to the current workspace.                                                                                                                                                |
| `--tsConfig`                 | -             | The full path for the TypeScript configuration file, relative to the current workspace.                                                                                                                                              |
| `--publicPath`               | `/`           | The base URL your application bundle will be deployed at.                                                                                                                                                                            |
| `--filenameHashing`          | `false`       | Generated static assets contain hashes in their filenames for better caching control.                                                                                                                                                |
| `--productionSourceMap`      | `false`       | Setting this to `false` can speed up production builds if you don't need source maps for production.                                                                                                                                 |
| `--transpileDependencies`    | []            | By default babel-loader ignores all files inside node_modules. If you want to explicitly transpile a dependency with Babel, you can list it in this option.                                                                          |
| `css.requireModuleExtension` | `true`        | By default, only files that end in `*.module.[ext]` are treated as CSS modules. Setting this to `false` will allow you to drop `.module` in the filenames and treat all `*.(css\|scss\|sass\|less\|styl(us)?)` files as CSS modules. |
| `css.extract`                | `false`       | Whether to extract CSS in your components into a standalone CSS file (instead of inlined in JavaScript and injected dynamically).                                                                                                    |
| `css.sourceMap`              | `false`       | Whether to enable source maps for CSS. Setting this to `true` may affect build performance.                                                                                                                                          |
| `css.loaderOptions`          | `{}`          | Pass options to CSS-related loaders.                                                                                                                                                                                                 |
| `--stdin`                    | `false`       | Close when stdin ends.                                                                                                                                                                                                               |

### Library

`nx build <name> [options]`

| Arguments | Description               |
| --------- | ------------------------- |
| `<name>`  | The name of your library. |

| Options                      | Default                | Description                                                                                                                                                                                                                          |
| ---------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--dest`                     | -                      | Specify output directory.                                                                                                                                                                                                            |
| `--clean`                    | `true`                 | Remove the dist directory before building the project.                                                                                                                                                                               |
| `--report`                   | `false`                | Generate report.html to help analyze bundle content.                                                                                                                                                                                 |
| `--reportJson`               | `false`                | Generate report.json to help analyze bundle content.                                                                                                                                                                                 |
| `--skipPlugins`              | -                      | Comma-separated list of plugin names to skip for this run.                                                                                                                                                                           |
| `--watch`                    | `false`                | Watch for changes.                                                                                                                                                                                                                   |
| `--entry`                    | -                      | The full path for the main entry point to your library, relative to the current workspace.                                                                                                                                           |
| `--tsConfig`                 | -                      | The full path for the TypeScript configuration file, relative to the current workspace.                                                                                                                                              |
| `--inlineVue`                | `false`                | Include the Vue module in the final bundle of library.                                                                                                                                                                               |
| `--formats`                  | `commonjs,umd,umd-min` | List of output formats for library builds.                                                                                                                                                                                           |
| `--name`                     | -                      | Name for library.                                                                                                                                                                                                                    |
| `--filename`                 | -                      | File name for output.                                                                                                                                                                                                                |
| `--transpileDependencies`    | []                     | By default babel-loader ignores all files inside node_modules. If you want to explicitly transpile a dependency with Babel, you can list it in this option.                                                                          |
| `css.requireModuleExtension` | `true`                 | By default, only files that end in `*.module.[ext]` are treated as CSS modules. Setting this to `false` will allow you to drop `.module` in the filenames and treat all `*.(css\|scss\|sass\|less\|styl(us)?)` files as CSS modules. |
| `css.extract`                | `true`                 | Whether to extract CSS in your components into a standalone CSS file (instead of inlined in JavaScript and injected dynamically).                                                                                                    |
| `css.sourceMap`              | `false`                | Whether to enable source maps for CSS. Setting this to `true` may affect build performance.                                                                                                                                          |
| `css.loaderOptions`          | `{}`                   | Pass options to CSS-related loaders.                                                                                                                                                                                                 |

### Linting

`nx lint <name> [options]`

We use `@nx/linter` for linting, so the options are as documented [here](https://github.com/nrwl/nx/tree/master/packages/linter).

### Unit Testing

`nx test <name> [options]`

We use `@nx/jest` for unit testing, so the options are as documented [here](https://github.com/nrwl/nx/tree/master/packages/jest).

### E2E Testing

`nx e2e <name> [options]`

We use `@nx/cypress` for e2e testing, so the options are as documented [here](https://github.com/nrwl/nx/tree/master/packages/cypress).

## Modify the Webpack Configuration

Modify the webpack config by exporting an Object or Function from your project's `configure-webpack.js` file.

> If your project does not have a `configure-webpack.js` file, then simply add it at the root of your project.

If the value is an Object, it will be merged into the final config using [`webpack-merge`](https://github.com/survivejs/webpack-merge).

If the value is a function, it will receive the resolved config as the argument. The function can either mutate the config and return nothing, OR return a cloned or merged version of the config.

For more information see the [Vue CLI documentation](https://cli.vuejs.org/config/#configurewebpack).
