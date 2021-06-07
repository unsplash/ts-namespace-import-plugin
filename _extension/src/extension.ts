// Ref https://github.com/microsoft/vscode-extension-samples/tree/main/code-actions-sample
import * as vscode from "vscode";

type Configuration = Partial<{
  [x: string]: Descriptor;
}>;

type Descriptor = {
  importPath: string;
};

export function activate(context: vscode.ExtensionContext) {
  // TODO: should probably validate? lol
  const config = vscode.workspace
    .getConfiguration("unsplash.codeActions")
    .get<Configuration>("namespaceImports", {});

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      "typescript",
      makeNamespaceCodeActions(config),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
      }
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

const createFix = (options: {
  descriptor: Descriptor;
  descriptorKey: string;
  document: vscode.TextDocument;
  range: vscode.Range;
}): vscode.CodeAction => {
  const fix = new vscode.CodeAction(
    `Import ${options.descriptorKey} namespace`,
    vscode.CodeActionKind.QuickFix
  );

  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.insert(
    options.document.uri,
    new vscode.Position(0, 0),
    `import * as ${options.descriptorKey} from '${options.descriptor.importPath}';\n`
  );

  return fix;
};

const makeNamespaceCodeActions = (
  config: Configuration
): vscode.CodeActionProvider => ({
  provideCodeActions: (document, range) => {
    const line = document.lineAt(range.start.line);
    const descriptorKey = document.getText(range);
    const descriptor = config[descriptorKey];

    if (descriptor !== undefined && line.text[range.end.character] === ".") {
      return [createFix({ document, range, descriptorKey, descriptor })];
    } else {
      return [];
    }
  },
});
