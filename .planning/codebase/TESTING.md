# Testing

## 1. Current Status
- **Automated Testing**: None currently implemented in the main production branch.
- **Manual Verification**: Features are audited manually using the `docs/todo.md` checklist and staging verification runs.
- **Visual Auditing**: Manual checks for UI consistency between major functional areas (e.g., matching Purchase Orders and Sales Orders).

## 2. Infrastructure
- **Reference Scripts**: `.agent/scripts/` includes placeholder or utility scripts (e.g., `checklist.py`) used by the AI agent to audit codebase state.
- **Database Verification**: SQL scripts in `docs/schemas/` are used to verify schema integrity.

## 3. Future Goals (Planned)
- **Unit Testing**: Introduction of **Vitest** for feature slice logic and utility functions.
- **End-to-End (E2E)**: Implementation of **Playwright** for critical user flows (Sign-in, Inventory Intake, Sale Completion).
- **CI/CD Integration**: Enforcing status checks before merging to production.
