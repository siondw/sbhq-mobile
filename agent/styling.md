# docs/styling.md

# SBHQ Mobile App – UI & Styling Rules

## UI Ownership

All UI lives in `src/ui/`.

Subfolders:

- `components/`
- `animations/`
- `textures/`
- `theme/`

Rules:

- No DB access
- No logic hooks
- Minimal conditional logic

---

## Screen Philosophy

Screens should:

- Call hooks
- Select UI components
- Handle navigation

Nothing else.

---

## Reusability (Hard Rule)

If something is used more than once, abstract it.

- UI → `ui/components`
- Animations → `ui/animations`
- Visual effects → `ui/textures`
- Logic → `logic/hooks` or `logic/<domain>`

Export through barrel `index.ts`.

---

## Layout & Structure

- Keep component trees flat
- Avoid unnecessary wrapper Views
- Containers must have a clear purpose

---

## Color System

- BACKGROUND: Champagne
- SURFACE: Off-white cards
- PRIMARY / PRIMARY_DARK: Brand emphasis
- ACCENT: Terracotta
- TEXT / MUTED: Primary + secondary text
- Never use pure white (`#FFFFFF`)

---

## Typography

- Title: 24px bold
- Subtitle: 18px bold
- Body: 16px
- Small: 14px
- Use `weight` prop
- Letter spacing only when justified

---

## Spacing

- Use theme tokens only
- Page padding: `MD`
- Section gaps: `MD`
- Card internals: `XS`
- Buttons: `SM` top margin

---

## Interactive States

- Disabled: reduced opacity
- Locked: opacity on entire card
- Press: native feedback
- Live indicators: subtle borders/dots

---

## Animations & Effects

- Use shared animation hooks only
- No ad-hoc animation logic

---

## Styling Anti-Patterns

- Deep nesting
- Magic numbers
- Duplicated gradients or animations
- Logic inside UI components
