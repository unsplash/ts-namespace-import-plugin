import type * as ts_module from "typescript/lib/tsserverlibrary";

import { Configuration, RefactorAction } from "./Config";
import { dirname, resolve } from "path";
import { findChildContainingPosition, positionOrRangeToNumber } from "./utils";

import { execSync } from "child_process";

export const getApplicableRefactors =
  (
    info: ts_module.server.PluginCreateInfo,
    ts: typeof ts_module
  ): ts.LanguageService["getApplicableRefactors"] =>
  (filename, positionOrRange) => {
    const refactors =
      info.languageService.getApplicableRefactors(
        filename,
        positionOrRange,
        undefined
      ) || [];
    const sourceFile = info.languageService
      .getProgram()
      .getSourceFile(filename);
    const refactorInfo: ts_module.ApplicableRefactorInfo = {
      name: RefactorAction.CreateTranslationKeys,
      description: "Extract keys to the translation file",
      actions: [
        {
          name: RefactorAction.CreateTranslationKeys,
          description: "Extract keys to the translation file",
        },
      ],
    };
    const nodeAtCursor = findChildContainingPosition(ts)(
      sourceFile,
      positionOrRangeToNumber(positionOrRange)
    );
    if (nodeAtCursor.kind === ts.SyntaxKind.StringLiteral) {
      refactors.push(refactorInfo);
    }
    return refactors;
  };
export const getEditsForRefactor =
  (
    info: ts_module.server.PluginCreateInfo,
    ls: ts_module.server.PluginCreateInfo["project"],
    ts: typeof ts_module
  ): ts.LanguageService["getEditsForRefactor"] =>
  (
    filename,
    formatOptions,
    positionOrRange,
    refactorName,
    actionName,
    preferences
  ) => {
    const refactors = info.languageService.getEditsForRefactor(
      filename,
      formatOptions,
      positionOrRange,
      refactorName,
      actionName,
      preferences
    );
    if (actionName !== RefactorAction.CreateTranslationKeys) {
      return refactors;
    }
    const sourceFile = info.languageService
      .getProgram()
      .getSourceFile(filename);

    const nodeAtCursor = findChildContainingPosition(ts)(
      sourceFile,
      positionOrRangeToNumber(positionOrRange)
    );

    const translationFileName = resolve(
      dirname(sourceFile.fileName),
      "lang/en-US.translations.json"
    );

    // TODO use the ts ast to transform this
    const json = JSON.parse(ls.readFile(translationFileName));

    const text = nodeAtCursor.getText();

    const variableName = text
      //Remove special chars
      .replace(/[^a-zA-Z ]/g, "")
      .split(" ")
      //Only keep first two words in the sentence
      .slice(0, 4)
      .join(" ")
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());

    info.project.writeFile(
      translationFileName,
      JSON.stringify({
        ...json,
        // We remove first and last char with the slice to remove the quotes
        [variableName]: { message: text.slice(1, -1) },
      })
    );
    execSync(
      `yarn -s intlc compile ${translationFileName} -l en-US > ${resolve(
        dirname(sourceFile.fileName),
        "lang/en-US.tsx"
      )}`
    );
    const codeAction: ts_module.RefactorEditInfo = {
      renameFilename: filename,
      renameLocation: nodeAtCursor.end - 3,
      edits: [
        {
          fileName: filename,
          textChanges: [
            {
              newText: `t.${variableName}()`,
              span: {
                start: nodeAtCursor.pos,
                length: nodeAtCursor.end - nodeAtCursor.pos,
              },
            },
          ],
        },
      ],
    };

    return codeAction;
  };
