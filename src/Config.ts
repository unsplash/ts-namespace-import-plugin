export type Configuration = {
  [namespace: string]: {
    importPath: string;
  };
};

export const enum RefactorAction {
  ImportNamespace = "import-namespace",
  CreateTranslationKeys = "create-translation-keys",
}
