import * as vscode from "vscode";

const typeScriptExtensionId = "vscode.typescript-language-features";
const pluginId = "@unsplash/ts-refactor-tools";

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

  api.configurePlugin({
    pluginName: pluginId,
    configuration: vscode.workspace
      .getConfiguration("unsplash.codeActions")
      .get("namespaceImports", {}),
  });
}
