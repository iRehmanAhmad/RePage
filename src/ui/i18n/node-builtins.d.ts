// Minimal ambient declarations for Node builtins used by the i18n scanner
// test. @types/node is not a dependency; these exist at vitest runtime.
// Kept next to the single test file that needs them.
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf-8'): string;
  export function readdirSync(
    path: string,
    options: { withFileTypes: true },
  ): Array<{ name: string; isDirectory(): boolean }>;
}
declare module 'node:path' {
  export function resolve(...parts: string[]): string;
  export function join(...parts: string[]): string;
  export function relative(from: string, to: string): string;
  export function dirname(p: string): string;
}
declare module 'node:url' {
  export function fileURLToPath(url: string): string;
}
