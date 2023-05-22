/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ProjectGraph,
  ProjectGraphProcessorContext,
  ProjectGraphBuilder,
  FileData,
  logger,
} from '@nx/devkit';
import { readdirSync } from 'fs';

import { TypeScriptVueImportLocator } from './TypeScriptVueImportLocator';
import { TargetProjectLocator } from 'nx/src/plugins/js/project-graph/build-dependencies/target-project-locator';

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

function log(text: string) {
  logger.info(/*'test.txt',*/ '[nx-vue]:' + text + '\n');
}

export async function processProjectGraph(
  graph: ProjectGraph,
  context: ProjectGraphProcessorContext
) {
  const filesToProcess = context.filesToProcess;

  if (Object.keys(filesToProcess).length == 0) {
    log('called with no files to process 1');

    // log(JSON.stringify(context.projectsConfigurations.projects[0]));
    log('-------------------------------------------------');

    return graph;
  }

  log('-------------------------------------------------');
  log('Started Processing');

  const importLocator = new TypeScriptVueImportLocator();

  log(JSON.stringify(filesToProcess));

  const targetProjectLocator = new TargetProjectLocator(
    graph.nodes,
    graph?.externalNodes || {}
  );

  //lock this thread for 5 seconds uisng set timeout and promise
  const sleep = (milliseconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

  await sleep(5000);

  const res: {
    sourceProjectName: string;
    targetProjectName: any;
    sourceProjectFile: string;
  }[] = [];
  Object.keys(filesToProcess).forEach((source) => {
    // this seems to be called for when the whole grpah is being re-made
    // so we need to check ALL .vue files in this project
    if (filesToProcess[source].length == 0) {
      log('Processing all files in project: ' + source);
      log('Project files: ' + JSON.stringify(context.fileMap[source]));
      const projectRoot = context.projectsConfigurations.projects[source].root;

      // find all .vue files recursively
      const vueFiles: FileData[] = findVueFilesRecursive(projectRoot).map(
        (f) => {
          return {
            file: f,
            hash: 'abc',
          };
        }
      );

      filesToProcess[source] = vueFiles;
    }

    log(`Processing ${source}...`);
    log(JSON.stringify(filesToProcess[source]));

    try {
      filesToProcess[source].forEach((f) => {
        log(`Processing file ${f.file}...`);

        importLocator.fromFile(f.file, (importExpr: any) => {
          log(`Processing import ${importExpr}...`);

          const target = targetProjectLocator.findProjectWithImport(
            importExpr,
            f.file
          );
          log(`Found target ${target}...`);
          if (target) {
            res.push({
              sourceProjectName: source,
              targetProjectName: target,
              sourceProjectFile: f.file,
            });
          }
        });
      });
    } catch (e) {
      log('Error: ' + e);
      log(JSON.stringify(e));

      return;
    }
  });

  log(`Done processing ${Object.keys(filesToProcess).length} files.`);
  log('----------------------------------');

  //ensure changed files are in the node of the graph
  for (const r of res) {
    if (
      !graph.nodes[r.sourceProjectName].data.files.some(
        (f: FileData) => f.file == r.sourceProjectFile
      )
    ) {
      graph.nodes[r.sourceProjectName].data.files.push(<FileData>{
        file: r.sourceProjectFile,
        hash: 'abc',
      });
    }
  }

  const builder = new ProjectGraphBuilder(graph);

  for (const r of res) {
    //ensure the file is present in the nodes of the builder

    log(
      `addDynamicDependency: ${r.sourceProjectName} -> ${r.targetProjectName} (${r.sourceProjectFile})`
    );
    builder.addDynamicDependency(
      r.sourceProjectName,
      r.targetProjectName,
      r.sourceProjectFile
    );
  }

  //lets write a test file to the root of the project

  return builder.getUpdatedProjectGraph();
}

/**
 *
 * @param dir Find all .vue files and return the path in an array
 */
function findVueFilesRecursive(dir: string): string[] {
  const files = readdirSync(dir, { withFileTypes: true });
  const result: string[] = [];

  for (let i = 0; i < files.length; i++) {
    // if a directory then recurse
    if (files[i].isDirectory()) {
      result.push(...findVueFilesRecursive(path.join(dir, files[i].name)));
    } else if (files[i].name.endsWith('.vue')) {
      result.push(path.join(dir, files[i].name));
    }
  }

  // replace \ with / on all paths
  return result.map((f) => f.replace(/\\/g, '/'));
}
