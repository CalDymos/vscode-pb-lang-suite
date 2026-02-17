# PureBasic for VS Code (Monorepo)

[![suite](https://img.shields.io/github/v/tag/CalDymos/pb-lang-suite?sort=semver&filter=suite-v*&label=suite)](https://github.com/CalDymos/pb-lang-suite/tags)
[![pb-lang-support](https://img.shields.io/github/v/tag/CalDymos/pb-lang-suite?sort=semver&filter=pb-lang-support-v*&label=pb-lang-support)](https://github.com/CalDymos/pb-lang-suite/tags)
[![pb-forms-editor](https://img.shields.io/github/v/tag/CalDymos/pb-lang-suite?sort=semver&filter=pb-forms-editor-v*&label=pb-forms-editor)](https://github.com/CalDymos/pb-lang-suite/tags)

This repository contains multiple VS Code extensions related to PureBasic.

## Packages

- `packages/pb-lang-support`  
  PureBasic language support (syntax highlighting, snippets, basic tooling).

- `packages/pb-forms-editor`  
  PureBasic Forms editor (custom editor for `.pbf` files). *(Work in progress)*

## Development

### Prerequisites
- Node.js (LTS)
- npm

### Install
```bash
npm install
```

### Build
```bash
npm -w packages/pb-lang-support run compile
# (Once available)
npm -w packages/pb-forms-editor run compile
```

### Run (Debug)
Open this repo in VS Code and use the provided launch configurations.

## Repository Structure

```text
packages/
  pb-lang-support/
  pb-forms-editor/
```

## License
See `LICENSE`.
