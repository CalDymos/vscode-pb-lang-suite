# Changelog

## 0.23.0

### Added

- **Gadget Constants section**: The gadget inspector now shows a *Constants* section with a checkbox per known PureBasic flag for the selected gadget kind (e.g. `#PB_Button_Default`, `#PB_String_Password`, `#PB_Panel_TabBar`). Toggling a flag rebuilds the `flagsExpr` in the original PureBasic constant order while preserving any unknown custom tail flags.
- **Color pickers for FrontColor / BackColor**: The gadget *FrontColor Raw* and *BackColor Raw* text inputs are replaced with a read-only display field, a native color swatch picker, and a *Remove* button — matching the window color picker introduced in 0.17.0. The picker writes `RGB(...)` literals; Remove clears the property.
- **Disabled gadget overlay**: A translucent overlay is now drawn over disabled gadgets in the canvas preview to make their disabled state visually obvious at a glance.

### Fixed

- Hidden gadgets are no longer drawn in the canvas preview, matching the original PureBasic IDE behavior. A gadget with a non-literal `HideGadget` expression (e.g. a variable) is treated as visible to avoid false hiding.
- Hidden gadgets that are selected still show their blue selection frame and resize handles even though the gadget content itself is not drawn.
- Setting *Hidden*, *Disabled*, or *Checked* on one gadget/window property no longer silently clears unrelated properties. Property updates are now partial — only the fields explicitly present in the message are written.
- Window selection overlay (border highlight) is now aligned correctly on macOS and Windows 7 rounded-border previews; previously the outline was drawn with a different stroke rect than the actual outer frame.
- Source range offsets no longer drift on CRLF documents; `buildLineStartOffsets` now scans raw newline positions instead of using split lines.
- Splitter child gadgets are now correctly included when deleting a container subtree that also contains the owning SplitterGadget.
- `appendWorkspaceEdit` now falls back to rebuilding edits from `entries()` when `getOperations()` is unavailable, fixing gadget delete in some VS Code host environments.

### Changed

- *Delete Gadget* button moved from the bottom to a new *Actions* section at the top of the gadget properties panel.
- Window resize in the canvas is now restricted to the right and bottom edges only, matching the original PureBasic Form Designer behavior (top and left edges can no longer be dragged, and the window cannot be moved by dragging the title bar).

---

## 0.22.0

### Added

- **DPI-aware layout**: When VS Code is running on a HiDPI display (e.g. 150% scaling), the canvas and inspector now correctly handle the scale factor:
  - Gadget and window X/Y/W/H values are shown in the inspector as their logical (unscaled) display values; a read-only *Unscaled* row is shown alongside when scaling is active.
  - Dragging or resizing a gadget on the canvas writes the correct unscaled integer back to the source file.
  - Splitter position and ScrollArea *InnerWidth/InnerHeight* fields are also DPI-scaled and display the corrected values.
- **Nested gadget resize locks**: LockLeft/LockRight/LockTop/LockBottom are now editable for gadgets inside a `ContainerGadget` or `ScrollAreaGadget`, emitting `GadgetWidth(#Parent) - N` / `GadgetHeight(#Parent) - N` anchor formulas. `PanelGadget` children use `GetGadgetAttribute(#Panel, #PB_Panel_ItemWidth/Height)` formulas with a per-skin tab header height correction.
- **Toolbar Y expression preservation**: The canvas and insert paths now preserve `ToolBarHeight(N) + Y` expressions in the gadget Y coordinate so that gadgets anchored to the toolbar do not lose their formula on every edit.

### Fixed

- Resize lock formula values are now correctly unscaled via the active DPI scale before being written to the source, preventing off-by-scale errors on HiDPI displays.
- Per-toggle lock probing in the inspector enables asymmetric lock editing — LockLeft and LockRight can now be toggled independently when only one direction's formula can be derived.

---

## 0.21.0

### Added

- **Gadget font rendering**: Gadgets that display text now apply the font family, size, and style flags (`#PB_Font_Bold`, `#PB_Font_Italic`, `#PB_Font_Underline`, `#PB_Font_StrikeOut`) assigned via `SetGadgetFont` to the canvas preview. Underline and strikeout decorations are drawn explicitly after each `fillText` call.
- **Text variable captions shown with brackets**: When a gadget's caption is set via a variable (rather than a string literal), the preview now renders it as `[variableName]` in brackets, matching the original PureBasic Form Designer display.
- **Raster assets for remaining gadget kinds**: The following gadget previews now use original-style raster icons with vector fallbacks:
  - *Combo boxes*: per-skin drop-down arrow (Windows 7/Linux, Windows 8) and macOS double-arrow for non-editable combos.
  - *Spin gadget*: macOS and Windows 8 spin button images.
  - *Trackbar*: macOS and Windows 7/Linux thumb images; macOS groove highlight lines and no-ticks guide fill.
  - *Scrollbar*: per-skin arrow button images (Windows 7/Linux, Windows 8) and split-fill thumb layout (Windows 7/Linux).
  - *Date gadget*: per-skin dropdown arrow (reuses combo arrow assets on Windows 7/8; separate arrow on macOS/Linux).
  - *macOS/Linux title buttons*: raster close/minimize/maximize icons replace the previous circle and glyph fallbacks.
- **macOS external menu bar**: On the macOS skin the menu bar is now rendered as a full-canvas-width band above the window body (matching the macOS system behavior), with gadget hit-testing and layout adjusted accordingly. The window title is centered across the full window width on macOS.
- **Selection outline for toolbar separators and flyout MenuBar separators**: Selected `ToolBarSeparator` entries now show a visible selection outline in the canvas. Flyout `MenuBar` separator entries also draw a selection outline when selected.

### Fixed

- Text heights across all gadget preview draw paths (string, button, combo, spin, list rows, list headers, frame caption, date gadget, menu bar entries, menu flyout entries) are now derived from the actual measured canvas text height rather than the nominal font size in points, ensuring correct vertical centering at all font sizes.
- Menu flyout shortcut and footer text are now rendered at full opacity; the previous 0.72 and 0.92 alpha values had no original justification.
- Menu bar entry rect height and width now use measured text dimensions rather than hardcoded constants, improving accuracy at non-default font sizes.
- macOS `FrameGadget` caption body border Y offset now uses measured text height instead of a hardcoded constant.
- Toolbar separator hit rect width narrowed from 10 px to 6 px to match the visible separator line and prevent overlap with adjacent entries.
- macOS maximize button raster asset corrected.
- Windows 7 menu bar palette colors now blend the Windows skin *Menu* and *MenuBar* system colors into the original gradient palette instead of using hardcoded values.
- Windows frame stroke colors and inner client border now prefer skin-derived system colors (`ButtonShadow`, `ActiveTitle`, `GradientActiveTitle`) over hardcoded fallbacks.

---

## 0.20.0

### Added

- **Gadget #PB_Any toggle in the inspector**: The gadget *Details* section now has an editable *#PB_Any* checkbox and *Variable* input.
  - Switching from an enum constant to `#PB_Any` removes the enum entry from `Enumeration FormGadget`, inserts a `Global` declaration, rewrites the constructor call, and updates all usages of the variable in the procedure scope.
  - Switching back from `#PB_Any` to an enum constant reverses all of the above.
  - Renaming the variable or enum symbol propagates to the constructor, all in-procedure call sites, and the `FormGadget` enum block.
- **#PB_Any toggle for assigned images**: Image assignments in the statusbar field, toolbar entry, menu entry, and gadget image inspector now offer a *#PB_Any* checkbox — switching converts the named enum ID to a `#PB_Any` variable (or back) and updates all `ImageID(...)` references in the form.

### Fixed

- Menu bar is now drawn on top of gadget previews instead of beneath them, so menu chrome no longer appears behind overlapping gadgets.
- Windows registry color loading is now asynchronous — reading `HKCU\Control Panel\Colors` no longer blocks the extension host during editor startup; colors are sent to the webview after the initial render.
- Procedure name discovery is now asynchronous — workspace-wide `.pb`/`.pbi` file scans no longer block the extension host; names are refreshed incrementally with debouncing and cancellation support, keeping the inspector state intact between refreshes.

### Internal

- Core helper modules reorganized into feature-based subfolders (`gadget/`, `image/`, `statusbar/`, `toplevel/`, `window/`, `utils/`) with shorter, feature-local file names.
- Message type constants centralized in `src/shared/messages.ts`; provider and webview now share a single source of truth for all message names.
- Webview types deduplicated: local `Gadget`, `FormWindow`, `FormMenuEntry`, and related interfaces removed from `main.ts` in favour of the shared `model.ts` definitions; kind fields tightened from plain `string` to the respective union types.
- `GADGET_KIND` enum constants replace raw string literals throughout the emitter, parser, provider, and webview utilities.
- `PB_ANY`, `ENUM_NAMES`, and `PB_CALL` constants centralized and reused across all modules.
- `quotePbString` and `unquoteString` consolidated into `tokenizer.ts`; all duplicate inline implementations removed.
- Image reference helpers (`buildImageIdReference`, `toPbAnyAssignedVar`, `toEnumImageId`) moved into `patchEmitter.ts` for consistent `ImageID(...)` generation across all assignment paths.
- Blank-line skipping helpers (`isBlankLine`, `skipBlankLines`) unified in the emitter.

---

## 0.19.0

### Added

- **Native preview chrome for all gadget kinds**: Every gadget in the canvas preview now renders with a platform-accurate, skin-specific appearance instead of a generic label box. Affected gadgets:
  - *Text gadgets*: `StringGadget` and `IPAddressGadget` render with a native text-field border and background; `TextGadget` respects alignment and border flags; `HyperLinkGadget` shows underlined link styling.
  - *Buttons*: `ButtonGadget` renders with a Windows 7 two-tone gradient, Windows 8 flat style, or macOS/Linux rounded chrome depending on the active skin.
  - *Lists*: `TreeGadget`, `ListViewGadget`, `EditorGadget`, and `ScintillaGadget` render with a native client area and display actual gadget items from the parsed model.
  - *Explorer gadgets*: `ListIconGadget` and `ExplorerListGadget` render with native column headers and item rows; `ExplorerTreeGadget` renders with a tree list chrome.
  - *Input gadgets*: `ComboBoxGadget` and `ExplorerComboGadget` render with a native drop-down arrow; `SpinGadget` with up/down buttons; `ProgressBarGadget` with a filled track (including vertical orientation and Windows color variants).
  - *Frame and bars*: `FrameGadget` renders with OS-specific single, double, flat, and captioned frame styles; `TrackBarGadget` with native thumb, track, and tick marks; `ScrollBarGadget` with arrow buttons, thumb, and OS-specific track styling.
  - *Checkables*: `CheckBoxGadget` and `OptionGadget` render from raster assets with a fallback checkmark/dot; `DateGadget` and `CalendarGadget` render with OS-specific chrome and a date icon.
  - *Canvas/Web gadgets*: `CanvasGadget` and `OpenGLGadget` render with a framed native surface; `WebGadget` and `WebViewGadget` with a browser-style white client area.
  - *Container and image gadgets*: `ContainerGadget` and `CustomGadget` have dedicated chrome; `ImageGadget` and `ButtonImageGadget` render the resolved assigned image when available.
  - *Panel, ScrollArea, and Splitter*: Reworked with original-style per-platform chrome (tabs, scrollbar arrows/thumbs, separator fill).
- **Resolved images in top-level chrome previews**: Menu flyout entries, toolbar `ToolBarImageButton` entries, and statusbar image fields now display the resolved assigned image instead of a placeholder rectangle. A small fallback icon (frame / sky / sun / terrain) is shown when no image is assigned.

### Fixed

- Separator contrast is now checked against the background before rendering, preventing invisible separators on light or dark VS Code themes (toolbar, statusbar, menu bar, flyout borders).
- Windows 8 menu bar separator now derives its color from the Windows skin system colors instead of a hardcoded value.

---

## 0.18.0

### Added

- **Platform-accurate window chrome**: The canvas preview now renders the window frame, title bar, menu bar, toolbar, statusbar, and menu flyouts with OS-specific styling for Windows 7, Windows 8, macOS, and Linux:
  - *Title bar*: Per-skin button layout (macOS: circles on the left; Linux: glyphs on the right; Windows 7/8: min/max/close on the right with correct sizing). macOS renders a compact or toolbar-aware gradient with a white title shadow. Linux uses a dark rounded-top fill with light glyphs. Windows 7 renders a blue gradient frame and rounded outer border; Windows 8 a flat blue frame.
  - *Window frame*: macOS uses a rounded grey border; Linux omits the frame; Windows 7/8 draw an accurate outer frame with skin-derived gradient and stroke colors.
  - *Toolbar*: macOS uses a top-to-bottom gradient with a dark bottom separator; Linux a flat fill; Windows 7/8 a plain light fill with configurable item insets.
  - *Statusbar*: Per-skin background, separator insets, and progress bar styling (rounded blue track for most skins; flat green track for Windows 8).
  - *Menu bar*: Per-skin background and separator colors; macOS uses a layered gradient; Linux a flat fill; Windows 7/8 derive colors from skin constants.
  - *Menu flyouts*: Background, border, separator, and entry text colors now use skin-derived values with solid (non-transparent) rendering.
- **Windows system colors**: On Windows, the extension reads UI colors from the registry (`HKCU\Control Panel\Colors`) and combines them with CSS system color keywords to drive accurate Windows 7 / Windows 8 preview colors for gradients, borders, text, and selection outlines.
- **Raster preview assets**: Title bar buttons (Windows 7 and Windows 8 styles), the window title icon, the `+` add-button icon, and the submenu arrow indicator are now rendered from embedded raster assets; vector fallbacks are used when assets are unavailable.
- **Canvas page padding**: The window preview is now offset by a configurable padding (default 10 px) from the canvas edge so the window border is never clipped.
- **Per-skin title bar metrics**: Button sizes, insets, gaps, and title baseline offsets are resolved per skin (macOS 12×14 px circles, Linux 18×19 px glyphs, Windows 7/8 dynamic sizing).
- **Selection outlines use system text colors**: Toolbar, statusbar, menu bar, and flyout selection outlines now use the Windows button/menu/window text system color instead of the VS Code hot-tracking color.

### Fixed

- Title bar is now hidden for borderless or tool windows that have no `#PB_Window_SystemMenu` / `#PB_Window_TitleBar` flag (regression from 0.15.0).
- Title text start position adjusted correctly when a title icon is present (Windows 8 extra gap removed).
- Titlebar button band aligned to the Windows-specific start position on Windows skins.
- Generic fallback title fill and captionless top chrome no longer paint over Windows-specific title bar rendering.

---

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
