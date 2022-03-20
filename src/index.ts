import * as ts_module from "typescript/lib/tsserverlibrary";

type Configuration = {
  [namespace: string]: {
    importPath: string;
  };
};

const enum RefactorAction {
  ImportNamespace = "import-namespace",
}

function init(modules: { typescript: typeof ts_module }) {
  let config: Configuration = {};
  const ts = modules.typescript;

  /** normalize the parameter so we are sure is of type number */
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

  // This function is needed to set the config at loading time as well as any further updates.
  function onConfigurationChanged(newConfig: Configuration) {
    config = newConfig;
  }

  function create(info: ts.server.PluginCreateInfo) {
    const proxy = Object.create(null) as ts.LanguageService;
    const oldLS = info.languageService;
    for (const k in oldLS) {
      (<any>proxy)[k] = function () {
        return oldLS[k].apply(oldLS, arguments);
      };
    }

    proxy.getCodeFixesAtPosition = (
      filename,
      start,
      end,
      errorCodes,
      formatOptions,
      preferences
    ) => {
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
        Object.keys(config).includes(text)
      ) {
        const newText = `import * as ${text} from '${config[text].importPath}';\n`;

        // Since we're using a codefix, if the namespace is already imported the code fix won't be suggested
        const codeAction: ts_module.CodeFixAction = {
          fixName: RefactorAction.ImportNamespace,
          description: `Add namespace import of "${config[text].importPath}"`,
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

  return { create, onConfigurationChanged };
}

export = init;
