import * as vscode from "vscode";

const typeScriptExtensionId = "vscode.typescript-language-features";
const pluginId = "ts-refactor-tools";

export async function activate(context: vscode.ExtensionContext) {
  const extension = vscode.extensions.getExtension(typeScriptExtensionId);
  if (!extension) {
    return;
  }

  await extension.activate();
  if (!extension.exports || !extension.exports.getAPI) {
    return;
  }
  const api = extension.exports.getAPI(0);
  if (!api) {
    return;
  }

  api.configurePlugin(
    pluginId,
    vscode.workspace
      .getConfiguration("unsplash.codeActions")
      .get("namespaceImports", {})
  );
}

// // Ref https://github.com/microsoft/vscode-extension-samples/tree/main/code-actions-sample

// type Configuration = Partial<{
//   [x: string]: Descriptor;
// }>;

// type Descriptor = {
//   importPath: string;
// };

// export function activate(context: vscode.ExtensionContext) {
//   // TODO: should probably validate? lol
//   const config = vscode.workspace
//     .getConfiguration("unsplash.codeActions")
//     .get<Configuration>("namespaceImports", {});

//   context.subscriptions.push(
//     vscode.languages.registerCodeActionsProvider(
//       "typescript",
//       makeNamespaceCodeActions(config),
//       {
//         providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
//       }
//     )
//   );
// }

// // this method is called when your extension is deactivated
// export function deactivate() {}

// const createFix = (options: {
//   descriptor: Descriptor;
//   descriptorKey: string;
//   document: vscode.TextDocument;
//   range: vscode.Range;
// }): vscode.CodeAction => {
//   const fix = new vscode.CodeAction(
//     `Import ${options.descriptorKey} namespace`,
//     vscode.CodeActionKind.QuickFix
//   );

//   fix.edit = new vscode.WorkspaceEdit();
//   fix.edit.insert(
//     options.document.uri,
//     new vscode.Position(0, 0),
//     `import * as ${options.descriptorKey} from '${options.descriptor.importPath}';\n`
//   );

//   return fix;
// };

// const makeNamespaceCodeActions = (
//   config: Configuration
// ): vscode.CodeActionProvider => ({
//   provideCodeActions: (document, range) => {
//     const line = document.lineAt(range.start.line);
//     const descriptorKey = document.getText(range);
//     const descriptor = config[descriptorKey];

//     if (descriptor !== undefined && line.text[range.end.character] === ".") {
//       return [createFix({ document, range, descriptorKey, descriptor })];
//     } else {
//       return [];
//     }
//   },
// });
