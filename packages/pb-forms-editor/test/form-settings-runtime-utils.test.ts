import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyConfiguredFormVersionWarnings,
  MISSING_FORM_DESIGNER_HEADER_ISSUE,
  resolvePreviewPlatformFromOsSkin
} from '../src/core/formSettingsRuntimeUtils';

test('resolvePreviewPlatformFromOsSkin maps configured OS skins to preview platforms', () => {
  assert.equal(resolvePreviewPlatformFromOsSkin('windows7'), 'windows');
  assert.equal(resolvePreviewPlatformFromOsSkin('windows8'), 'windows');
  assert.equal(resolvePreviewPlatformFromOsSkin('linux'), 'linux');
  assert.equal(resolvePreviewPlatformFromOsSkin('macos'), 'macos');
});

test('configured unrecognised-file warnings can suppress the parser header warning', () => {
  const issues = applyConfiguredFormVersionWarnings(
    [{ severity: 'warning', message: MISSING_FORM_DESIGNER_HEADER_ISSUE, line: 0 }],
    undefined,
    {
      warningUnrecognizedFile: 'never',
      warningVersionUpgrade: 'ifBackwardCompatibilityIsAffected',
      warningVersionDowngrade: 'always'
    }
  );

  assert.deepEqual(issues, []);
});

test('configured downgrade warnings follow the original always/never switch', () => {
  const header = { version: '6.40', line: 3, hasStrictSyntaxWarning: true };

  const warnIssues = applyConfiguredFormVersionWarnings([], header, {
    warningUnrecognizedFile: 'always',
    warningVersionUpgrade: 'ifBackwardCompatibilityIsAffected',
    warningVersionDowngrade: 'always'
  });
  assert.equal(warnIssues.length, 1);
  assert.match(warnIssues[0]?.message ?? '', /downgrade/i);

  const mutedIssues = applyConfiguredFormVersionWarnings([], header, {
    warningUnrecognizedFile: 'always',
    warningVersionUpgrade: 'ifBackwardCompatibilityIsAffected',
    warningVersionDowngrade: 'never'
  });
  assert.deepEqual(mutedIssues, []);
});

test('configured upgrade warnings respect the original breaking-only mode', () => {
  const nonBreakingHeader = { version: '6.21', line: 3, hasStrictSyntaxWarning: true };
  const breakingHeader = { version: '6.10', line: 3, hasStrictSyntaxWarning: true };

  const breakingOnlyNonBreaking = applyConfiguredFormVersionWarnings([], nonBreakingHeader, {
    warningUnrecognizedFile: 'always',
    warningVersionUpgrade: 'ifBackwardCompatibilityIsAffected',
    warningVersionDowngrade: 'always'
  });
  assert.deepEqual(breakingOnlyNonBreaking, []);

  const breakingOnlyBreaking = applyConfiguredFormVersionWarnings([], breakingHeader, {
    warningUnrecognizedFile: 'always',
    warningVersionUpgrade: 'ifBackwardCompatibilityIsAffected',
    warningVersionDowngrade: 'always'
  });
  assert.equal(breakingOnlyBreaking.length, 1);
  assert.match(breakingOnlyBreaking[0]?.message ?? '', /backward compatibility/i);

  const alwaysWarn = applyConfiguredFormVersionWarnings([], nonBreakingHeader, {
    warningUnrecognizedFile: 'always',
    warningVersionUpgrade: 'always',
    warningVersionDowngrade: 'always'
  });
  assert.equal(alwaysWarn.length, 1);
  assert.match(alwaysWarn[0]?.message ?? '', /upgrade/i);
});
