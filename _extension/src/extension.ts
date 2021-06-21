import * as vscode from "vscode";

const typeScriptExtensionId = "vscode.typescript-language-features";
const pluginId = "@unsplash/ts-refactor-tools";

interface TypescriptLanguageServiceApi {
  // https://github.com/microsoft/vscode/blob/9ce9871136d8a969869870907fab4bcc3a12685c/extensions/typescript-language-features/src/api.ts#L29
  getAPI(version: number): {
    // https://github.com/microsoft/vscode/blob/9ce9871136d8a969869870907fab4bcc3a12685c/extensions/typescript-language-features/src/api.ts#L15
    configurePlugin: (pluginId: string, config: unknown) => {};
  };
}

export async function activate(context: vscode.ExtensionContext) {
  const extension =
    vscode.extensions.getExtension<TypescriptLanguageServiceApi>(
      typeScriptExtensionId
    );

  if (!extension) {
    return;
  }

  // https://github.com/microsoft/vscode/blob/main/extensions/typescript-language-features/src/extension.ts#L22
  await extension.activate();
  const api = extension.exports.getAPI(0);
  if (!api) {
    return;
  }

  vscode.workspace.onDidChangeConfiguration(
    (e) => {
      if (e.affectsConfiguration("unsplash.codeActions.namespaceImports")) {
        api.configurePlugin(pluginId, getConfiguration());
      }
    },
    undefined,
    context.subscriptions
  );

  api.configurePlugin(pluginId, getConfiguration());
}

function getConfiguration() {
  return vscode.workspace
    .getConfiguration("unsplash.codeActions")
    .get("namespaceImports", {});
}
