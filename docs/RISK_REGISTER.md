# Risk Register

Last reviewed: 2026-07-25

| ID | Risk | Likelihood | Impact | Mitigation | Exit evidence |
|---|---|---:|---:|---|---|
| R-001 | Nastaliq editing and display produce different line breaks or clipping | High | Critical | Hybrid-editor spike, pinned fonts, shared measurements, visual corpus | Typography phase gate passes |
| R-002 | A future encoding regression corrupts Urdu while still producing buildable source | Medium | Critical | Verified code-point fixtures, strict UTF-8 and mojibake-pattern checks | Encoding checks run in CI and corpus passes |
| R-003 | Fabric internals leak into permanent files | High | Critical | Canonical model, adapter tests, schema validation | Domain tests import no Fabric; packages contain no Fabric-only fields |
| R-004 | Screenshot PDF is mistaken for professional output | High | High | Honest labels and independent export spike | PDF ADR and output inspections pass |
| R-005 | ZIP or media imports exhaust memory or execute unsafe content | Medium | Critical | Limits, sanitization, hash verification, hostile fixtures | Package security suite passes |
| R-006 | Font redistribution/embedding creates legal exposure | Medium | Critical | Font register and licence gate | Every shipped font has reviewed provenance and rights |
| R-007 | Cross-platform WebViews cause layout drift | Medium | High | Platform corpus and export-independent layout | Supported-platform visual tolerance passes |
| R-008 | Collaboration scope distracts from local reliability | High | High | ADR-0004 and feature gating | Local publishing milestones complete first |
| R-009 | WebRTC fails on restricted networks | High | High | Production signaling and TURN; small-room limit | Forced-relay tests pass |
| R-010 | Large documents make React/Fabric interactions sluggish | Medium | High | Command batching, viewport state, profiling, virtualization | Performance budgets pass reference documents |
| R-011 | Legacy InPage compatibility is technically or legally impractical | High | Medium | Treat as research, not launch promise | Feasibility ADR before commitment |
| R-012 | Tauri capabilities or updater expand desktop attack surface | Medium | Critical | Least privilege, CSP, signed updates, desktop security review | Desktop security gate passes |
| R-013 | Unselected project licence blocks public contribution/distribution | High | High | Make licence decision before public release | Accepted licence ADR and `LICENSE` file |

Risk owners are assigned when implementation work begins. New critical risks are added here and referenced by the relevant milestone or ADR.
