import * as ts_module from "typescript/lib/tsserverlibrary";

const pluginName = "ts-refactor-tools";

const enum RefactorAction {
  ImportNamespace = "import-namespace",
}

function init(modules: { typescript: typeof ts_module }) {
  const ts = modules.typescript;

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

    const proxy = Object.create(null) as ts.LanguageService;
    const oldLS = info.languageService;
    for (const k in oldLS) {
      (<any>proxy)[k] = function () {
        return oldLS[k].apply(oldLS, arguments);
      };
    }

    // TODO: import config from extension
    const config: { [namespace: string]: { importPath: string } } = {
      O: {
        importPath: "path/To/Optiom",
      },
      RemoteData: {
        importPath: "path/to/RemoteData",
      },
    };

    // getCodeFixesAtPosition(fileName: string, start: number, end: number, errorCodes: readonly number[], formatOptions: FormatCodeSettings, preferences: UserPreferences): readonly CodeFixAction[];
    proxy.getCodeFixesAtPosition = (
      filename,
      start,
      end,
      errorCodes,
      formatOptions,
      preferences
    ) => {
      log(`${start}:${end}`);
      const prior = info.languageService.getCodeFixesAtPosition(
        filename,
        start,
        end,
        errorCodes,
        formatOptions,
        preferences
      );

      const sourceFile = info.languageService
        .getProgram()
        .getSourceFile(filename);

      const nodeAtCursor = findChildContainingPosition(
        sourceFile,
        positionOrRangeToNumber({ pos: start, end })
      );

      const text = nodeAtCursor.getText();

      if (
        nodeAtCursor.kind === ts.SyntaxKind.Identifier &&
        nodeAtCursor.parent &&
        nodeAtCursor.parent.kind === ts.SyntaxKind.PropertyAccessExpression &&
        Object.keys(config).includes(text)
      ) {
        const newText = `import * as ${text} from '${config[text].importPath}';\n`;

        // Since we're using a codefix, if the namespace is already imported the code fix won't be suggested
        const codeAction: ts_module.CodeFixAction = {
          fixName: RefactorAction.ImportNamespace,
          description: `import ${text} namespace`,
          changes: [
            {
              fileName: filename,
              textChanges: [
                {
                  newText,
                  span: { start: 0, length: 0 },
                },
              ],
            },
          ],
        };

        return [...prior, codeAction];
      }

      return prior;
    };

    return proxy;
  }

  return { create };
}

export = init;
