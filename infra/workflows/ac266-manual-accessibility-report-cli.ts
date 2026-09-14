import { runAc266ManualAccessibilityReportCli } from './ac266-manual-accessibility-report-cli-core.ts';

const result = await runAc266ManualAccessibilityReportCli(
  process.argv.slice(2),
);
if (result.stdout.length > 0) process.stdout.write(`${result.stdout}\n`);
if (result.stderr.length > 0) process.stderr.write(`${result.stderr}\n`);
process.exitCode = result.exitCode;
