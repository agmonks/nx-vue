import * as path from 'path';
import { stripSourceCode } from './stripSourceCode';
import { DependencyType } from 'nx/src/config/project-graph';
import { defaultFileRead } from 'nx/src/project-graph/file-utils';
import {
  forEachChild,
  isCallExpression,
  isExportDeclaration,
  isImportDeclaration,
  isStringLiteral,
  SyntaxKind,
  Node,
  createSourceFile,
  ScriptTarget,
  createScanner,
  Scanner,
  Identifier,
  StringLiteral,
  PropertyName,
  PropertyAssignment,
} from 'typescript';

/**
 * This class is derived from TypeScriptImportLocator in nx:
 * https://github.com/nrwl/nx/blob/05a9544806e8573bac5eef542a8e8c1b6115dc18/packages/nx/src/project-graph/build-dependencies/typescript-import-locator.ts
 */
export class TypeScriptVueImportLocator {
  private readonly scanner: Scanner;

  constructor() {
    this.scanner = createScanner(ScriptTarget.Latest, false);
  }

  fromFile(
    filePath: string,
    visitor: (
      importExpr: string,
      filePath: string,
      type: DependencyType
    ) => void
  ): void {
    const extension = path.extname(filePath);
    if (extension !== '.vue') {
      return;
    }
    const content = defaultFileRead(filePath);

    if (!content) {
      return;
    }

    const strippedContent = stripSourceCode(this.scanner, content);
    if (strippedContent !== '') {
      const tsFile = createSourceFile(
        filePath,
        strippedContent,
        ScriptTarget.Latest,
        true
      );
      this.fromNode(filePath, tsFile, visitor);
    }
  }

  fromNode(
    filePath: string,
    node: Node,
    visitor: (
      importExpr: string,
      filePath: string,
      type: DependencyType
    ) => void
  ): void {
    if (
      isImportDeclaration(node) ||
      (isExportDeclaration(node) && node.moduleSpecifier)
    ) {
      if (!this.ignoreStatement(node) && node.moduleSpecifier) {
        const imp = this.getStringLiteralValue(node.moduleSpecifier);
        visitor(imp, filePath, DependencyType.static);
      }
      return; // stop traversing downwards
    }

    if (
      isCallExpression(node) &&
      node.expression.kind === SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      isStringLiteral(node.arguments[0])
    ) {
      if (!this.ignoreStatement(node)) {
        const imp = this.getStringLiteralValue(node.arguments[0]);
        visitor(imp, filePath, DependencyType.dynamic);
      }
      return;
    }

    if (
      isCallExpression(node) &&
      node.expression.getText() === 'require' &&
      node.arguments.length === 1 &&
      isStringLiteral(node.arguments[0])
    ) {
      if (!this.ignoreStatement(node)) {
        const imp = this.getStringLiteralValue(node.arguments[0]);
        visitor(imp, filePath, DependencyType.static);
      }
      return;
    }

    if (node.kind === SyntaxKind.PropertyAssignment) {
      const name = this.getPropertyAssignmentName(
        (node as PropertyAssignment).name
      );
      if (name === 'loadChildren') {
        const init = (node as PropertyAssignment).initializer;
        if (
          init.kind === SyntaxKind.StringLiteral &&
          !this.ignoreLoadChildrenDependency(node.getFullText())
        ) {
          const childrenExpr = this.getStringLiteralValue(init);
          visitor(childrenExpr, filePath, DependencyType.dynamic);
          return; // stop traversing downwards
        }
      }
    }

    /**
     * Continue traversing down the AST from the current node
     */
    forEachChild(node, (child: Node) =>
      this.fromNode(filePath, child, visitor)
    );
  }

  private ignoreStatement(node: Node) {
    return stripSourceCode(this.scanner, node.getFullText()) === '';
  }

  private ignoreLoadChildrenDependency(contents: string): boolean {
    this.scanner.setText(contents);
    let token = this.scanner.scan();
    while (token !== SyntaxKind.EndOfFileToken) {
      if (
        token === SyntaxKind.SingleLineCommentTrivia ||
        token === SyntaxKind.MultiLineCommentTrivia
      ) {
        const start = this.scanner.getStartPos() + 2;
        token = this.scanner.scan();
        const isMultiLineCommentTrivia =
          token === SyntaxKind.MultiLineCommentTrivia;
        const end =
          this.scanner.getStartPos() - (isMultiLineCommentTrivia ? 2 : 0);
        const comment = contents.substring(start, end).trim();
        if (comment === 'nx-ignore-next-line') {
          return true;
        }
      } else {
        token = this.scanner.scan();
      }
    }
    return false;
  }

  private getPropertyAssignmentName(nameNode: PropertyName) {
    switch (nameNode.kind) {
      case SyntaxKind.Identifier:
        return (nameNode as Identifier).getText();
      case SyntaxKind.StringLiteral:
        return (nameNode as StringLiteral).text;
      default:
        return null;
    }
  }

  private getStringLiteralValue(node: Node): string {
    return node.getText().slice(1, -1);
  }
}
