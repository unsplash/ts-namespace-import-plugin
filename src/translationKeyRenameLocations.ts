import type * as ts_module from "typescript/lib/tsserverlibrary";

import { dirname, resolve } from "path";
import { findChildContainingPosition, positionOrRangeToNumber } from "./utils";

import { tsquery } from "@phenomnomnominal/tsquery";

export const findRenameLocations =
  (
    info: ts_module.server.PluginCreateInfo,
    project: ts_module.server.PluginCreateInfo["project"],
    ts: typeof ts_module
  ): ts.LanguageService["findRenameLocations"] =>
  (
    filename,
    position,
    findInStrings,
    findInComments,
    providePrefixAndSuffixTextForRename
  ) => {
    const prior = info.languageService.findRenameLocations(
      filename,
      position,
      findInStrings,
      findInComments,
      providePrefixAndSuffixTextForRename
    );
    const sourceFile = info.languageService
      .getProgram()
      .getSourceFile(filename);

    const nodeAtCursor = findChildContainingPosition(ts)(
      sourceFile,
      positionOrRangeToNumber(position)
    );
    const a = resolve(
      dirname(sourceFile.fileName),
      "lang/en-US.translations.json"
    );

    const json = project.readFile(a);
    const ast = tsquery.ast(json);
    const maybeNode = tsquery.query(
      ast,
      `StringLiteral[text='${nodeAtCursor.getFullText()}']`
    )[0];

    const renameLocation: ts_module.RenameLocation[] = maybeNode
      ? [
          {
            fileName: a,

            prefixText: '"',
            suffixText: '"',
            textSpan: {
              start: maybeNode.pos,
              length: maybeNode.end - maybeNode.pos,
            },
          },
        ]
      : [];
    return [...renameLocation, ...prior];
  };
