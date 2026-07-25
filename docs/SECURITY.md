# Security and Privacy Model

## 1. Trust boundaries

Treat imported documents, images, SVG, pasted HTML, templates, fonts, collaboration messages, signaling data, and remote assets as untrusted. Local source code and pinned packaged assets are trusted only through the build/supply-chain process.

## 2. Local document security

- Validate every imported package and field.
- Reject ZIP traversal, links, duplicate normalized paths, and resource exhaustion.
- Decode images with dimension and byte limits.
- Sanitize SVG and pasted HTML; never execute scripts or event handlers.
- Do not render arbitrary canonical HTML.
- Use object URLs narrowly and revoke them.
- Keep recovery data per application origin/profile and expose a clear deletion mechanism.

## 3. Desktop shell

- Tauri capabilities follow least privilege.
- No generic shell execution from frontend content.
- Filesystem access is limited to explicit user-selected files and approved application data directories.
- Updates are signed and verified.
- Content Security Policy excludes arbitrary remote script execution.

## 4. Collaboration

Production collaboration requires:

- High-entropy, unguessable invitations.
- Explicit participant identity or clearly documented capability-only access.
- Read/editor/owner roles.
- Invitation revocation and participant removal.
- Room/document version compatibility checks.
- Rate, size, and message validation.
- A signaling and TURN privacy statement.
- A durable-storage and deletion policy.

WebRTC transport encryption does not by itself provide application authorization, safe invitations, trusted peers, or backup.

## 5. Microphone and media

- Request permission only after a user gesture.
- Show persistent local mute/call state.
- Stop tracks immediately on hang-up or feature disable.
- Never record by default.
- Audio is out of the foundational release scope.

## 6. Privacy

- Core editing is local and account-free.
- Network calls are visible in product behavior and documentation.
- No document content telemetry.
- Crash reporting or analytics requires a separate decision, minimization review, retention policy, and user control.

## 7. Security response

Before public release, publish a reporting channel, supported-version policy, dependency-patching procedure, severity targets, and coordinated disclosure process. Critical document-parser or updater vulnerabilities block releases.
