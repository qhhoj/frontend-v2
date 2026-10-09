// `typescript` is imported here for the scan only; just specs import this file, so it stays out of the app bundle.
import ts from 'typescript';

export interface HandWrittenType {
  name: string;
  line: number;
  reason: string;
}

/** An object shape written out (`{ ... }`, a mapped type) anywhere inside the type. */
function hasObjectShape(node: ts.Node): boolean {
  return (
    ts.isTypeLiteralNode(node) ||
    ts.isMappedTypeNode(node) ||
    !!ts.forEachChild(node, (child) => hasObjectShape(child) || undefined)
  );
}

/** A literal (`'vi'`, `-1`, a template string) as the type or as a member of a top-level union or intersection; `null` is allowed. */
function hasLiteralMember(node: ts.TypeNode): boolean {
  if (ts.isLiteralTypeNode(node)) return node.literal.kind !== ts.SyntaxKind.NullKeyword;
  if (ts.isTemplateLiteralTypeNode(node)) return true;
  if (ts.isParenthesizedTypeNode(node)) return hasLiteralMember(node.type);
  if (ts.isUnionTypeNode(node) || ts.isIntersectionTypeNode(node))
    return node.types.some(hasLiteralMember);
  return false;
}

/** The `@uiOnly <reason>` JSDoc tag marks a shape the backend does not own, with the reason written down. */
function isUiOnly(statement: ts.Statement): boolean {
  return ts
    .getJSDocTags(statement)
    .some(
      (tag) => tag.tagName.text === 'uiOnly' && !!ts.getTextOfJSDocComment(tag.comment)?.trim(),
    );
}

function violationOf(statement: ts.Statement): { name: string; reason: string } | null {
  if (ts.isInterfaceDeclaration(statement))
    return { name: statement.name.text, reason: 'an interface is a hand-written shape' };
  if (ts.isEnumDeclaration(statement) || ts.isClassDeclaration(statement))
    return {
      name: statement.name?.text ?? '(anonymous)',
      reason: 'an enum or class is hand-written',
    };
  if (!ts.isTypeAliasDeclaration(statement)) return null;
  const name = statement.name.text;
  if (hasObjectShape(statement.type)) return { name, reason: 'an object shape is spelled out' };
  if (hasLiteralMember(statement.type))
    return { name, reason: 'a literal union copies a backend enumeration' };
  return null;
}

/**
 * The declarations of an `src/api/types` file that are not aliases of the generated schema: interfaces, enums, classes,
 * object shapes and literal unions, unless tagged `@uiOnly <reason>`. Constants are not types and are left alone.
 */
export function findHandWrittenTypes(sourceText: string): HandWrittenType[] {
  const file = ts.createSourceFile('types.ts', sourceText, ts.ScriptTarget.ES2022, true);
  return file.statements.flatMap((statement) => {
    const found = isUiOnly(statement) ? null : violationOf(statement);
    if (!found) return [];
    const { line } = file.getLineAndCharacterOfPosition(statement.getStart(file));
    return [{ ...found, line: line + 1 }];
  });
}
