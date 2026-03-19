# Changelog

## 0.13.0

### Fixed

- Preview: menu entry captions containing embedded quotes are now displayed correctly instead of being truncated or showing raw escape sequences.
- Preview: menu entry shortcuts are no longer incorrectly split off when the caption contains an embedded quote.
- Editor: failed workspace edits are now surfaced as an error and abort the operation instead of silently continuing with a partial update.

### Internal

- Extracted hit-test logic, chrome layout helpers, preview utils, and menu move logic from the main webview module into dedicated, fully-tested core utility modules.
- Build: removed redundant `compile` step from the VSIX packaging script.

---

## 0.12.0

### Added

- **Inline editors**: All prompt-based dialogs have been replaced with inline panels directly in the properties section — no more browser-style pop-ups.
  - Menu entries: edit constant, name, shortcut, and image inline in the inspector.
  - Toolbar entries: edit tooltip, toggle flag, and image inline in the inspector.
  - Statusbar fields: edit width, text, progress bar, flags, and image inline in the inspector.
  - Gadget items and columns: inline draft editor with save/cancel flow.
  - Image assignment and destructive delete/clear actions now show inline confirmation panels.
- **Status bar flag checkboxes**: Alignment and style flags (`#PB_StatusBar_*`) can now be toggled individually via checkboxes instead of typing raw flag expressions.
- **Discrete add buttons**: "Add" actions for menus, toolbars, and statusbars now offer separate buttons per type (e.g. *Add Item / Add Title / Add SubMenu / Add Separator*) instead of a single combined prompt.

### Changed

- Toolbar entries: bound `ToolBarToolTip` entries are now hidden from the structure list and only visible via the selected entry inspector, reducing visual noise.
- Inspector panel: selecting a menu entry, toolbar entry, or statusbar field now shows only the *Selected Entry / Field* panel without the full container structure list behind it.

---

## 0.11.0

### Added

- **PureBasic 6.30 syntax support**: The editor now correctly parses and emits `CreateImageMenu`, `CreateToolbar` (lowercase b), and `Chr(9)`-concatenated shortcut syntax used by the PB 6.30 form designer.
- **Menu drag-and-drop**: Menu entries can be reordered by dragging directly in the canvas preview. Entire subtrees move together; entries can be dropped before/after siblings or appended into an empty submenu.
- **Add buttons in the canvas preview**: Inline `+` buttons now appear in the menu bar, toolbar, and statusbar preview areas for quick insertion without leaving the canvas.
- **Section delete**: Entire menu, toolbar, or statusbar sections can be deleted from the properties panel with a confirmation step.
- **Font management**: `LoadFont` entries are parsed, shown in the properties panel, and can be inserted, updated, or deleted. The `FormFont` enumeration block is kept in sync automatically.
- **FormMenu / FormGadget enum blocks**: The editor now manages PureBasic `Enumeration FormMenu` and `Enumeration FormGadget` blocks, keeping them consistent across all insert, rename, and delete operations.

### Fixed

- Toolbar emitter: `ToolBarImageButton` entries are now emitted correctly for PB 6.30 format, including paired `ToolBarToolTip` lines that are co-deleted or id-synced on rename.
- Menu emitter: shortcuts now use the PB 6.30 `Chr(9)` concatenation format; `CreateImageMenu` is now recognised in all patch operations.
- Statusbar emitter: `AddStatusBarField` and its decoration line are now emitted per-field in the correct order.
- Image and font blocks are now inserted at the correct position relative to custom gadget initialisation markers.
- Double blank lines no longer appear after block replace operations (font, image, statusbar field).
- Menu enum block is now correctly inserted before an existing `FormImage` block.

---

## 0.10.0

### Added

- **Event bindings**: Gadget, menu entry, and toolbar entry event procedures can now be viewed and edited directly in the properties panel.
- **Window event settings**: Event file (`XIncludeFile`), event procedure name, and the *Generate Event Loop* toggle are now editable in the window properties panel.
- **Generate event loop guard**: The *Generate Event Loop* checkbox is disabled with an explanatory hint when disabling it would destroy existing `Case` branches or an event menu block.
- **Image management panel**: `LoadImage` and `CatchImage` entries are shown in a dedicated *Images* section with cross-reference counts per entry.
  - Navigate from any gadget, menu entry, toolbar entry, or statusbar field directly to its referenced image.
  - Insert, update, and delete images from the panel.
  - Toggle between `LoadImage` and `CatchImage` inline.
  - Toggle between a named enum ID and a `#PB_Any` variable.
  - Make image paths relative to the current form file.
  - Choose an image file via a system file dialog; gadgets can be auto-resized to match the image dimensions.
  - Create new image entries with auto-generated IDs and assign them in one step.

---

## 0.9.0

### Added

- **Extended window model**: Caption (literal or variable), background color, hidden/disabled state, parent window reference, event file, event procedure, and custom flags are now parsed and reflected in the properties panel.
- **Extended gadget model**: Text content, tooltip, state, front/back colors, font, hidden/disabled flags, image references, min/max range values, and splitter child references are now fully parsed.
- **Menu / toolbar / statusbar detail parsing**: Menu shortcuts and icon references, toolbar toggle flags and paired tooltip text, and statusbar field decorations (text label, progress bar, image) are now fully parsed.
- **Canvas chrome for container gadgets**: Panel gadget tabs, ScrollArea scrollbars (with drag scrolling), Splitter separator bar (draggable), FrameGadget and ContainerGadget borders are now rendered in the canvas preview.
- **Nested gadget layout engine**: Nested gadgets are laid out within their container's content area; clip regions prevent child gadgets from drawing outside their parent bounds.
- **Splitter position editing**: The splitter position can be set directly via a number input in the properties panel.
- **Menu bar / toolbar / statusbar chrome**: Menu bar, toolbar, and statusbar are now rendered in the canvas preview with selection highlighting; the gadget layout area is offset to account for their height.
- **Window and gadget property emitters**: `HideWindow`, `DisableWindow`, `SetWindowColor`, `HideGadget`, `DisableGadget`, `GadgetToolTip`, `SetGadgetColor` (front + back), `SetGadgetState`, and `SetGadgetFont` are now written back to the source file when changed.
- **Gadget constructor argument editing**: Text, image reference, min/max range, flags, and splitter child references can be edited in the properties panel and are written back to the `OpenGadget` call in the source file.
- **Menu, toolbar, and statusbar emitters**: Insert, update, and delete operations for menu entries, toolbar entries, and statusbar fields are now fully implemented with roundtrip accuracy.

### Fixed

- EOF insert offset corrected in the internal `fakeTextDocument` test helper.

---

## 0.8.2

### Fixed

- Fixed: remove extensionDependencies to prevent activation failure

## 0.8.1

### Changed

- updated README.md

## 0.8.0

### Added

- Added pb-lang-support as extensionDependencies for .pbf text mode.

### Changed

- .pbf text mode now prefers the purebasic language (pb-lang-support).
- Switching between text and designer mode now closes the opposite tab type to prevent duplicate editors.

### Internal

- Updated extension.ts to handle language detection and fallback logic.