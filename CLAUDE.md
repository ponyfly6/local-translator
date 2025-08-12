# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Start dev server for Chrome (opens browser automatically)
npm run dev:firefox      # Start dev server for Firefox

# Production
npm run build            # Build extension for Chrome
npm run build:firefox    # Build extension for Firefox
npm run zip              # Package Chrome extension
npm run zip:firefox      # Package Firefox extension

# Validation
npm run compile          # TypeScript type checking (no emit)
```

## Package Management

- Use Bun as package manager for faster installation and better performance

## Architecture Overview

This is a browser extension built with **WXT framework** (Web Extension Toolkit) using React and TypeScript. The project implements a translation feature using Chrome's built-in Translator API.

### Entry Points Structure

WXT uses a convention-based entry point system. Each entry point serves a specific purpose in the browser extension:

1. **`entrypoints/background.ts`** - Background service worker that runs independently of any tab
2. **`entrypoints/content.ts`** - Content script injected into web pages (currently targets `*.google.com`)
3. **`entrypoints/popup/`** - React-based popup UI shown when clicking the extension icon

### Key Technologies & Patterns

- **WXT Configuration**: `wxt.config.ts` integrates React module and Tailwind CSS via Vite
- **Styling**: Tailwind CSS v4 with `@import "tailwindcss"` in style files
- **React**: Version 19 with StrictMode, uses functional components and hooks
- **TypeScript**: Strict typing with WXT's generated types in `.wxt/`

### Translation Feature Design

The intended translation implementation (documented in `context/chrome-ai-translator.txt`):
- Uses Chrome's Translator API (requires Chrome ≥138 desktop)
- Translates English to Simplified Chinese (`en` → `zh-Hans`)
- Triggered by text selection + mouseup event
- Requires user activation for API initialization

### WXT-Specific Conventions

- Use `defineContentScript()`, `defineBackground()` for entry points
- WXT auto-generates manifest.json from configuration
- Development server provides hot reload for all entry points
- Built extensions output to `.output/[browser]-[mode]/`

### Current Implementation Status

- Popup UI uses Tailwind classes and React state
- Content script has minimal implementation (needs translation logic)
- Background script is placeholder (needs service worker logic)
- Chrome Translator API integration pending