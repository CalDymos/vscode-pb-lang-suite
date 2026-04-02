import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProcParamName, quotePbString } from "../src/core/parser/tokenizer";

test("normalizeProcParamName strips pointer markers and type suffixes", () => {
  assert.equal(normalizeProcParamName(" *Value.i "), "value");
  assert.equal(normalizeProcParamName("**item.s"), "item");
});

test("normalizeProcParamName keeps plain names and lowercases them", () => {
  assert.equal(normalizeProcParamName("EventFile"), "eventfile");
});

test("quotePbString escapes embedded quotes canonically", () => {
  assert.equal(quotePbString("Hello"), '"Hello"');
  assert.equal(quotePbString('He said "Hi"'), '"He said ""Hi"""');
});
