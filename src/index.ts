import * as ts_module from "typescript/lib/tsserverlibrary";
import { tsquery } from "@phenomnomnominal/tsquery";
import * as ts2 from "typescript";
import { dirname, relative, resolve } from "path";
import { findChildContainingPosition, positionOrRangeToNumber } from "./utils";
import { Configuration, RefactorAction } from "./Config";
import {
  getApplicableRefactors,
  getEditsForRefactor,
} from "./translationKeyRefactor";
import { findRenameLocations } from "./translationKeyRenameLocations";

function init(modules: { typescript: typeof ts_module }) {
  let config: Configuration = {};
  const ts = modules.typescript;

  // This function is needed to set the config at loading time as well as any further updates.
  function onConfigurationChanged(newConfig: Configuration) {
    config = newConfig;
  }

  function create(info: ts.server.PluginCreateInfo) {
    const proxy = Object.create(null) as ts.LanguageService;
    const logger = (msg: string) =>
      info.project.projectService.logger.info(`[ts-graphql-plugin] ${msg}`);

    logger("a");
    const oldLS = info.languageService;
    for (const k in oldLS) {
      (<any>proxy)[k] = function () {
        return oldLS[k].apply(oldLS, arguments);
      };
    }

    proxy.findRenameLocations = findRenameLocations(info, info.project, ts);
    proxy.getApplicableRefactors = getApplicableRefactors(info, ts);

    proxy.getEditsForRefactor = getEditsForRefactor(info, info.project, ts);

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

      const nodeAtCursor = findChildContainingPosition(ts)(
        sourceFile,
        positionOrRangeToNumber({ pos: start, end })
      );

      const text = nodeAtCursor.getText();
      // throw new Error(JSON.stringify(Object.keys(config)));
      if (
        nodeAtCursor.kind === ts.SyntaxKind.Identifier &&
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
    };
    return proxy;
  }

  return { create, onConfigurationChanged };
}

export = init;
