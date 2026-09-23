# Project Rules & Guidelines

1. **Strict Pre-Verification Before Claiming Success**:
   - MUST perform static analysis, TypeScript checks, and build verification (`npx next build`) before claiming a fix.
   - MUST check React Hooks rules (no conditional hooks, hooks must be called at top level before early returns) in all client components.
   - NEVER report a bug fixed or deploy a release without thorough local verification to prevent token waste and user friction.

2. **Japanese Output**:
   - All responses, implementation plans, and summaries must be in precise, polite Japanese.

3. **Version String Rule**:
   - Header/app version must be updated to `ver. YYYY.MM.DD HH:mm` on every modification and explicitly stated in responses.
