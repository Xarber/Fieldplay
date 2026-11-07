# Developer ideas

In Profile, tap the version three times. Developer access closes when switching main tabs or after 30 seconds in the background. Open Developer Ideas to create/edit/duplicate, categorize, prioritize, search, filter, sort, batch-defer/delete, copy, attach an embedded image, and export JSON/Markdown.

Status vocabulary: pending, approved, deferred, in-progress, implemented, rejected. The current UADS vocabulary supersedes older “new/under consideration” labels in the original specification. Status changes append timestamped history. An implementation reference is required by the UI before marking implemented. That record is a developer assertion; coding agents still need verification evidence before treating an idea as delivered.

Persistence is independent of networking. Native SQLite and web IndexedDB acknowledge writes before updating the displayed collection. Read/schema errors preserve original data and disable edits rather than replacing a collection with empty data. Screenshots are embedded data URIs (PNG/JPEG/WebP, input limit 500 KB). JSON files have bounded schema/size validation.

Import always previews new items, identical IDs and changed IDs. Nothing is overwritten implicitly. The user chooses incoming versions for individual conflicts; other existing versions remain. Deleting requires explicit confirmation and states that history is removed.

One-action JSON export creates a portable `Fieldplay-Ideas.json` with project/schema identity. Markdown export is for reading. Imports/exports use platform file pickers and share sheets/downloads. They do not send ideas to GitHub. To review ideas in a future coding session, transfer the export to `docs/IDEAS.json` through an authorized import. Agents must read that actual file and offer unrelated work once rather than silently implementing it.

Implementation/release references link an idea to commits, verified changes and changelog version. Pending ideas must never be emitted as completed release notes. Automated bidirectional synchronization is not configured and private device storage is not automatically accessible to agents.
