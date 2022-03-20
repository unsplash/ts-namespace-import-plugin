import * as ts_module from "typescript/lib/tsserverlibrary";

type Configuration = {
  [namespace: string]: {
    importPath: string;
  };
};

const enum RefactorAction {
  ImportNamespace = "import-namespace",
}

const createCodeAction = ({
  namespaceName,
  importPath,
  fileName,
}: {
  namespaceName: string;
  importPath: string;
  fileName: string;
}): ts_module.CodeFixAction => {
  const newText = `import * as ${namespaceName} from '${importPath}';\n`;

  return {
    fixName: RefactorAction.ImportNamespace,
    description: `Add namespace import of "${importPath}"`,
    changes: [
      {
        fileName,
        textChanges: [
          {
            newText,
            span: { start: 0, length: 0 },
          },
        ],
      },
    ],
  };
};

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
        // Since we're using a codefix, if the namespace is already imported the code fix won't be suggested
        const codeAction = createCodeAction({
          fileName: filename,
          importPath: config[text].importPath,
          namespaceName: text,
        });

        return [...prior, codeAction];
      }

      return prior;
    };

    proxy.getCompletionsAtPosition = (fileName, position, options) => {
      const prior = info.languageService.getCompletionsAtPosition(
        fileName,
        position,
        options
      );

      const sourceFile = info.languageService
        .getProgram()
        .getSourceFile(fileName);

      const nodeAtCursor = findChildContainingPosition(
        sourceFile,
        /**
         * We presume the cursor is at the end of the identifier that's being
         * typed. We have to subtract 1 from the position so the position is
         * inside of the identifier in order for this function to return the
         * identifier node.
         *
         * ```js
         * const x = Foo|
         * //           ^ cursor
         * ```
         */
        position - 1
      );
      const text = nodeAtCursor.getText();

      const findExistingImport = (
        sourceFile: ts.SourceFile,
        name: string
      ): ts.Node | undefined => {
        const find = (node: ts.Node): ts.Node | undefined =>
          ts_module.isNamespaceImport(node) && node.name.getText() === name
            ? node
            : ts.forEachChild(node, find);

        return find(sourceFile);
      };

      const extras: ts_module.CompletionEntry[] = [];

      for (const configEntry of Object.keys(config)) {
        if (
          configEntry.startsWith(text) &&
          findExistingImport(sourceFile, configEntry) === undefined
        ) {
          const completion: ts_module.CompletionEntry = {
            name: configEntry,
            // TODO: what does this do?
            sortText: "15",
            // TODO: what does this do?
            kind: ts_module.ScriptElementKind.variableElement,
            // TODO: what does this do?
            kindModifiers: "",
            // TODO: if we set this, completion doesn't show for some reason
            // hasAction: true,
            sourceDisplay: [
              {
                kind: ts_module.SymbolDisplayPartKind[
                  ts_module.SymbolDisplayPartKind.text
                ],
                text: config[configEntry].importPath,
              },
            ],
            data: {
              exportName: configEntry,
              fileName: config[configEntry].importPath,
              // TODO: what does this do?
              moduleSpecifier: config[configEntry].importPath,
            },
          };

          extras.push(completion);
        }
      }

      prior.entries = [...extras, ...prior.entries];

      return prior;
    };

    proxy.getCompletionEntryDetails = (
      fileName,
      position,
      entryName,
      formatOptions,
      source,
      preferences,
      data
    ) => {
      for (const configEntry of Object.keys(config)) {
        if (
          entryName === configEntry &&
          // This is used to distinguish the auto import completion from other
          // completions (e.g. standard text completions) with the same entry
          // name.
          data !== undefined &&
          data.fileName !== undefined
        ) {
          const codeAction: ts_module.CodeFixAction = createCodeAction({
            fileName,
            importPath: data.fileName,
            namespaceName: data.exportName,
          });

          return {
            name: configEntry,
            codeActions: [codeAction],
            // TODO: what does this do?
            displayParts: [],
            // TODO: what does this do?
            kind: ts_module.ScriptElementKind.variableElement,
            // TODO: what does this do?
            kindModifiers: "",
          };
        }
      }

      return info.languageService.getCompletionEntryDetails(
        fileName,
        position,
        entryName,
        formatOptions,
        source,
        preferences,
        data
      );
    };

    return proxy;
  }

  return { create, onConfigurationChanged };
}

export = init;
