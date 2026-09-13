import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../src/region-language.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
} });
mkdirSync(new URL('../runtime/', import.meta.url), { recursive: true });
writeFileSync(new URL('../runtime/region-language.js', import.meta.url),
  '// Generated from src/region-language.ts. Do not edit.\n' + outputText);
