import * as ts_module from "typescript/lib/tsserverlibrary";

function init(modules: { typescript: typeof ts_module }) {
  const ts = modules.typescript;

  function create(info: ts.server.PluginCreateInfo) {
    // Diagnostic logging
    info.project.projectService.logger.info(
      "This message will appear in your logfile if the plugin loaded correctly"
    );

    // Set up decorator
    const proxy = Object.create(null) as ts.LanguageService;
    const oldLS = info.languageService;
    for (const k in oldLS) {
      (<any>proxy)[k] = function () {
        return oldLS[k].apply(oldLS, arguments);
      };
    }

    // Remove specified entries from completion list
    proxy.getCompletionsAtPosition = (fileName, position, options) => {
      const prior = info.languageService.getCompletionsAtPosition(
        fileName,
        position,
        options
      );
      prior.entries = prior.entries.filter((e) => e.name !== "caller");
      return prior;
    };

    return proxy;
  }

  return { create };
}

export = init;
