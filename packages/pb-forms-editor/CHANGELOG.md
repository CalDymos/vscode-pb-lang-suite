# Changelog

## 0.17.0

### Added

- **Designer settings**: New extension settings control gadget insertion behaviour, version compatibility warnings, and the OS skin used for the canvas preview:
  - *New gadgets use #PB_Any by default* — controls whether inserted gadgets use `#PB_Any` or an enum constant.
  - *New gadgets use variable as caption* — makes newly inserted gadgets write their caption as a variable reference instead of a string literal; the override survives model reloads for gadgets that still hold an empty default caption.
  - *Generate event procedure* — controls whether an event procedure is generated on insert.
  - *OS Skin* — selects the platform skin (Windows / Linux / macOS) for the canvas preview independently of the host OS.
  - *Warning modes* for unrecognized form files and version upgrades/downgrades.
  - *Windows frame padding* values (captionless top, client side, client bottom) are now configurable instead of hardcoded.
- **Color picker for window background color**: The window Color property now shows a native color swatch picker alongside the raw value field, with a *Remove* button to clear `SetWindowColor`.
- **Editable CurrentImage for statusbar fields**: The CurrentImage field in the statusbar inspector is now editable — typing an existing image ID rebinds the field and optionally removes the orphaned old entry; typing a file path auto-creates a new `LoadImage` entry.
- **Editable CurrentImage for toolbar entries**: Same direct-edit / rebind / auto-create flow now available for toolbar `ToolBarImageButton` entries.
- **Workspace-aware procedure discovery**: SelectProc autocomplete now picks up procedure names from all `.pb`/`.pbi` files in the workspace folder and refreshes automatically when files are created, deleted, or renamed.

### Fixed

- Whitespace around raw values is now preserved throughout the inspector — variable names, proc names, menu shortcuts, toolbar text, and ID fields no longer have surrounding spaces silently stripped.
- Hidden/Disabled checkboxes on the window inspector now use the parsed boolean value correctly instead of coercing the raw string.
- Window variable name field no longer clears accidentally when submitting an empty value.
- Window Color field is now read-only (picker and Remove are the only write paths), preventing invalid expressions from being written to the source.
- Window SelectProc is now always editable — the event loop block is created on demand.
- The *Generate events procedure* toggle no longer blocks when case branches exist; the guard is removed.
- EventMenu case assignments now propagate to all matching menu and toolbar entries when an ID is shared across both.
- Menu and toolbar SelectProc fields remain editable even without an EventMenu block; a hint explains the write-back limitation.
- Partial statusbar field updates (e.g. image-only) no longer overwrite unrelated sibling fields (text, progress, flags).
- Status bar progress bar preview now renders with a proper filled track, border, and shadow instead of a plain rectangle.
- Menu flyout entries that extend beyond the window boundary are now hit-testable.
- Selecting a gadget in the hierarchy list now activates the ancestor panel tabs so the gadget is visible in the canvas.
- No-op rect posts (drag without movement) are suppressed; panel tab state is retained across model refreshes.
- Delete buttons added to the selected menu entry, toolbar entry, and statusbar field inspector sections.
- `CloseSubMenu` insert is now guarded — the *Add Close* button is disabled when no unmatched `OpenSubMenu` exists.
- Inserting a child into a leaf `MenuItem` now automatically promotes it to `OpenSubMenu/CloseSubMenu`.
- Inserting into an empty submenu with a comment before `CloseSubMenu` no longer fails the section-boundary check.

---

## 0.16.0

### Added

- **Toolbox panel**: The *Insert Gadget* kind selector has been replaced with a scrollable toolbox tree organized into categories (*Common Controls*, *Containers*, *Menus & Toolbars*). Each item shows the original PureBasic IDE icon and a label. A single click enters placement mode; a double-click inserts at a default position immediately.
- **Insert gadget from the canvas**: After selecting a gadget kind in the toolbox, click anywhere on the canvas to place it. The insert respects snap-to-grid and automatically targets nested containers (Panel, ScrollArea, Container, FrameGadget with `#PB_Frame_Container`). The cursor changes to a crosshair during placement; press Escape to cancel.
- **Delete gadget**: A *Delete Gadget* button (and canvas right-click menu option) removes a gadget along with all its children, property lines, event bindings, and enum/global block entries in one atomic edit.
- **Gadget reparent**: A *Change Parent* button in the gadget inspector opens a dialog to move the gadget (and its children) into a different container or panel tab. X/Y coordinates are reset to 0,0 on reparent.
- **SplitterGadget insert**: Selecting *SplitterGadget* in the toolbox opens a two-gadget picker dialog. If the chosen gadgets are in a different parent than the target, they are automatically reparented before the splitter is inserted.
- **Canvas right-click context menu**: Right-clicking a menu entry, toolbar entry, or statusbar field in the canvas opens a context menu with delete and insert-type actions. Destructive actions show a modal confirmation dialog.
- **FrameGadget as container**: `FrameGadget` with the `#PB_Frame_Container` flag is now recognised as a valid insert and delete host, consistent with PureBasic's own form designer.

### Fixed

- Gadget property lines (`SetGadgetState`, `HideGadget`, `DisableGadget`, etc.) are now moved together with the gadget when reparenting.
- `CustomGadget` marker lines (creation call, init code, init marker) are now fully removed when deleting a custom gadget or a container that holds one.
- Splitter child gadgets that are referenced by a surviving splitter are correctly skipped during partial deletes.

---

## 0.15.0

### Added

- **Window title bar in canvas preview**: The canvas now renders a platform-accurate title bar including close, maximize, and minimize buttons (driven by `#PB_Window_SystemMenu`, `#PB_Window_MinimizeGadget`, `#PB_Window_MaximizeGadget` flags), a window icon placeholder (Windows skin), and correct title text clipping.
- **Resize lock editing**: LockLeft / LockRight checkboxes in the gadget inspector are now editable — toggling builds or removes the `ResizeGadget` call with the correct right-anchor (`FormWindowWidth - N`) or stretch-width formula. LockTop / LockBottom are also editable when the necessary bottom-anchor or stretch-height formula can be derived from the existing source expressions.
- **Resize grip**: A three-line diagonal resize grip is rendered in the bottom-right corner of the window preview.
- **Windows skin chrome accuracy**: The canvas now renders narrow left/right client-side frame strips, a bottom frame strip, a tinted captionless padding area (for windows without a title bar), and a subtle border around the client surface — all matching the Windows skin dimensions.

### Fixed

- The title bar is now hidden for borderless or tool windows (no `#PB_Window_SystemMenu` / `#PB_Window_TitleBar` flag) instead of always being shown.
- Status bar progress bar preview metrics corrected (track dimensions and fill width).

---

## 0.14.0

### Added

- **Window inspector overhaul**: The window properties panel now exposes all editable window properties:
  - *Caption* field with a *Caption is variable* toggle.
  - Known window flag checkboxes (`#PB_Window_SystemMenu`, `#PB_Window_TitleBar`, etc.) and a *Custom Flags* free-text field.
  - *Hidden* and *Disabled* checkboxes.
  - *Parent* field with a *Parent as raw expression* toggle (bypasses `WindowID()` wrapping).
  - *Color* field (validated; color picker added in 0.17.0).
  - *X / Y* position fields with `#PB_Ignore` support.
  - *Width / Height*, *Constants*, and *Event* sections.
- **Gadget inspector — caption and tooltip**: Caption and tooltip fields are now editable with a *Caption/Tooltip is variable* toggle. Supported caption labels vary by gadget kind (e.g. *Mask* for DateGadget, *Callback* for ScintillaGadget).
- **Gadget inspector — colors and font**: Front color, back color, and font are shown as editable / display fields in the gadget properties panel.
- **Gadget inspector — range fields**: Min/Max fields (with kind-specific labels such as *Inner Width/Height* for ScrollAreaGadget) are editable for ProgressBar, ScrollBar, Spin, TrackBar, and ScrollArea gadgets.
- **Gadget inspector — checked state**: A *Checked* checkbox is shown for `CheckBoxGadget` and `OptionGadget` and writes `#PB_Checkbox_Checked` / `"1"` to the source.
- **Gadget inspector — resize locks (display)**: LockLeft, LockRight, LockTop, and LockBottom flags parsed from `ResizeGadget` calls are displayed as read-only checkboxes (editable in 0.15.0).
- **CustomGadget inspector**: SelectGadget (editable combo), InitCode, CreateCode, and Help fields are shown in the inspector for `CustomGadget` entries.
- **SelectProc autocomplete**: All SelectProc fields (window, gadget, menu entry, toolbar entry) now use an editable combo input with autocomplete suggestions drawn from procedure names found in the `.pbf` document and its event file sibling.
- **Info panel**: A context-aware info panel above the properties panel shows a one-line selection summary and a contextual hint for every selection kind.
- **Resizable properties panel**: A draggable vertical divider between the canvas and the properties panel allows customizing the split (300–900 px).

### Internal

- `ResizeGadget` raw parameter expressions are now stored on the gadget model and can be patched in-place without touching the constructor geometry.
- Raw rect parameters (`xRaw`, `yRaw`, `wRaw`, `hRaw`) stored on both `Gadget` and `FormWindow` model entries.

---

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