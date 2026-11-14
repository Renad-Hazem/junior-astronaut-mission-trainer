/**
 * Offline test entry point (no network):
 *   node src/integrations/nasa/__tests__/run.ts
 * Requires Node ≥ 22.18 (or 23.6+) for built-in TypeScript type stripping. Exit code 1 on failure.
 */
import { runAll } from './harness.ts';
import './normalizers.test.ts';
import './clients.test.ts';
import './snapshot.test.ts';
import './bonusMission.test.ts';

const { failed } = await runAll();
const proc = (globalThis as { process?: { exitCode?: number } }).process;
if (failed > 0 && proc) proc.exitCode = 1;
