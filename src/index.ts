import * as ts_module from "typescript/lib/tsserverlibrary";

const pluginName = "ts-refactor-tools";

function init(modules: { typescript: typeof ts_module }) {
  const ts = modules.typescript;

  function positionOrRangeToRange(
    positionOrRange: number | ts_module.TextRange
  ): ts_module.TextRange {
    return typeof positionOrRange === "number"
      ? { pos: positionOrRange, end: positionOrRange }
      : positionOrRange;
  }

  /**normalize the parameter so we are sure is of type number */
  function positionOrRangeToNumber(
    positionOrRange: number | ts_module.TextRange
  ): number {
    return typeof positionOrRange === "number"
      ? positionOrRange
      : (positionOrRange as ts_module.TextRange).pos;
  }

  /** from given position we find the child node that contains it */
  function findChildContainingPosition(
    sourceFile: ts.SourceFile,
    position: number
  ): ts.Node | undefined {
    function find(node: ts.Node): ts.Node | undefined {
      if (position >= node.getStart() && position < node.getEnd()) {
        return ts.forEachChild(node, find) || node;
      }
    }

    return find(sourceFile);
  }

  function create(info: ts.server.PluginCreateInfo) {
    const log = (msg: any) =>
      info.project.projectService.logger.info(`[${pluginName}] ${msg}`);
    // Set up decorator
    const proxy = Object.create(null) as ts.LanguageService;
    const oldLS = info.languageService;
    for (const k in oldLS) {
      (<any>proxy)[k] = function () {
        return oldLS[k].apply(oldLS, arguments);
      };
    }

    proxy.getApplicableRefactors = (
      filename,
      positionOrRange
    ): ts_module.ApplicableRefactorInfo[] => {
      const refactors = info.languageService.getApplicableRefactors(
        filename,
        positionOrRange,
        undefined
      );

      const sourceFile = info.languageService
        .getProgram()
        .getSourceFile(filename);

      const nodeAtCursor = findChildContainingPosition(
        sourceFile,
        positionOrRangeToNumber(positionOrRange)
      );

      log(nodeAtCursor.kind);

      if (
        nodeAtCursor !== undefined &&
        nodeAtCursor.kind === ts.SyntaxKind.Identifier &&
        nodeAtCursor.parent &&
        [
          ts.SyntaxKind.InterfaceDeclaration,
          ts.SyntaxKind.ClassDeclaration,
        ].includes(nodeAtCursor.parent.kind)
      ) {
        const refactorInfo: ts_module.ApplicableRefactorInfo = {
          name: "useless-rename-info",
          description: "useless rename desc",
          actions: [{ name: "useless-rename", description: "Useless Rename" }],
        };
        refactors.push(refactorInfo);
        return refactors;
      } else {
        return refactors;
      }
    };

    proxy.getEditsForRefactor = (
      fileName,
      formatOptions,
      positionOrRange,
      refactorName,
      actionName,
      preferences
    ) => {
      const refactors = info.languageService.getEditsForRefactor(
        fileName,
        formatOptions,
        positionOrRange,
        refactorName,
        actionName,
        preferences
      );

      log("Execute " + actionName)

      if (actionName !== "useless-rename") {
        return refactors;
      }

      const sourceFile = info.languageService
        .getProgram()
        .getSourceFile(fileName);
      const nodeAtCursor = findChildContainingPosition(
        sourceFile,
        positionOrRangeToNumber(positionOrRange)
      );

      log(`edits: ${nodeAtCursor.kind}`)

      if (
        nodeAtCursor !== undefined &&
        nodeAtCursor.kind === ts.SyntaxKind.Identifier
      ) {
        const renameTo =
          "Beautiful" + (nodeAtCursor as ts.Identifier).escapedText;
        const range = positionOrRangeToRange(positionOrRange);
        return {
          edits: [
            {
              fileName,
              textChanges: [
                {
                  span: { start: range.pos, length: range.end - range.pos }, // the segment of code that will be replaced
                  newText: renameTo,
                },
              ],
            },
          ],
          renameFilename: undefined,
          renameLocation: undefined,
        };
      } else {
        return refactors;
      }
    };

    return proxy;
  }

  return { create };
}

/**normalize the parameter so we are sure is of type Range */

export = init;
