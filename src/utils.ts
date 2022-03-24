import type * as ts_module from "typescript/lib/tsserverlibrary";
/** normalize the parameter so we are sure is of type number */
export function positionOrRangeToNumber(
  positionOrRange: number | ts_module.TextRange
): number {
  return typeof positionOrRange === "number"
    ? positionOrRange
    : (positionOrRange as ts_module.TextRange).pos;
}

export function positionOrRangeToRange(
  positionOrRange: number | ts_module.TextRange
): ts_module.TextRange {
  return typeof positionOrRange === "number"
    ? { pos: positionOrRange, end: positionOrRange }
    : positionOrRange;
}

/** from given position we find the child node that contains it */
export const findChildContainingPosition =
  (ts: typeof ts_module) =>
  (sourceFile: ts.SourceFile, position: number): ts.Node | undefined => {
    function find(node: ts.Node): ts.Node | undefined {
      if (position >= node.getStart() && position < node.getEnd()) {
        return ts.forEachChild(node, find) || node;
      }
    }

    return find(sourceFile);
  };
