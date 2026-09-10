# Vercel build fixes

This package contains fixes for the TypeScript errors reported by Vercel:

- `TS7023`: `underHundred` now has an explicit `: string` return type.
- `TS2345`: number/string quiz answers are normalized with `String(...)` before calling `setAnswer`.
- `TS1117`: duplicate `vieux` and `gros` keys in the gender-variant dictionary were removed.

Deployment settings:
- Framework Preset: Vite
- Root Directory: ./
- Build Command: npm run build
- Output Directory: dist
