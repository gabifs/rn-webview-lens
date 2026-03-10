import ts from 'typescript';

export function parse(source: string): ts.SourceFile | null {
  try {
    return ts.createSourceFile(
      'file.tsx',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
  } catch {
    return null;
  }
}
