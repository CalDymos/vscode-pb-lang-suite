import test from "node:test";
import assert from "node:assert/strict";

import {
  PB_WRONG_VARIABLE_NAME_MESSAGE,
  isPbStringLiteralRaw,
  isValidPbVariableReference,
  requiresPbVariableValidation
} from "../src/core/utils/property-validation";

test("accepts PureBasic variable-style identifiers and empty values like FD_CheckVariable", () => {
  assert.equal(isValidPbVariableReference(""), true);
  assert.equal(isValidPbVariableReference("EventProc"), true);
  assert.equal(isValidPbVariableReference("window_caption"), true);
  assert.equal(isValidPbVariableReference("Proc123"), true);
});

test("rejects the characters blocked by the original FD_CheckVariable logic", () => {
  for (const raw of [
    "My Caption",
    "Menu.Item",
    "Event-Proc",
    "path/file",
    "path\\file",
    "Flag|Other",
    "Why?",
    "Bang!",
    "user@example",
    "£Value",
    "$Value",
    "a=b"
  ]) {
    assert.equal(isValidPbVariableReference(raw), false, raw);
  }
});

test("does not require variable validation for quoted PureBasic string literals", () => {
  assert.equal(isPbStringLiteralRaw('"Hello World"'), true);
  assert.equal(isPbStringLiteralRaw('~"Line 1\\nLine 2"'), true);
  assert.equal(requiresPbVariableValidation('"Hello World"'), false);
  assert.equal(requiresPbVariableValidation('~"Line 1\\nLine 2"'), false);
});

test("requires variable validation for non-literal raw expressions", () => {
  assert.equal(requiresPbVariableValidation("WindowTitleVar"), true);
  assert.equal(requiresPbVariableValidation("Menu.Item"), true);
  assert.equal(requiresPbVariableValidation(undefined), false);
  assert.equal(requiresPbVariableValidation("   "), false);
});

test("exposes the shared wrong-variable-name message for inspector and provider errors", () => {
  assert.match(PB_WRONG_VARIABLE_NAME_MESSAGE, /Wrong variable name/i);
  assert.match(PB_WRONG_VARIABLE_NAME_MESSAGE, /Spaces and/);
});


test("isValidPbVariableReference rejects leading and trailing spaces without trimming", () => {
  assert.equal(isValidPbVariableReference(" MyVar"), false);
  assert.equal(isValidPbVariableReference("MyVar "), false);
  assert.equal(isValidPbVariableReference("MyVar"), true);
});
