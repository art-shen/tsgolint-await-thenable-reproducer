// Reproducer for: https://github.com/oxc-project/tsgolint/issues/830
// Related fix:    https://github.com/oxc-project/tsgolint/pull/822
//
// tsc --noEmit:        passes — TypeScript accepts all patterns below
// oxlint --type-aware: fails  — false positives on patterns 1 and 2 (not 3)

// Pattern 1: interface directly declaring [Symbol.asyncDispose]
interface Resource {
  data: string;
  [Symbol.asyncDispose](): Promise<void>;
}
declare const r: Resource;
export async function withResource() {
  await using _ = r; // false positive: typescript/await-thenable
}

// Pattern 2: interface extending AsyncDisposable
interface Connection extends AsyncDisposable {
  query(sql: string): Promise<unknown[]>;
}
declare const conn: Connection;
export async function withConnection() {
  await using _ = conn; // false positive: typescript/await-thenable
}

// Contrast: Bun.Subprocess extends AsyncDisposable in bun.d.ts (@types/bun).
// Types from @types/* packages are part of the base TypeScript program and
// do NOT trigger the false positive — only user-defined types in this file do.
declare const proc: Bun.Subprocess;
export async function withSubprocess() {
  await using _ = proc; // correct: no error
}
