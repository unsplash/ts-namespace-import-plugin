import * as ts_module from "typescript/lib/tsserverlibrary";

type NamespacesConfig = {
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
  const findChildContainingPosition = (
    sourceFile: ts.SourceFile,
    position: number
  ): ts.Node | undefined => {
    const find = (node: ts.Node): ts.Node | undefined => {
      if (position >= node.getStart() && position <= node.getEnd()) {
        return ts.forEachChild(node, find) ?? node;
      }
    };

    return find(sourceFile);
  };

  function create(info: ts.server.PluginCreateInfo) {
    const namespaceConfig: NamespacesConfig = info.config.namespaces;

    const proxy: ts.LanguageService = Object.create(null);
    const oldLS = info.languageService;
    for (const k in oldLS) {
      (<any>proxy)[k] = function () {
        return oldLS[k].apply(oldLS, arguments);
      };
    }

    proxy.getCodeFixesAtPosition = (
      fileName,
      start,
      end,
      errorCodes,
      formatOptions,
      preferences
    ) => {
      const prior = info.languageService.getCodeFixesAtPosition(
        fileName,
        start,
        end,
        errorCodes,
        formatOptions,
        preferences
      );

      const sourceFile = info.languageService
        .getProgram()
        .getSourceFile(fileName);

      const nodeAtCursor = findChildContainingPosition(
        sourceFile,
        positionOrRangeToNumber({ pos: start, end })
      );

      const text = nodeAtCursor.getText();

      if (
        nodeAtCursor.kind === ts.SyntaxKind.Identifier &&
        Object.keys(namespaceConfig).includes(text)
      ) {
        // Since we're using a codefix, if the namespace is already imported the code fix won't be suggested
        const codeAction = createCodeAction({
          fileName,
          importPath: namespaceConfig[text].importPath,
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

      const nodeAtCursor = findChildContainingPosition(sourceFile, position);
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

      for (const namespaceName of Object.keys(namespace)) {
        if (
          namespaceName.startsWith(text) &&
          findExistingImport(sourceFile, namespaceName) === undefined
        ) {
          const completion: ts_module.CompletionEntry = {
            name: namespaceName,
            // TODO: what does this do?
            // https://github.com/microsoft/TypeScript/blob/92af654a83c497eb35aed7d186b746c8ca4b88fb/src/services/completions.ts#L12
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
                text: config[namespaceName].importPath,
              },
            ],
            data: {
              exportName: namespaceName,
              fileName: config[namespaceName].importPath,
              // TODO: what does this do?
              moduleSpecifier: config[namespaceName].importPath,
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
      for (const namespaceName of Object.keys(config)) {
        if (
          entryName === namespaceName &&
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
            name: namespaceName,
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

  return { create };
}

export = init;
