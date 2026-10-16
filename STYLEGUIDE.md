# Flotr2 Style Guide

Flotr2 3.0 is a retro library: written as it would have been in 2011, verified with modern tooling.

## Base Guide

[Airbnb JavaScript Style Guide, ES5 edition](https://github.com/airbnb/javascript/tree/es5-deprecated/es5) (2012).

Enforced by ESLint with `eslint-config-airbnb-base/legacy`. Where this document and the lint config disagree, the lint config wins and this document gets fixed.

TODO: verify `airbnb-base/legacy` works with current ESLint (flat config); if not, pin a compatible ESLint version for lint only.

## Highlights

The canonical guide is the source of truth; these are the rules that change the most existing code.

- 2-space indent, single quotes, semicolons.
- One `var` per variable, declared at the top of the function. No leading-comma `var` blocks.
- No trailing commas in object or array literals.
- `===` and `!==` only.
- Braces on all multi-line blocks; opening brace on the same line.
- camelCase for variables and functions, PascalCase for constructors, leading `_` for private members.
- Literal syntax: `{}` and `[]`, never `new Object()` or `new Array()`.
- `parseInt(x, 10)`, always with a radix.

## Language Level: ES5

Enforced with ESLint `ecmaVersion: 5`.

Not allowed: `let`/`const`, arrow functions, classes, template literals, destructuring, default params, spread/rest, modules, `for...of`, getters and setters in object literals.

Don't rely on `'use strict'`: IE9 ignores it, so strict-mode semantics differ between browsers.

## Browser Floor: IE9

Enforced with `eslint-plugin-compat` and browserslist `ie 9`.

| Allowed (IE9 has it) | Not allowed (IE10+) |
|---|---|
| `<canvas>` 2D context | `requestAnimationFrame` |
| `addEventListener` / `removeEventListener` | `new CustomEvent()` / `new Event()` |
| `Array.prototype.forEach/map/filter/reduce/some/every/indexOf` | `element.classList` |
| `Array.isArray`, `Object.keys`, `Object.create` | `element.dataset` |
| `Function.prototype.bind` | Typed arrays |
| `JSON`, `Date.now`, `String.prototype.trim` | `Promise`, `Map`, `Set`, `WeakMap` |
| `getComputedStyle`, `textContent` | Pointer events |

No polyfills.

## Dependencies

None at runtime. Write helpers that the platform lacks by hand, small and local to the library (2011 microlib style).

## Module Pattern

- Source files are IIFEs that attach to the `Flotr` namespace.
- The build concatenates them and wraps the result in UMD (AMD, CommonJS, `window.Flotr` global).
- Chart types register with `Flotr.addType(name, implementation)`.
- Plugins register with `Flotr.addPlugin(name, implementation)` and use lifecycle hooks rather than modifying core.

## Tooling Is Exempt

Tests, lint config, and build scripts are not library code and may use modern JavaScript.
