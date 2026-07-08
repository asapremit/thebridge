# Project Rules for Same Path Workspace

## Code Safety & Syntax Validation
- **Always Validate Syntax**: Every time you modify a JavaScript or CSS file, you must run a syntax check using Node.js before proceeding or ending your turn:
  - Command: `/Users/tribalmarks/.gemini/antigravity/scratch/bin/node --input-type=module --check < path/to/file.js`
- **Brace/Parenthesis Balance**: If you make any manual replacements or automated changes, verify that the brace `{}` and parenthesis `()` depth balances exactly to 0 from start to end of the file.

## Build and Deployment Syncing
- **Sync to Dist**: Always copy any updated static files (`app.js`, `styles.css`, `index.html`, etc.) to the `dist/` directory immediately after editing.
- **Cache-Busting Bumps**: After modifying any script or stylesheet, locate where it is included in HTML files and increment its query version string (e.g. `?v=14` to `?v=15`) to ensure client browsers fetch the fresh changes.

## Autonomy and Planning
- **Skip Plan Approvals**: Do NOT request user feedback/approval on implementation plans (i.e. do not set `RequestFeedback: true`) unless the task involves a massive architectural change or structural overhaul. Proceed with autonomous execution for standard UI/UX, logic, or content tasks.
