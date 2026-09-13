import { describe, expect, it } from 'vitest';

import {
  executableIntakeWorkflow,
  executableWorkflow,
  expectCleanupGuard,
  header,
  jobConfigurationBeforeSteps,
  namedStep,
  requiredStringInput,
  retentionDays,
  secretReferences,
  shellRunBlocks,
  stripSourceComments,
  unpinnedExternalActions,
  uploadSteps,
} from './ac266-manual-accessibility-workflow-contract-helpers.ts';

describe('AC266 manual accessibility intake workflow contract', () => {
  it('uses a GitHub-hosted runner and sets up the pinned workspace before report secrets', () => {
    const runnerConfiguration = jobConfigurationBeforeSteps(
      executableIntakeWorkflow,
    );
    expect(runnerConfiguration).toMatch(/^\s{4}runs-on:\s*ubuntu-24\.04\s*$/mu);
    expect(runnerConfiguration).not.toMatch(/\b(?:self-hosted|wejammin)\b/iu);

    const checkoutStep = namedStep(
      executableIntakeWorkflow,
      'Check out the approved workflow revision',
    );
    const setupStep = namedStep(
      executableIntakeWorkflow,
      'Set up pinned workspace dependencies',
    );
    expect(checkoutStep).toContain('ref: ${{ github.sha }}');
    expect(checkoutStep).toContain('persist-credentials: false');
    expect(setupStep).toMatch(
      /^\s{8}uses:\s*\.\/\.github\/actions\/setup\s*$/mu,
    );
    const checkoutIndex = executableIntakeWorkflow.indexOf(checkoutStep);
    const setupIndex = executableIntakeWorkflow.indexOf(setupStep);
    const secretIndexes = [
      executableIntakeWorkflow.indexOf(
        '${{ secrets.AC266_VOICEOVER_REPORT_BASE64 }}',
      ),
      executableIntakeWorkflow.indexOf(
        '${{ secrets.AC266_NVDA_REPORT_BASE64 }}',
      ),
    ];
    expect(setupIndex).toBeGreaterThan(checkoutIndex);
    expect(secretIndexes.every((index) => index > setupIndex)).toBe(true);
  });

  it('counts block-style and inline artifact uploads while ignoring comments', () => {
    const inlineUpload =
      '\n      - { name: unexpected, uses: actions/upload-artifact@' +
      `${'a'.repeat(40)} }`;
    const commentedUpload =
      '\n#      - name: comment-only upload\n#        uses: actions/upload-artifact@not-pinned';
    expect(uploadSteps(`${executableWorkflow}${inlineUpload}`)).toHaveLength(2);
    expect(
      uploadSteps(
        stripSourceComments(`${executableWorkflow}${commentedUpload}`),
      ),
    ).toHaveLength(1);
  });

  it('sets runner-scoped private paths only in the materialization and cleanup steps', () => {
    expect(jobConfigurationBeforeSteps(executableWorkflow)).not.toContain(
      'runner.temp',
    );
    expect(jobConfigurationBeforeSteps(executableIntakeWorkflow)).not.toContain(
      'runner.temp',
    );

    const verifierStep = namedStep(
      executableWorkflow,
      'Strictly verify staging, intake provenance, and protected reports',
    );
    const finalizerCleanupStep = namedStep(
      executableWorkflow,
      'Remove private raw reports before evidence upload',
    );
    const materializerStep = namedStep(
      executableIntakeWorkflow,
      'Materialize and validate manual report secrets',
    );
    const intakeCleanupStep = namedStep(
      executableIntakeWorkflow,
      'Remove private raw reports before manifest upload',
    );

    for (const step of [verifierStep, finalizerCleanupStep]) {
      expect(step).toContain('RUNNER_TEMP: ${{ runner.temp }}');
      expect(step).toContain(
        'AC266_PRIVATE_EVIDENCE_DIR: ${{ runner.temp }}/ac266-private-evidence-',
      );
    }
    expect(verifierStep).toContain(
      'AC266_MANUAL_REPORT_DIRECTORY: ${{ runner.temp }}/ac266-private-evidence-',
    );
    for (const step of [materializerStep, intakeCleanupStep]) {
      expect(step).toContain('RUNNER_TEMP: ${{ runner.temp }}');
      expect(step).toContain(
        'AC266_PRIVATE_EVIDENCE_DIR: ${{ runner.temp }}/ac266-private-evidence-',
      );
    }
  });

  it('materializes and validates raw reports from protected secrets without publishing them', () => {
    const intakeHeader = header(executableIntakeWorkflow);
    expect(intakeHeader).toMatch(/^\s{2}workflow_dispatch:\s*$/mu);
    expect(intakeHeader).not.toMatch(
      /^\s{2}(?:push|pull_request|pull_request_target|workflow_run|schedule|release):/mu,
    );
    expect(executableIntakeWorkflow).toMatch(
      /environment:\s*(?:\{[^\n}]*name:\s*ac266-manual-evidence|\n\s+name:\s*ac266-manual-evidence)/u,
    );
    expect(executableIntakeWorkflow).toContain(
      'permissions: { contents: read }',
    );
    expect(executableIntakeWorkflow).toContain('GITHUB_REPOSITORY');
    expect(executableIntakeWorkflow).toContain('GITHUB_RUN_ID');
    expect(executableIntakeWorkflow).toContain('GITHUB_RUN_ATTEMPT');
    expect(executableIntakeWorkflow).toContain('GITHUB_SHA');
    for (const input of ['voiceover_report_sha256', 'nvda_report_sha256'])
      expect(requiredStringInput(intakeHeader, input), input).toBe(true);
    expect(executableIntakeWorkflow).toContain(
      'AC266_EXPECTED_VOICEOVER_REPORT_SHA256: ${{ inputs.voiceover_report_sha256 }}',
    );
    expect(executableIntakeWorkflow).toContain(
      'AC266_EXPECTED_NVDA_REPORT_SHA256: ${{ inputs.nvda_report_sha256 }}',
    );
    expect(executableIntakeWorkflow).toContain(
      'AC266_VOICEOVER_REPORT_BASE64: ${{ secrets.AC266_VOICEOVER_REPORT_BASE64 }}',
    );
    expect(executableIntakeWorkflow).toContain(
      'AC266_NVDA_REPORT_BASE64: ${{ secrets.AC266_NVDA_REPORT_BASE64 }}',
    );
    expect(secretReferences(executableIntakeWorkflow)).toEqual([
      'AC266_NVDA_REPORT_BASE64',
      'AC266_VOICEOVER_REPORT_BASE64',
    ]);
    expect(executableIntakeWorkflow).toContain(
      'node --experimental-strip-types infra/workflows/materialize-ac266-manual-accessibility-intake.ts',
    );
    expect(executableIntakeWorkflow).toContain('AC266_PRIVATE_EVIDENCE_DIR');
    expect(executableIntakeWorkflow).toContain('manual/intake-manifest.json');
    expect(intakeHeader).not.toMatch(
      /^ {6}(?!voiceover_report_sha256:|nvda_report_sha256:)[a-z0-9_-]*(?:voiceover|nvda|report|base64|json)[a-z0-9_-]*:\s*$/imu,
    );
    expect(executableIntakeWorkflow).not.toMatch(
      /^\s*(?:echo|printf)\b[^\n]*AC266_(?:VOICEOVER|NVDA)_REPORT_BASE64/imu,
    );
    expect(shellRunBlocks(executableIntakeWorkflow).join('\n')).not.toMatch(
      /AC266_(?:VOICEOVER|NVDA)_REPORT_BASE64|\$\{\{\s*secrets\./u,
    );

    const materializerCommand =
      'node --experimental-strip-types infra/workflows/materialize-ac266-manual-accessibility-intake.ts';
    const materializerIndex =
      executableIntakeWorkflow.indexOf(materializerCommand);
    const cleanupIndex = executableIntakeWorkflow.indexOf(
      'rm -rf -- "$AC266_PRIVATE_EVIDENCE_DIR"',
    );
    const uploadIndex = executableIntakeWorkflow.indexOf(
      'uses: actions/upload-artifact@',
    );
    expect(cleanupIndex).toBeGreaterThan(materializerIndex);
    expect(cleanupIndex).toBeLessThan(uploadIndex);
    expect(
      namedStep(
        executableIntakeWorkflow,
        'Remove private raw reports before manifest upload',
      ),
    ).toMatch(/if:\s*(?:\$\{\{\s*)?always\(\)/u);
    expectCleanupGuard(executableIntakeWorkflow, cleanupIndex);

    const uploads = uploadSteps(executableIntakeWorkflow);
    expect(uploads).toHaveLength(1);
    for (const upload of uploads) {
      expect(upload).toContain('name: ac266-manual-accessibility-intake');
      expect(upload).toContain('path: manual/intake-manifest.json');
      expect(upload).not.toContain('manual/voiceover-safari.json');
      expect(upload).not.toContain('manual/nvda-firefox.json');
    }

    const retention = retentionDays(executableIntakeWorkflow);
    expect(retention.length).toBeGreaterThan(0);
    expect(retention.every((days) => days >= 1 && days <= 30)).toBe(true);
  });

  it('uses pinned actions and permits only the two manual evidence secrets', () => {
    expect(executableWorkflow).not.toBe('');
    expect(executableIntakeWorkflow).not.toBe('');
    for (const source of [executableWorkflow, executableIntakeWorkflow]) {
      expect(unpinnedExternalActions(source)).toEqual([]);
      expect(source).not.toMatch(/\bwrangler\s+deploy\b/iu);
      expect(source).not.toMatch(
        /\bsupabase\s+db\s+(?:push|reset|migrate)\b/iu,
      );
      expect(source).not.toMatch(
        /\b(?:CLOUDFLARE|SUPABASE)_[A-Z0-9_]*(?:TOKEN|KEY|SECRET|PASSWORD)\b/u,
      );
    }
    expect(secretReferences(executableWorkflow)).toEqual([
      'AC266_NVDA_REPORT_BASE64',
      'AC266_VOICEOVER_REPORT_BASE64',
    ]);
    expect(secretReferences(executableIntakeWorkflow)).toEqual([
      'AC266_NVDA_REPORT_BASE64',
      'AC266_VOICEOVER_REPORT_BASE64',
    ]);
    expect(shellRunBlocks(executableWorkflow).join('\n')).not.toMatch(
      /AC266_(?:VOICEOVER|NVDA)_REPORT_BASE64|\$\{\{\s*secrets\./u,
    );
    expect(shellRunBlocks(executableIntakeWorkflow).join('\n')).not.toMatch(
      /AC266_(?:VOICEOVER|NVDA)_REPORT_BASE64|\$\{\{\s*secrets\./u,
    );
  });
});
