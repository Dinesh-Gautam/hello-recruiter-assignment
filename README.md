## Quick Start

1. **Setup Environment**:

   ```bash
   npm install
   # Create .env and add your key:
   GEMINI_API_KEY=your_key_here
   ```

2. **Run Demos**:
   - `npm run demo`: Full classification + model execution.

## Customization

- **Prompts**: Edit the `testPrompts` array in `src/demo.js` to test your own queries.
- **Config**: Modify `src/config/default.js` to tune model tiers, fallback order, or thinking token limits.
- **API Key**: Managed via `GEMINI_API_KEY` in `.env`.

## Architecture

- `Router`: Uses `gemini-2.0-flash-lite` to return structured JSON (level, reasoning, custom system prompt).
- `Executor`: Handles execution with automated fallback across prioritized models within a tier.
