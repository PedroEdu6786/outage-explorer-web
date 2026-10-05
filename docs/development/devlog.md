# Conversation devlog

This repository adopts the sibling `outage-explorer` Codex journal workflow.
`.codex/hooks.json` runs `scripts/devlog_hook.py`, a standalone Python 3
standard-library helper for macOS/Linux. It needs no backend environment,
packages or application dependencies; the web toolchain stays unchanged.

## Enable the hooks

Load this trusted repository in Codex, open `/hooks`, and review and enable
both **Stop** and **PreToolUse**. Start or resume a session to load the hooks.
Hook trust is local to each user and definition; repository configuration
does not automatically grant it. Review changed hook definitions again.
See [official Codex hook documentation](https://learn.chatgpt.com/docs/hooks).

## Before each commit

1. **Stop** buffers the final assistant summary from each completed turn in
   gitignored `.devlog-state/`.
2. **PreToolUse (Bash)** detects literal `git commit`, including Git global
   options and shell command chains, and appends buffered summaries from all
   repository sessions to `docs/devlog/YYYY-MM-DD.md` using local date/time.
3. New notes pause that commit call. The agent reviews them, adds a concise
   note for the current unfinished turn, stages the devlog with the intended
   changes, and retries the commit. No extra user confirmation is required.

The agent must update and stage the journal before every commit even with an
empty buffer or disabled hooks. A current turn has no final summary until it
ends, so its request, decisions, changes and actual checks need an explicit
entry. See the mandatory commit guidance in `AGENTS.md`.

Existing entries are append-only. Repeated callbacks and commit retries are
deduplicated; a writer lock serializes concurrent sessions. Markers in the
journal recover an append interrupted before the buffer is cleared, including
across midnight. Failed writes block the commit and retain recoverable notes.

Automatic entries capture assistant summaries, capped at 2,000 characters per
turn, rather than raw transcripts, prompts, reasoning or tool output. Common
credential patterns are redacted before buffering; review notes before staging.
Automatic claims are explicitly labeled as not independently verified.

This is a Codex lifecycle hook. External terminal commits, aliases, wrapper
scripts and dynamically built commands need the explicit devlog step above.
`git commit --dry-run` and unrelated commands do not flush the buffer. Hooks
do not stage files or create commits. Run commits from this repository's tree.

## Verification

```sh
npm run test:devlog
```

The checks use isolated temporary directories and cover append-only behavior,
deduplication, concurrent sessions, recovery across midnight, closed sessions,
redaction, repository boundaries, commit detection and safe failure behavior.
This suite validates the helper and configuration; enabling hooks in the
Codex UI and observing actual callbacks is a separate runtime check.
