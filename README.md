# Orbit UI

An accessible, themeable React 19 component library built on design tokens. It's tested with
Testing Library and axe-core, documented in Storybook, tree-shakeable down to the single
component, and released to npm with Changesets and signed provenance.

| Component | Pattern | Keyboard and screen-reader behaviour |
|---|---|---|
| `Button` | native button | Defaults to `type="button"`. `loading` keeps the width, sets `aria-busy`, and blocks clicks. |
| `TextField` | label + input | Auto-wired `id`/`htmlFor`. Description and error are linked with `aria-describedby`. `aria-invalid` is set, and errors are announced. |
| `Switch` | WAI-ARIA switch | `role="switch"` + `aria-checked`. Clicking the label toggles it. Controlled or uncontrolled. |
| `Tabs` | WAI-ARIA tabs | Roving tabindex. Arrow keys, Home, and End navigate. Disabled tabs are skipped. Automatic or manual activation. Horizontal or vertical. |
| `Dialog` | WAI-ARIA modal dialog | Focus moves in and is trapped. Escape closes only the top dialog. Scroll lock is nesting-safe with no layout shift. Focus returns to the opener. A drag that starts in a field doesn't close it. |
| `Tooltip` | WCAG 1.4.13 | Opens on hover **and** focus. Escape dismisses it. It stays open while hovered, flips placement at viewport edges, and is linked with `aria-describedby`. |
| `Toast` | live region | `status` (polite) for info and `alert` for errors. Auto-dismiss pauses on hover and focus, then resumes with the remaining time. |
| `ThemeProvider` | tokens | Light, dark, or system (follows the OS live), plus per-tree token overrides. **Portals inherit the theme.** |

## Install and use

```bash
npm install orbit-ui
```

```tsx
import "orbit-ui/styles.css";
import { Button, Dialog, ThemeProvider, ToastProvider, useToast } from "orbit-ui";

export function App() {
  return (
    <ThemeProvider defaultTheme="system" tokens={{ "--orbit-color-accent": "#0f766e" }}>
      <ToastProvider>
        <SaveButton />
      </ToastProvider>
    </ThemeProvider>
  );
}

function SaveButton() {
  const { toast } = useToast();
  return <Button onClick={() => toast({ title: "Saved", tone: "success" })}>Save</Button>;
}
```

## Theming

Every visual decision is a CSS custom property in
[`src/styles/tokens.css`](src/styles/tokens.css), such as `--orbit-color-*`, `--orbit-radius-*`,
`--orbit-space-*`, and `--orbit-duration-*`. There are three ways to brand the library:

1. Pass `tokens` to `ThemeProvider` to override values for one subtree.
2. Override the variables globally in your own CSS under `[data-theme="dark"] { … }`.
3. Import only `orbit-ui/tokens.css` and use the tokens in your own components.

Motion tokens drop to `0ms` under `prefers-reduced-motion`.

**Why portals re-apply the theme:** dialogs, tooltips, and toasts render into
`document.body`, outside the provider's DOM subtree. A plain portal would lose `data-theme`
and the token overrides. `Portal` copies both onto its container. This is a common bug in
home-grown design systems, and there's a test for it.

## Engineering

- **Tree-shaking:** the Vite library build uses `preserveModules`, which emits one ESM file per
  component, with `"sideEffects": ["**/*.css"]`. `size-limit` enforces the budgets in CI:

  | Import | Size (min + brotli) |
  |---|---|
  | `{ Button }` | **334 B** |
  | everything | 3.34 kB |

- **Types:** `.d.ts` files and declaration maps are emitted by `tsc`, so "Go to definition"
  opens the source. `publint` checks `exports`, `types`, and `files` on every build.
- **Accessibility testing:** each component has behavioural tests (Testing Library +
  user-event: real keyboard sequences, focus assertions) plus an axe-core scan. The Storybook
  a11y addon is set to `test: "error"`.
- **API conventions:** components are controlled or uncontrolled like native inputs
  (`value`/`defaultValue`/`onValueChange`), refs are forwarded (React 19 ref-as-prop), and
  handlers are composed so a consumer's `onClick` runs first and can call `preventDefault()`
  to skip the built-in behaviour.
- **SSR-safe:** portals mount after hydration, and `matchMedia` is guarded.

## Develop

```bash
npm install
npm test               # 15 behavioural + axe tests (Vitest, jsdom)
npm run storybook      # http://localhost:6006, with a theme toolbar and a11y panel
npm run build          # dist/ + d.ts + publint
npm run size           # bundle budgets
npm run changeset      # describe a change for the next release
```

## Release pipeline

- `ci.yml` runs typecheck, tests, the build and publint, the size budgets, and the Storybook
  build, then deploys Storybook to GitHub Pages from `main`.
- `release.yml` uses Changesets to open a "Version Packages" PR. Merging it publishes to npm
  with `--provenance`, a signed attestation that links the tarball to the commit and workflow
  that built it.

> Rename the package (`"name"` in `package.json`) to a scope you own, such as `@yourname/orbit-ui`, before the first publish.
