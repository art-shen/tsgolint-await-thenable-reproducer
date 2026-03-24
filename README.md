# tsgolint await-thenable false positive

`oxlint`'s `typescript/await-thenable` rule fires on `await using` statements that TypeScript compiles without errors.

## Run it

```bash
bun install
bun run typecheck   # passes — TypeScript accepts this code
bun run lint        # fails — typescript/await-thenable on both await using lines
```

CI shows both results at once.

## The trigger

`tsconfig.json` includes `src/` but not `tests/`. When tsgolint lints `tests/`, the
false positive fires on user-defined types. The same code placed in `src/` does not
trigger it.

```typescript
// tests/await-using.ts — not in tsconfig include

interface Connection extends AsyncDisposable {
  query(sql: string): Promise<unknown[]>;
}
declare const conn: Connection;
export async function withConnection() {
  await using _ = conn; // typescript/await-thenable — false positive
}
```

Types from `@types/*` packages — part of the base program — are not affected.
`Bun.Subprocess extends AsyncDisposable` in `bun.d.ts` works correctly in the same
file. Only user-defined types in the excluded file fire the rule.

## Why it fires

When tsgolint lints a file not covered by the tsconfig `include`, it adds that file as
an extra root to the TypeScript-Go program. The property name for `[Symbol.asyncDispose]`
appears to be resolved differently during that extra-root processing than it is when the
`await-thenable` rule later looks it up — likely because the global `Symbol` constructor
is not yet accessible in the extra-root binding pass.

The PR #822 fix switches `GetWellKnownSymbolPropertyOfType` from exact-name lookup to
prefix matching, which handles both the fallback form (`\xFE@asyncDispose`) and the
ID-based form (`\xFE@asyncDispose@<n>`).

## Versions

- oxlint `1.56.0`
- oxlint-tsgolint `0.17.3`
- TypeScript `5.x`

## Related

- Fix: https://github.com/oxc-project/tsgolint/pull/822
