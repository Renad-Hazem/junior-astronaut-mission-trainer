/**
 * Dependency-free test harness (the repo has no test runner, and package.json must not change
 * without approval). Runs under Node ≥ 22.18 / 24 type stripping:
 *   node src/integrations/nasa/__tests__/run.ts
 * Uses no Node-only APIs so the files still type-check under tsconfig.app.json.
 */
type TestFn = () => void | Promise<void>;

const registry: { name: string; fn: TestFn }[] = [];

export function test(name: string, fn: TestFn): void {
  registry.push({ name, fn });
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function assertEqual<T>(actual: T, expected: T, label = 'value'): void {
  if (!Object.is(actual, expected)) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertDeepEqual(actual: unknown, expected: unknown, label = 'value'): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${label}: expected ${e}, got ${a}`);
}

export async function runAll(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;
  for (const t of registry) {
    try {
      await t.fn();
      passed += 1;
      console.log(`  ✓ ${t.name}`);
    } catch (e) {
      failed += 1;
      console.log(`  ✗ ${t.name}\n      ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// ---------------------------------------------------------------------------
// Fake fetch helpers
// ---------------------------------------------------------------------------

export interface FakeFetch {
  (input: string, init?: RequestInit): Promise<Response>;
  calls: string[];
}

/** Route by substring of the URL; unmatched URLs get a 404. */
export function fakeFetch(routes: Record<string, () => Response | Promise<Response>>): FakeFetch {
  const calls: string[] = [];
  const fn = (async (input: string) => {
    calls.push(input);
    const key = Object.keys(routes).find((k) => input.includes(k));
    return key ? routes[key]() : new Response('not found', { status: 404 });
  }) as FakeFetch;
  fn.calls = calls;
  return fn;
}

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const text = (body: string, status = 200): Response =>
  new Response(body, { status, headers: { 'content-type': 'text/plain' } });

/** A fetch that never answers until its signal aborts (to exercise timeouts/aborts). */
export function hangingFetch(): FakeFetch {
  const calls: string[] = [];
  const fn = ((input: string, init?: RequestInit) => {
    calls.push(input);
    return new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('The operation was aborted.', 'AbortError')));
    });
  }) as FakeFetch;
  fn.calls = calls;
  return fn;
}

export const FIXED_NOW = () => new Date('2026-11-14T12:00:00Z');
