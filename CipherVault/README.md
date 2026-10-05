# CipherForge Frontend

**Encode. Encrypt. Hash.**

Single-page React interface for the CipherForge toolkit. The whole UI is one
page: three categories, an algorithm rail, a workspace that adapts to the
selected algorithm, and a security information panel.

The backend is required. See [Backend README](../../CipherVault-Backend/README.md).

---

## Stack

| Concern | Choice |
| --- | --- |
| Framework | React 19 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Linting | oxlint |
| React Compiler | enabled through `@rolldown/plugin-babel` |

No UI framework, no state library, no HTTP client library. The app uses
`fetch`, React state and CSS.

---

## Getting started

```bash
cd CipherVault

npm install
npm run dev
```

The app is served at <http://localhost:5173>.

Start the backend first, otherwise the app shows a connection error with
instructions:

```bash
cd CipherVault-Backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server on port 5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |

### API routing in development

`vite.config.js` proxies `/api` to `http://127.0.0.1:8000`, so the browser makes
same-origin requests and CORS is never exercised in development. The backend
still sends CORS headers for direct API use.

To point the app at a different backend, set `VITE_API_BASE_URL`:

```bash
VITE_API_BASE_URL=https://api.cipherforge.example npm run build
```

---

## Project structure

```text
src/
├── App.jsx                        SPA shell: header, category tabs, rail, routing to workspaces
├── main.jsx                       React entry point
├── index.css                      Tailwind import and the theme tokens
├── api/
│   └── client.js                  fetch wrapper, error normalisation, size limits
├── components/
│   ├── ui.jsx                     Badges, panels, fields, buttons, copy, error banner, tabs
│   ├── ResultView.jsx             Output surface with Copy and Clear
│   └── workspaces/
│       ├── BasicWorkspace.jsx     Base64, hexadecimal, MD5, SHA-256, SHA-512
│       ├── SymmetricWorkspace.jsx  AES-256-GCM, ChaCha20-Poly1305
│       ├── RsaWorkspace.jsx       RSA-2048 OAEP with key generation
│       ├── CaesarWorkspace.jsx    Caesar cipher, flagged as educational
│       ├── DesWorkspace.jsx       Legacy explanation, execution disabled
│       └── BcryptWorkspace.jsx    Password hashing plus verification
└── hooks/
    └── useApiCall.js              Loading and error state with request cancellation
```

---

## Theme

A dark slate-and-indigo palette, defined entirely by the `@theme` tokens in
`src/index.css`. No component contains a colour literal, so the whole interface
is rethemed from that one block.

| Role | Token | Value | Used for |
| --- | --- | --- | --- |
| Page | `canvas` | `#0f1319` | app background |
| Panel | `surface` | `#151a22` | cards, panels |
| Raised | `raised` | `#1c222c` | secondary buttons, hover |
| Overlay | `overlay` | `#242b37` | highest elevation |
| Well | `inset` | `#0a0d12` | inputs, code output, tab strips |
| Hairline | `line` | `#2b3442` | decorative card separators |
| Control edge | `line-strong` | `#5d6b81` | input and control borders |
| Primary text | `ink` | `#e8edf5` | headings, values |
| Secondary text | `ink-muted` | `#9aa6b8` | labels, help text |
| Tertiary text | `ink-faint` | `#8792a4` | metadata, placeholders |
| Accent | `accent` | `#818cf8` | primary action, selection, focus ring |
| Recommended | `good` | `#3fb950` | recommended status |
| Caution | `warn` | `#d29922` | educational, legacy |
| Danger | `danger` | `#f85149` | broken, disabled, errors |

Three decisions carry the look:

**Layered blue-greys, not near-black.** Surfaces step evenly from `#0f1319` to
`#242b37`, so panel elevation is perceptible without shadows, and long reading
stays comfortable.

**`inset` sits below `canvas`.** Inputs, output blocks and tab strips use a
darker well, which reads as recessed into the card rather than painted on it.
This also gives form controls a boundary independent of their border.

**Borders do two different jobs.** `line` stays quiet for card separation, while
`line-strong` is reserved for the edges of interactive controls, which must be
identifiable without relying on colour alone. A single border weight for both
would mean either invisible inputs or heavy card outlines.

---

## Design decisions

**The backend owns the catalogue.** `GET /api/algorithms` is the single source of
truth for category tabs, the algorithm list, which operations a card offers,
security badges, warnings and the information panel. No algorithm metadata is
duplicated in the client, so the UI cannot drift from what the API actually
supports. Adding an algorithm to the backend makes it appear in the UI.

**One workspace per algorithm family.** Each family gets the layout it actually
needs rather than a generic form: symmetric ciphers show key and nonce, RSA shows
two PEM blocks and a key generator, Caesar shows a shift dial, bcrypt shows a
password field, DES shows no form at all.

**Desynchronised requests are dropped.** `useApiCall` aborts the previous
request whenever a new one starts or the component unmounts, so a slow response
can never overwrite a newer result.

**Errors are always visible.** Every failure renders an alert containing the
backend's message and its machine readable code. Nothing fails silently.

**Validation happens twice.** Cheap checks run in the browser for immediate
feedback, such as the 1 MiB text ceiling, RSA's 190-byte limit and bcrypt's
72-byte limit. The backend re-validates everything regardless.

**Legacy algorithms are shown, not hidden.** DES and MD5 are present precisely
because they are instructive, with their weaknesses stated on the screen. DES has
no input form at all, and the backend independently rejects DES requests.

---

## Security posture

- **No secrets in the client.** Keys, nonces and passwords are used transiently and
  cleared. Nothing is persisted to `localStorage` or `sessionStorage`.
- **Password inputs** use `type="password"` with `autoComplete` hints and are never
  written to the console.
- **No `dangerouslySetInnerHTML`.** Backend messages render as text, so a message
  cannot inject markup.
- **Clipboard access** has a fallback for browsers that block
  `navigator.clipboard`, so the Copy button is never a dead control.
- **The key material warning.** Symmetric keys, RSA private keys and password
  hashes belong in a password manager, not in a screenshot. CipherForge returns
  them because it is an interactive teaching tool with no server-side key store.

---

## Deployment

Deployed on Vercel as a static Vite build:

- **Production URL:** <https://ciphervault-frontend-self.vercel.app>
- **Backend:** <https://ciphervault-backend.vercel.app> (separate Vercel project)

### Repository layout and the deploy directory

This repository holds the app in a subdirectory, `CipherVault/`. Vercel is run
**from that directory** so it becomes the deployment root:

```bash
cd CipherVault
vercel deploy --prod --yes
```

Running from the repository root instead makes Vercel derive an invalid
project name from `CipherVault-Frontend` (uppercase is not permitted). Note
that `rootDirectory` is *not* a valid `vercel.json` property — it can only be
set in project settings, so the working directory is what matters.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Absolute backend origin. Empty in local development, where the Vite proxy forwards `/api` instead. |

`VITE_*` values are inlined into the bundle **at build time**, so the variable
must exist before the build runs:

```bash
vercel env add VITE_API_BASE_URL production
# https://ciphervault-backend.vercel.app

vercel deploy --prod --yes
```

The backend separately needs `CORS_ORIGINS` set to this project's origin,
otherwise the browser blocks the cross-origin requests.

### Redeploying after a change

Pushes are not wired to automatic deploys, so redeploy explicitly:

```bash
cd CipherVault && vercel deploy --prod --yes
```

---

## Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `footer`.
- Real `<button>` elements throughout, so keyboard activation and focus order are
  native. Category and operation switches use `role="tab"` with `aria-selected`.
- Every input has a `<label for>`; verified by an automated check.
- A single visible focus ring via `:focus-visible`, never removed.
- `aria-live="polite"` on result blocks and `role="alert"` on errors, so screen
  readers hear outcomes.
- Status is never conveyed by colour alone; every badge carries text.
- All text pairs meet WCAG AA contrast. Verified by rendering every view in a
  real browser and measuring composited foreground and background values: 533
  text nodes across all ten algorithm views, zero below AA, lowest 5.21:1.
- `prefers-reduced-motion` disables animation.

---

## Responsive behaviour

| Breakpoint | Layout |
| --- | --- |
| Below `sm` | Single column, tabs full width, workspace stacks |
| `sm` to `lg` | Algorithm rail becomes a two-column grid above the form |
| `lg` and up | Sticky algorithm rail on the left, workspace on the right |
| `xl` and up | Security panel moves beside the form inside the workspace |

Verified at 390px, 768px and 1440px with zero horizontal overflow.

---

## Verification performed

The interface was driven in headless Chromium against the live backend. All
checks passed:

- Base64 and hexadecimal encode and decode
- Invalid Base64 surfaces the backend `INVALID_ENCODING` message
- AES returns a 64-character key and a 24-character nonce, and decrypts back to
  the original text
- A tampered AES ciphertext is rejected with the authentication failure message
- ChaCha20-Poly1305 round trip
- RSA key pair generation, encrypt and decrypt, with the 190-byte limit stated
- Caesar encrypt, labelled as not cryptographically secure
- DES shows the legacy explanation with no action button
- MD5, SHA-256 and SHA-512 known-answer values
- bcrypt generation, correct-password match and wrong-password mismatch
- Copy and Clear controls
- No horizontal overflow at 390px, 768px and 1440px
- No JavaScript console errors
- Backend log contains no passwords, keys or plaintext after a full session

Backend unit and API tests are separate; see the backend README for those.

---

## Licence

Apache 2.0, matching the backend. See [LICENSE](LICENSE).