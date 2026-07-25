# ADR-0003: Shared web core with gated Tauri desktop shell

Status: Accepted  
Date: 2026-07-25

## Context

The product must run on Windows, macOS, and Linux, work offline, and provide native file behavior. The existing implementation is web technology. Building three native editors would fragment scarce engineering effort, while a browser-only application would weaken filesystem, packaging, and offline expectations.

## Decision

Maintain a browser-capable React/TypeScript core and package it with Tauri 2 after document, editor, and export boundaries stabilize. Platform-specific behavior is accessed through a `PlatformServices` abstraction.

## Consequences

- Most product code is shared.
- Rust/Tauri capability and release expertise is eventually required.
- WebView differences remain part of typography and platform QA.
- Tauri integration is deliberately delayed so it does not conceal browser-core architecture problems.

## Alternatives considered

- Electron: mature and viable, but a heavier runtime for this project’s current goals.
- Browser/PWA only: useful as a secondary host, insufficient as the sole desktop strategy.
- Fully native per platform: rejected for cost and divergence.

## Validation

The desktop milestone tests clean installation, native save/recovery, export, scaling, permissions, updates, and uninstall on all supported platforms.
