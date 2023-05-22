import { tags } from '@angular-devkit/core';
import { checkFilesExist, tmpProjPath } from '@nx/plugin/testing';
import * as cp from 'child_process';
import { runNxCommandAsync } from '@nx/plugin/testing';
//import stripAnsi from 'strip-ansi';

function ansiRegex({ onlyFirst = false } = {}) {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
  ].join('|');

  return new RegExp(pattern, onlyFirst ? undefined : 'g');
}

function stripAnsi(string: string) {
  if (typeof string !== 'string') {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }

  return string.replace(ansiRegex(), '');
}

export async function runNxCommandAsyncStripped(
  ...args: Parameters<typeof runNxCommandAsync>
): ReturnType<typeof runNxCommandAsync> {
  const { stdout, stderr } = await runNxCommandAsync(...args);

  return {
    stdout: stripAnsi(stdout),
    stderr: stripAnsi(stderr),
  };
}

export async function testGeneratedApp(
  appName: string,
  options: {
    lint: boolean;
    test: boolean;
    e2e: boolean;
    build: boolean;
    buildProd: boolean;
  }
): Promise<void> {
  if (options.lint) {
    const lintResult = await runNxCommandAsyncStripped(`lint ${appName}`);
    expect(lintResult.stdout).toContain('All files pass linting.');
  }

  if (options.test) {
    const testResult = await runNxCommandAsyncStripped(`test ${appName}`);
    expect(testResult.stderr).toContain(tags.stripIndent`
      Test Suites: 1 passed, 1 total
      Tests:       1 passed, 1 total
      Snapshots:   0 total
    `);
  }

  if (options.e2e) {
    const e2eResult = await runNxCommandAsyncStripped(`e2e ${appName}-e2e`, {
      silenceError: true,
    });
    expect(e2eResult.stdout).toContain('All specs passed!');
  }

  if (options.build) {
    const buildResult = await runNxCommandAsyncStripped(`build ${appName}`);
    expect(buildResult.stdout).toContain('Build complete.');
    expect(() =>
      checkFilesExist(
        `dist/apps/${appName}/index.html`,
        `dist/apps/${appName}/favicon.ico`,
        `dist/apps/${appName}/js/app.js`
      )
    ).not.toThrow();
  }

  if (options.buildProd) {
    const buildResult = await runNxProdCommandAsync(
      `build ${appName} --prod --filenameHashing false`
    );
    expect(buildResult.stdout).toContain('Build complete.');
    expect(() =>
      checkFilesExist(
        `dist/apps/${appName}/index.html`,
        `dist/apps/${appName}/favicon.ico`,
        `dist/apps/${appName}/js/app.js`,
        `dist/apps/${appName}/js/app.js.map`,
        `dist/apps/${appName}/js/chunk-vendors.js`,
        `dist/apps/${appName}/js/chunk-vendors.js.map`,
        `dist/apps/${appName}/css/app.css`
      )
    ).not.toThrow();
  }
}

// Vue CLI requires `NODE_ENV` be set to `production` to produce
// a production build. Jest sets `NODE_ENV` to `test` by default.
// This function is very similar to `runCommandAsync`.
// https://github.com/nrwl/nx/blob/9.5.1/packages/nx-plugin/src/utils/testing-utils/async-commands.ts#L10
export function runNxProdCommandAsync(command: string): Promise<{
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve, reject) => {
    cp.exec(
      `node ./node_modules/@nrwl/cli/bin/nx.js ${command}`,
      {
        cwd: tmpProjPath(),
        env: { ...process.env, NODE_ENV: 'production' },
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
        }
        resolve({ stdout, stderr });
      }
    );
  });
}
