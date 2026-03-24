import test from "node:test";
import assert from "node:assert/strict";

import { getDefaultToolboxPanelKind, getToolboxPanelCategories } from "../src/core/toolboxPanelUtils";

test("toolbox panel categories follow the verified original group order", () => {
  const categories = getToolboxPanelCategories();
  assert.deepEqual(
    categories.map(category => category.title),
    ["Common Controls", "Containers", "Menus & Toolbars"]
  );
});

test("toolbox panel keeps the verified gadget order within the containers group", () => {
  const containers = getToolboxPanelCategories().find(category => category.title === "Containers");
  assert.ok(containers);
  if (!containers) {
    throw new Error("Containers toolbox category is missing.");
  }
  assert.deepEqual(
    containers.items.map(item => item.label),
    ["Cursor", "Container", "Frame", "Panel", "ScrollArea", "Splitter"]
  );
});

test("default toolbox panel kind stays on the first selectable common control", () => {
  assert.equal(getDefaultToolboxPanelKind(), "ButtonGadget");
});
