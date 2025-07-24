# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

For comprehensive project information including build commands, architecture details, and development setup, see **README.md**.

## AI-Specific Guidelines

**Code Style:**
- Follow existing patterns in the codebase (early 2010s JavaScript style)
- Use underscore.js utilities (`_.bind()`, `_.each()`, etc.) instead of modern alternatives
- Maintain compatibility with older browsers (IE support via excanvas)
- Preserve the existing closure-based module pattern

**Testing Requirements:**
- Run `make test` before submitting changes
- Visual regression tests use js-imagediff - ensure chart rendering is pixel-perfect
- Test in both jasmine-headless-webkit and browser environments

**Architecture Constraints:**
- New chart types must use the `Flotr.addType(name, implementation)` pattern
- New plugins must use the `Flotr.addPlugin(name, implementation)` pattern  
- Plugins should use lifecycle hooks rather than modifying core files
- Canvas rendering only - no SVG or DOM-based charts

**Performance Considerations:**
- Large datasets are common - optimize for Canvas performance
- Minimize memory allocations during rendering loops
- Use object pooling for frequently created/destroyed objects

**Legacy Compatibility:**
- This is a mature library - avoid breaking changes to public API
- Maintain backward compatibility with existing chart configurations
- IE8+ support required (hence excanvas dependency)