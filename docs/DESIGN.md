# salmon design system

| | |
|---|---|
| Version | 2.0, November 2026 |
| Replaces | Cupertino '84 (1-bit, bitmap type, zero radius) |
| Product | salmon, trope-based search for films, TV, anime, games and books |
| Fonts | Archivo (display), Inter (text). Both Google Fonts, SIL Open Font License |
| Accent | `--salmon` `#00D0C0` with deep ink `#052B28` |
| Preview | A static specimen page with every token and component (kept outside the repo) |

The structure, spacing, type scale, component shapes and interaction patterns follow the web design language of Wise (wise.com), studied from public screenshots on Mobbin. Wise is a reference only. salmon uses none of Wise's logo, illustrations, photography, brand name, copy, Wise Sans font, or brand colours. Every colour, font, word and image here is salmon's own.

---

## 0. The system in 60 seconds

- **One accent, one deep.** A bright teal fill for primary buttons and highlights, always with deep teal-black text on it. The deep colour also carries links, selected states and one dark band per page.
- **Big type for statements, calm type for reading.** Heavy uppercase Archivo for short headlines only. Inter for everything people read or click.
- **Everything you press is a pill.** Buttons, chips, search fields, nav highlights, tabs' segmented control.
- **Surfaces, not lines.** White and warm grey bands alternate instead of dividers. Cards have no shadows. Shadows only on things that float: menus, modals, toasts.
- **Lists are rows.** A disc on the left, a title over a grey line, the value on the right.
- **Show the working.** Every chip shows the real trope a phrase matched. Every result says how many of your tropes it has, which ones, and which are missing.
- **Plain words, real numbers.** No invented data, ratings or testimonials anywhere.

---

## 1. Principles

Each principle names the Wise pattern it comes from. Reference files are listed in section 12.

1. **One accent, used for doing.** Wise puts its bright green on the primary button, the highlight column and the full-bleed hero, and nowhere else. salmon does the same with `--salmon`: the primary action on a screen, the "full match" highlight, and at most one full-bleed salmon band per page. Text on salmon is always `--salmon-950`. (m01, m02, m08, a01)
2. **Statements are short and huge; reading is calm.** Display type is for 3 to 8 word claims and section titles. It never carries instructions, results or forms. Body text sits at 16 to 20 px with generous line height. (m01, m05, m06, m13)
3. **Pills for actions, rounded rectangles for containers.** Anything clickable that is not a link in text is fully rounded. Inputs are 10 px, cards 16 to 32 px, modals 24 px. (a01, a09, a15, m06)
4. **Hierarchy from fills, not borders or shadows.** Grey `--grey-100` bands and cards separate content. A 1 px hairline appears only where structure needs it (a list group label, a table, the footer). (m05, m11, m12, a02, a04)
5. **Lists are rows with a fixed rhythm.** Disc 48 px, title 16/600, secondary line 14/400 grey, value or action on the right, 72 px row pitch, no dividers. (a04, a07, a22)
6. **Show the working.** Wise shows the fee before you commit. salmon shows which trope each phrase matched, how many works use it, and for every result the tropes it has and the ones it is missing. Nothing is hidden behind a toggle that a person needs to trust a ranking. (m08, a20)
7. **One job per screen.** Sign up and log in drop the app chrome and centre one short form, like Wise's focused flows. The search page does one thing: compose tropes, read results. (a09, a18, a20)
8. **Plain, second person, honest.** Say what something does, what it needs, and what it does not do. State limits openly (25 results per search, loose phrase matching). (m11, m13)

---

## 2. Colour

### 2.1 Primitives

One salmon hue ramp, warm greys, and four status colours. Hex values are the source of truth.

| Token | Hex | Role |
|---|---|---|
| `--salmon-50` | `#EBFBF9` | Body text on the deep band, toast text |
| `--salmon-100` | `#CCF5F1` | Secondary button fill, resolved and matched chips, focus ring on dark |
| `--salmon-200` | `#A3EDE6` | Secondary button hover |
| `--salmon-500` | `#00D0C0` | **The accent.** Primary fill, highlight, full-match rank disc, salmon band |
| `--salmon-600` | `#00BDAE` | Primary hover |
| `--salmon-700` | `#00A99B` | Primary pressed |
| `--salmon-900` | `#0A3D39` | Raised surfaces and icon discs on the deep band, inverse button hover |
| `--salmon-950` | `#052B28` | **Deep ink.** Text on salmon, links, selected states, meter fill, deep band, focus ring |
| `--grey-0` | `#FFFFFF` | Page |
| `--grey-50` | `#FAF8F6` | Hover on white rows, disabled input fill, dashed "add" cards |
| `--grey-100` | `#F2EEEA` | Grey bands, cards on white, active nav pill, neutral pills, icon discs |
| `--grey-150` | `#ECE8E4` | Disabled button fill |
| `--grey-200` | `#E7E2DD` | Hairlines, neutral hover on grey, meter track, skeleton |
| `--grey-300` | `#D9D3CD` | Dashed borders on add cards, hairlines on grey bands |
| `--grey-500` | `#8C837D` | Input borders, missing-tag dashes, disabled labels |
| `--grey-600` | `#6E6560` | Placeholders, tertiary text |
| `--grey-700` | `#514944` | Secondary text, meta lines, inactive nav |
| `--grey-900` | `#1C1613` | Primary text and headlines, toast background |
| `--red-50` | `#FDECEA` | Error banner and unknown-chip fill |
| `--red-600` | `#B42318` | Error text, error borders, destructive buttons |
| `--red-700` | `#93190F` | Destructive solid hover |
| `--yellow-100` | `#FFF1C2` | Weak-match chip fill |
| `--yellow-300` | `#FFD34D` | Warning banner fill |
| `--yellow-900` | `#3D2B00` | Text and icon disc on yellow |
| `--green-50` | `#E6F4EC` | Success panel |
| `--green-700` | `#1E7044` | Success icon and text |

### 2.2 Semantic tokens

Components use only these names. This block replaces the `:root` in `frontend/app/globals.css`.

```css
:root {
  /* primitives */
  --salmon-50: #EBFBF9;  --salmon-100: #CCF5F1; --salmon-200: #A3EDE6;
  --salmon-500: #00D0C0; --salmon-600: #00BDAE; --salmon-700: #00A99B;
  --salmon-900: #0A3D39; --salmon-950: #052B28;
  --grey-0: #FFFFFF; --grey-50: #FAF8F6; --grey-100: #F2EEEA; --grey-150: #ECE8E4;
  --grey-200: #E7E2DD; --grey-300: #D9D3CD; --grey-500: #8C837D; --grey-600: #6E6560;
  --grey-700: #514944; --grey-900: #1C1613;
  --red-50: #FDECEA; --red-600: #B42318; --red-700: #93190F;
  --yellow-100: #FFF1C2; --yellow-300: #FFD34D; --yellow-900: #3D2B00;
  --green-50: #E6F4EC; --green-700: #1E7044;

  /* brand (the old name stays, the colour finally matches it) */
  --salmon: var(--salmon-500);
  --deep: var(--salmon-950);

  /* surfaces */
  --bg: var(--grey-0);
  --bg-muted: var(--grey-100);         /* grey bands, cards on white */
  --bg-subtle: var(--grey-50);         /* row hover, disabled fields */
  --bg-deep: var(--salmon-950);        /* one dark band per page */
  --bg-deep-raised: var(--salmon-900);
  --bg-accent: var(--salmon-500);

  /* text */
  --text: var(--grey-900);
  --text-secondary: var(--grey-700);
  --text-tertiary: var(--grey-600);
  --text-link: var(--salmon-950);
  --text-on-accent: var(--salmon-950);
  --text-on-deep: var(--salmon-50);
  --text-on-deep-heading: var(--salmon-500);
  --text-danger: var(--red-600);

  /* actions */
  --action-primary: var(--salmon-500);
  --action-primary-hover: var(--salmon-600);
  --action-primary-active: var(--salmon-700);
  --action-secondary: var(--salmon-100);
  --action-secondary-hover: var(--salmon-200);
  --action-neutral: var(--grey-100);
  --action-neutral-hover: var(--grey-200);
  --action-disabled: var(--grey-150);
  --action-disabled-text: var(--grey-500);

  /* lines */
  --border-hair: var(--grey-200);
  --border-input: var(--grey-500);
  --border-strong: var(--salmon-950);
  --focus-ring: var(--salmon-950);
  --focus-ring-on-deep: var(--salmon-100);

  /* data */
  --meter-fill: var(--salmon-950);
  --meter-track: var(--grey-200);
  --scrim: rgba(28, 22, 19, 0.45);
}
```

### 2.3 Contrast

Every text and background pair the system uses, computed with the WCAG 2.x relative-luminance formula. Body text needs 4.5:1. Large text (24 px and up, or 18.66 px bold and up) and UI parts need 3:1.

| Foreground | Background | Where | Ratio | Needs | Result |
|---|---|---|---|---|---|
| `--grey-900` #1C1613 | white #FFFFFF | body, headlines | 17.89 | 4.5 | AAA |
| `--grey-900` #1C1613 | `--grey-100` #F2EEEA | text on grey bands and cards | 15.50 | 4.5 | AAA |
| `--grey-900` #1C1613 | `--grey-50` #FAF8F6 | hovered rows | 16.89 | 4.5 | AAA |
| `--grey-900` #1C1613 | `--grey-200` #E7E2DD | hovered neutral pills | 13.91 | 4.5 | AAA |
| `--grey-900` #1C1613 | `--salmon-500` #00D0C0 | display headline on the salmon band | 9.19 | 3 | AAA |
| `--grey-900` #1C1613 | `--salmon-100` #CCF5F1 | text on tinted panels | 15.25 | 4.5 | AAA |
| `--grey-900` #1C1613 | `--red-50` #FDECEA | error banner body | 15.65 | 4.5 | AAA |
| `--grey-900` #1C1613 | `--green-50` #E6F4EC | success panel body | 15.78 | 4.5 | AAA |
| `--grey-900` #1C1613 | `--yellow-100` #FFF1C2 | weak-match chip label | 15.86 | 4.5 | AAA |
| `--grey-700` #514944 | white | secondary text, meta | 8.80 | 4.5 | AAA |
| `--grey-700` #514944 | `--grey-100` | meta on grey cards | 7.62 | 4.5 | AAA |
| `--grey-700` #514944 | `--grey-50` | meta on hovered rows | 8.31 | 4.5 | AAA |
| `--grey-700` #514944 | `--salmon-100` | chip meta (work counts) | 7.50 | 4.5 | AAA |
| `--grey-700` #514944 | `--yellow-100` | weak-match chip meta | 7.80 | 4.5 | AAA |
| `--grey-700` #514944 | `--red-50` | error banner secondary line | 7.69 | 4.5 | AAA |
| `--grey-700` #514944 | `--green-50` | success panel secondary line | 7.76 | 4.5 | AAA |
| `--grey-600` #6E6560 | white | placeholders, tertiary text | 5.69 | 4.5 | AA |
| `--grey-600` #6E6560 | `--grey-100` | tertiary text on grey | 4.93 | 4.5 | AA |
| `--grey-600` #6E6560 | `--grey-50` | placeholder in disabled field | 5.37 | 4.5 | AA |
| `--salmon-950` #052B28 | `--salmon-500` #00D0C0 | primary button label | 7.80 | 4.5 | AAA |
| `--salmon-950` | `--salmon-600` #00BDAE | primary label, hover | 6.43 | 4.5 | AA |
| `--salmon-950` | `--salmon-700` #00A99B | primary label, pressed | 5.17 | 4.5 | AA |
| `--salmon-950` | `--salmon-100` #CCF5F1 | secondary label, resolved chips | 12.95 | 4.5 | AAA |
| `--salmon-950` | `--salmon-200` #A3EDE6 | secondary label, hover | 11.44 | 4.5 | AAA |
| `--salmon-950` | white | links, tertiary labels, active tab | 15.19 | 4.5 | AAA |
| `--salmon-950` | `--grey-100` | active nav label, links on grey | 13.16 | 4.5 | AAA |
| `--salmon-950` | `--grey-50` | links on hovered rows | 14.34 | 4.5 | AAA |
| `--salmon-950` | `--grey-200` | neutral pill hover | 11.80 | 4.5 | AAA |
| `--salmon-950` | `--yellow-100` | weak-match chip label | 13.46 | 4.5 | AAA |
| `--salmon-500` #00D0C0 | `--salmon-950` #052B28 | headings and links on the deep band | 7.80 | 4.5 | AAA |
| `--salmon-50` #EBFBF9 | `--salmon-950` | body on the deep band, inverse button label | 14.25 | 4.5 | AAA |
| `--salmon-100` #CCF5F1 | `--salmon-950` | focus ring and outline button on the deep band | 12.95 | 3 | AAA |
| `--salmon-50` | `--salmon-900` #0A3D39 | text on raised cards inside the deep band | 11.32 | 4.5 | AAA |
| `--salmon-500` | `--salmon-900` | icons on raised discs in the deep band | 6.20 | 3 | AA |
| `--salmon-50` | `--grey-900` #1C1613 | toast text | 16.79 | 4.5 | AAA |
| `--salmon-500` | `--grey-900` | toast action pill against the toast | 9.19 | 3 | AAA |
| `--red-600` #B42318 | white | error messages, destructive labels | 6.57 | 4.5 | AA |
| `--red-600` | `--red-50` | error banner title, unknown-chip meta | 5.75 | 4.5 | AA |
| `--red-600` | `--grey-100` | error text on grey surfaces | 5.70 | 4.5 | AA |
| white | `--red-600` | destructive solid label | 6.57 | 4.5 | AA |
| white | `--red-700` #93190F | destructive solid label, hover | 8.80 | 4.5 | AAA |
| `--yellow-900` #3D2B00 | `--yellow-300` #FFD34D | warning banner text | 9.51 | 4.5 | AAA |
| `--yellow-900` | `--yellow-100` | weak-match chip icon | 12.06 | 3 | AAA |
| `--green-700` #1E7044 | white | success text | 6.08 | 4.5 | AA |
| `--green-700` | `--green-50` | password rule passed | 5.36 | 4.5 | AA |
| white | `--green-700` | check mark in success disc | 6.08 | 3 | AA |
| `--grey-500` #8C837D | white | input border, missing-tag dash (UI part) | 3.71 | 3 | AA UI |
| `--grey-500` | `--grey-100` | input border on grey bands (UI part) | 3.22 | 3 | AA UI |
| `--grey-500` | `--grey-150` #ECE8E4 | disabled button label | 3.05 | none (disabled) | exempt |
| `--grey-500` | `--grey-50` | disabled field text | 3.50 | none (disabled) | exempt |
| `--salmon-950` | white | focus ring (UI part) | 15.19 | 3 | AA UI |
| `--meter-fill` #052B28 | `--meter-track` #E7E2DD | coverage meter segments | 11.80 | 3 | AA UI |

Intentionally below 3:1, with the reason:

- `--salmon-500` on white is **1.95:1**. Salmon is never used for text, icons or thin lines on white. As a button fill the 7.41:1 label identifies the button, so the fill edge does not need 3:1 (WCAG 1.4.11 note on text-identified controls). The same holds for Wise's green.
- `--grey-200` hairlines on white (1.29:1) and `--grey-300` (1.48:1) are decorative separators. No meaning depends on seeing them.

### 2.4 Colour rules

- Salmon is a fill, never a text colour on light backgrounds. Need accent text on white? Use `--deep`.
- One full-bleed salmon band and one deep band per page, at most. Everything else is white or `--grey-100`.
- State is never colour alone. Saved works also switch to a filled icon and a new accessible name. Missing tropes also get a dashed outline, a minus icon and the word "Missing". Errors also get an icon and a message.
- Status colours (red, yellow, green) appear only in banners, field errors, chips that need attention, and the password rule. Never as decoration.
- No gradients, no glass, no dither. The one exception is the skeleton shimmer, which is grey on grey.

---

## 3. Typography

### 3.1 Families

| Role | Family | Weights | Axes | Licence |
|---|---|---|---|---|
| Display: headlines, section titles, stats | **Archivo** | 900 only | width (`wdth`) set to 85 | SIL OFL 1.1 |
| Text: everything else | **Inter** | 400 and 600 only | none | SIL OFL 1.1 |

Archivo at weight 900 and 85 % width is heavy and slightly condensed, so a six-word headline sits on two or three lines at hero size. Inter is the text face because its sizes and metrics line up with the reference measurements, it has tabular figures for counts, and it reads well at 14 px.

Google Fonts stylesheet (dev and static pages):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@85,900&family=Inter:wght@400;600&display=swap" rel="stylesheet">
```

In the Next.js app, load both with `next/font/google` in `app/layout.tsx` (self-hosted at build time), expose them as `--font-display` and `--font-text`, and drop VT323 and Silkscreen. `frontend/AGENTS.md` warns that this Next version differs from older docs, so check `node_modules/next/dist/docs/` for the current `next/font` options (variable axes for Archivo's `wdth`).

```css
:root {
  --font-display: "Archivo", "Arial Narrow", "Helvetica Neue", Arial, sans-serif;
  --font-text: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.display { font-family: var(--font-display); font-weight: 900; font-stretch: 85%;
  text-transform: uppercase; font-synthesis: none; }
body { font-family: var(--font-text); font-weight: 400; color: var(--text);
  font-feature-settings: "cv11", "ss01"; -webkit-font-smoothing: antialiased; }
.num { font-variant-numeric: tabular-nums; }
```

### 3.2 Scale

Mobile values apply below 768 px. Between 768 and 1280 px, display sizes scale with `clamp()` between the two columns.

| Token | Family, weight | Desktop size / line height | Mobile size / line height | Tracking | Case | Use |
|---|---|---|---|---|---|---|
| `display-xl` | Archivo 900, 85 % | 120 / 104 | 56 / 50 | -0.01em | UPPER | Landing hero only (one sentence per line on `lg`+) |
| `display-l` | Archivo 900, 85 % | 96 / 84 | 44 / 40 | -0.01em | UPPER | Closing band, 404 |
| `display-m` | Archivo 900, 85 % | 64 / 56 | 36 / 34 | -0.005em | UPPER | Landing section titles, work title |
| `display-s` | Archivo 900, 85 % | 40 / 36 | 30 / 28 | 0 | UPPER | Card titles in caps, `/app` empty heading |
| `stat` | Archivo 900, 85 % | 72 / 72 | 44 / 44 | -0.01em | figures | Proof numbers |
| `heading-xl` | Inter 600 | 52 / 56 | 34 / 40 | -0.02em | Sentence | Story and split headings, deep band heading |
| `heading-l` | Inter 600 | 40 / 48 | 28 / 36 | -0.015em | Sentence | Feature split headings |
| `h1` | Inter 600 | 32 / 40 | 28 / 36 | -0.01em | Sentence | App page titles (Saved, History), auth titles |
| `h2` | Inter 600 | 24 / 32 | 22 / 28 | -0.005em | Sentence | App section headings, results count, step text |
| `h3` | Inter 600 | 20 / 28 | 18 / 26 | 0 | Sentence | Card titles, modal titles, result titles (18 / 28) |
| `body-l` | Inter 400 | 20 / 28 | 18 / 26 | 0 | Sentence | Hero subline, dark band intro |
| `body-m` | Inter 400 | 18 / 26 | 16 / 24 | 0 | Sentence | Marketing body, FAQ questions (600) |
| `body` | Inter 400 | 16 / 24 | 16 / 24 | 0 | Sentence | App body, inputs, FAQ answers |
| `body-s` | Inter 400 | 14 / 20 | 14 / 20 | 0 | Sentence | Meta lines, help text, footer links (14 / 22) |
| `label` | Inter 600 | 14 / 20 | 14 / 20 | 0 | Sentence | Field labels, chips, small buttons, nav |
| `button` | Inter 600 | 16 / 24 | 16 / 24 | 0 | Sentence | Large and medium buttons |
| `micro` | Inter 600 | 13 / 16 | 13 / 16 | 0 | Sentence | Mobile tab bar labels only |

Rules:

- Display is uppercase through `text-transform`, so screen readers and copy-paste get normal case. Write display copy in sentence case in the source.
- Display text is never smaller than 30 px and never used for more than 8 words, except the work title.
- Nothing in the product is smaller than 13 px, and 13 px only in the mobile tab bar. Meta text is 14 px.
- Only two weights of Inter: 400 to read, 600 to act or label. No italic in UI. Emphasis is 600.
- Counts use tabular figures and thousands separators: 4,232, not 4232.
- Measure: body copy max 680 px (about 75 characters). Hero subline max 560 px.

---

## 4. Space, shape and layout

### 4.1 Spacing

8 px grid with a 4 px half-step for tight insides.

```css
:root {
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-5: 24px;  --space-6: 32px;  --space-7: 40px;  --space-8: 48px;
  --space-9: 64px;  --space-10: 80px; --space-11: 96px; --space-12: 128px;
}
```

| Context | Value |
|---|---|
| Inside chips, buttons, rows | 4, 8, 12, 16 |
| Between blocks in the app (field to field, card to card heading) | 24 |
| Between result cards | 12 |
| Between app sections | 48 |
| Landing section padding, top and bottom | 128 desktop, 96 tablet, 64 mobile |
| Display headline to subline | 40 desktop, 24 mobile |
| Subline to buttons | 40 desktop, 32 mobile |
| Section title to content | 64 desktop, 40 mobile |

### 4.2 Radius

```css
:root {
  --radius-xs: 4px;    /* checkbox */
  --radius-s: 10px;    /* text inputs, textareas, toasts use 12 */
  --radius-m: 16px;    /* app cards, result cards, banners, menus, listboxes */
  --radius-l: 24px;    /* modals, medium marketing cards, about card */
  --radius-xl: 32px;   /* large marketing cards, step cards, hero stage */
  --radius-full: 999px;/* buttons, chips, tags, search fields, nav pills, discs */
}
```

The old `* { border-radius: 0 !important; }` rule goes.

### 4.3 Borders

| Token | Value | Use |
|---|---|---|
| `--line-hair` | `1px solid var(--grey-200)` | Content containers, result cards, list group rules, table rows, top-bar bottom |
| `--line-input` | `1px solid var(--grey-500)` | Inputs at rest |
| `--line-strong` | `1px solid var(--salmon-950)` | Tertiary buttons, filter chips |
| `--line-dashed` | `1px dashed var(--grey-500)` | Missing tags, pending chips |
| `--line-dashed-soft` | `1px dashed var(--grey-300)` | Add and empty cards |
| Focus, error | 2 px | Drawn as `box-shadow: inset 0 0 0 2px` so layout never shifts |

### 4.4 Elevation

Flat by default. Cards never have shadows.

```css
:root {
  --shadow-float: 0 1px 2px rgba(28,22,19,.06), 0 4px 24px rgba(28,22,19,.10); /* menus, listboxes, toasts */
  --shadow-modal: 0 24px 64px rgba(28,22,19,.20);                             /* modals, sheets */
}
```

Z-index: base 0, sticky composer 10, top bar 20, menu 30, scrim 40, modal 50, toast 60.

### 4.5 Layout grid

| Token | Value |
|---|---|
| Breakpoints (min-width, mobile first) | `sm` 480, `md` 768, `lg` 1024, `xl` 1280 |
| Marketing container | max 1120 px, side padding 20 (mobile), 40 (`md`+) |
| Marketing grid | 4 columns, 16 gutter (mobile); 8 columns, 24 gutter (`md`); 12 columns, 24 gutter (`lg`+) |
| Narrow column | 720 px (FAQ answers, legal paragraph) |
| Split section | text 460 px + media 560 px, gap 96 (`lg`+); stacked below |
| Marketing nav | 80 px tall (64 mobile), same container |
| App sidebar | 264 px wide (`lg`+); bottom tab bar below `lg` |
| App top bar | 80 px (`lg`+), 64 px mobile |
| App content column | max 880 px, centred in the space right of the sidebar, side padding 40 (`lg`+), 20 (mobile) |
| Focused flow column (log in, sign up) | 480 px, centred |
| Modal widths | 540 (form, info), 440 (confirm); full width bottom sheet below `sm` |

### 4.6 Icons and imagery

- Icons: 24 px grid, 1.75 px outline stroke, round caps and joins. Filled variants only for the active nav item and the saved state. Use an open set such as Lucide (ISC licence). Sizes 16, 20, 24, 32.
- No illustrations, no stock photos, no 3D objects. Imagery is real product UI with real data, cropped by the section edge.
- Logo: the salmon pixel fish, recoloured to `--salmon-500` with a `--salmon-950` eye and without the 1-bit window frame, next to the wordmark "salmon" set in Archivo 900 lowercase. The name is always lowercase.

---

## 5. Components

All interactive parts are real `<button>` or `<a>` elements. Every component below lists the states it must draw. "Focus" always means the shared focus ring unless the row says otherwise:

```css
:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
.on-deep :focus-visible { outline-color: var(--focus-ring-on-deep); }
```

### 5.1 Buttons

| Size | Height | Padding x | Label | Icon | Use |
|---|---|---|---|---|---|
| L | 48 | 24 | 16/24 600 | 20, gap 8 | Form submits (full width), hero, landing CTAs, search |
| M | 40 | 16 | 16/24 600 | 20, gap 8 | Page actions: Save search, Find works like this |
| S | 32 | 12 | 14/20 600 | 16, gap 6 | Row actions (Run), nav pill, toast action, banner action |

All buttons: `border-radius: var(--radius-full)`, no shadow, `transition: background-color 120ms, box-shadow 120ms, transform 80ms`. Primary always comes first in a group. Gap between buttons 16 (24 in landing splits).

| Variant | Default | Hover | Focus-visible | Active | Disabled | Loading |
|---|---|---|---|---|---|---|
| **Primary** | fill `--salmon-500`, label `--salmon-950` | fill `--salmon-600` | ring 2 px `--salmon-950`, offset 2 | fill `--salmon-700`, `scale(.98)` | fill `--grey-150`, label `--grey-500`, no hover, `cursor: not-allowed` | 20 px spinner in label colour + verb in -ing ("Searching"), width locked, `aria-busy="true"`, clicks ignored |
| **Secondary** | fill `--salmon-100`, label `--salmon-950` | fill `--salmon-200` | same ring | fill `--salmon-200`, `scale(.98)` | as primary | as primary |
| **Tertiary (outline)** | transparent, inset 1 px `--salmon-950`, label `--salmon-950` | fill `--grey-100` | same ring | fill `--grey-200`, `scale(.98)` | inset 1 px `--grey-300`, label `--grey-500` | as primary |
| **Neutral pill** | fill `--grey-100`, label `--grey-900` | fill `--grey-200` | same ring | fill `--grey-200`, `scale(.98)` | as primary | as primary |
| **Inverse** (on salmon band) | fill `--salmon-950`, label `--salmon-50` | fill `--salmon-900` | ring `--salmon-950` (reads on salmon, 7.41:1) | `scale(.98)` | n/a | as primary |
| **Outline on deep** | inset 1 px `--salmon-100`, label `--salmon-100` | fill `--salmon-900` | ring `--salmon-100` | `scale(.98)` | n/a | n/a |
| **Destructive** | transparent, inset 1 px `--red-600`, label `--red-600` | fill `--red-50` | same ring | `scale(.98)` | as tertiary | as primary |
| **Destructive solid** (confirm only) | fill `--red-600`, label white | fill `--red-700` | same ring | `scale(.98)` | as primary | as primary |

**Icon button.** Round, 48 (back, account), 40 (close, save), 32 (overflow, chip remove inside rows). Fill `--grey-100`, icon `--grey-900`; hover `--grey-200`; focus ring; active `scale(.96)`. Always has `aria-label`. **Toggle variant** (save): `aria-pressed="false"` outline bookmark on `--grey-100`; `aria-pressed="true"` filled bookmark on `--salmon-950`, icon `--salmon-50` (15.31:1), label switches from "Save Firefly" to "Remove Firefly from saved". The pressed state is deep, not salmon, so a results list never shows two salmon discs per row (toggles in Wise also turn brand-dark when on).

**Text link.** `--text-link`, weight 600, underline 1 px, `text-underline-offset: 4px`. Hover: underline 2 px. Focus: ring. Visited: same colour. External links add a 16 px arrow-out icon and open in a new tab with `rel="noopener"` and "(opens in a new tab)" in the accessible name. On the deep band links are `--salmon-500`.

### 5.2 Text input

Anatomy: label above (14/20 600 `--text`), 8 px gap, field, 8 px gap, help or error line (14/20).

- Field: height 48, radius 10, padding 0 16, text 16/24 400, fill white, `box-shadow: inset 0 0 0 1px var(--border-input)`.
- Placeholder: `--text-tertiary`. Placeholders are examples, never the label.
- Trailing action (password): Show/Hide neutral pill S inside, 8 px from the right edge. It is a `<button type="button">` with `aria-pressed`.
- Character counter (rename): 14/20 `--text-secondary`, left, 8 below.

| State | Look |
|---|---|
| Default | inset 1 px `--grey-500` |
| Hover | inset 1 px `--grey-900` |
| Focus (any focus, not only keyboard) | inset 2 px `--salmon-950`, no outline |
| Error | inset 2 px `--red-600`; message below with a 16 px info icon, 14/20 `--red-600`; `aria-invalid="true"`, `aria-describedby` points at the message |
| Disabled | fill `--grey-50`, inset 1 px `--grey-200`, text `--grey-500` |
| Read-only | fill `--grey-50`, no border |

Textarea (vibe): same box, min-height 96, padding 12 16, vertical resize.

Rule panel (sign-up password): a tinted panel attached 8 px under the field, radius 10, padding 12 16, one row per rule with a 20 px disc icon. Neutral before input (`--grey-50`, grey ring icon), `--green-50` with a `--green-700` check when passed, `--red-50` with a `--red-600` cross after a failed submit. Announced with `aria-live="polite"`.

### 5.3 Search input with chips (the composer)

The one place you build a search. Pattern from the pill search field and chips in a15 and a09, combined into a token field.

Anatomy, left to right inside one field: search icon 24, chips (inline, wrapping), a borderless text input that fills the rest of the line (min 160 px), and on `md`+ the Search button (primary L) at the end of the last line.

| Part | Spec |
|---|---|
| Field | min-height 64, padding 8 8 8 20, fill white, inset 1 px `--grey-500`, radius `full` while it is one line, 32 once chips wrap |
| Chips | 40 tall, gap 8, see 5.4 |
| Text input | 16/24, placeholder "Add a trope, or a title like Firefly", `aria-label="Add a trope or a title"` |
| Search button | primary L, inside the field on `md`+, full width under the field on mobile |
| Helper line | 14/20 `--text-secondary`, 8 below: "Press Enter to add. Join several with +. Put like before a one-word title." |
| Vibe link | text button "Describe a vibe instead" at the right of the helper line; opens the vibe panel (5.3.1) |

Behaviour:

- **Enter** with text commits it as a chip. Enter in an empty input with at least one chip runs the search. The Search button always runs the search with every chip plus any text still in the input.
- Typing or pasting `a + b + c` makes three chips. A literal `+` and `%2B` in `?q=` both split.
- **Backspace** in an empty input moves focus to the last chip's remove button. A second Backspace removes it.
- Duplicates (case-insensitive) are ignored and the input clears.
- Each chip's remove control is a `<button>` named "Remove {trope}". Clicking the chip body does nothing (fixes accidental removal).

| State | Look |
|---|---|
| Empty | placeholder, Search button enabled (pressing it shows the empty error) |
| Hover | inset 1 px `--grey-900` |
| Focus-within | inset 2 px `--salmon-950` |
| Error (Search with nothing) | inset 2 px `--red-600`, message "Add a trope or a title first." |
| Loading | Search button in loading state ("Searching"), a tertiary M "Stop" appears next to it; chips stay editable |
| Disabled | not used; the composer never disables |

#### 5.3.1 Vibe panel

A grey card (`--grey-100`, radius 16, padding 24) under the composer: label "Describe the story you're in the mood for", textarea, secondary M "Turn into tropes", and the note "Claude suggests tropes from your description. You still choose what to search." Loading: button shows "Reading". New phrases arrive as pending chips in the composer. Failures show a banner (5.11), never the server's raw message.

### 5.4 Trope chips

Chips in the composer are things you control. Tags inside result cards are read-only labels. Both are pills.

**Composer chip:** height 40, padding 0 4 0 16, radius full, label 14/20 600, meta 14/20 400 after a 6 px gap, remove button 32 round at the right (icon 16). Max width 100 %; the label truncates with an ellipsis and the full text is in `title` and the accessible name.

| Type | When | Fill and border | Label | Meta | Extra |
|---|---|---|---|---|---|
| **Unresolved** (pending) | phrase sent to `/api/resolve`, no answer yet | white, `--line-dashed` | the raw phrase, 400 | none | 16 px spinner (static dots under reduced motion), `aria-busy="true"` |
| **Resolved** | resolve returned a trope | `--salmon-100`, none | the trope name, `--salmon-950` | work count, e.g. "1,988 works" | accessible name: "true companions, matched True Companions, used by 1,988 works" |
| **Weak match** (optional) | resolved with `sim` under 0.85 | `--yellow-100`, none | the trope name | "Check this match" | 16 px warning icon in `--yellow-900` before the label |
| **Title** | text starts with "like" or "works like", or the server expands a title | `--grey-100`, none | the title without "like" | "Title"; after search "12 tropes" | leading 20 px title icon; after search the chip gets a disclosure button "Show the 12 tropes from Firefly" |
| **Filter** | a filter word next to a medium alias (only, just, no, not, without, exclude, excluding) | white, `--line-strong` | "Film only", "No fan fiction" | none | leading 16 px funnel icon; never sent to `/api/resolve` |
| **Unknown** | in `unknown[]`, or resolve failed | `--red-50`, inset 1 px `--red-600` dashed | the raw phrase | "No trope found" in `--red-600` | leading 16 px info icon |

Chip remove button: transparent, icon `--grey-700`; hover fill `rgba(28,22,19,.08)`; focus ring. Chip enter: fade and scale from .96, 120 ms. Remove: fade 120 ms, then siblings reflow.

**Result tags** (read-only, inside result cards): height 28, padding 0 10, radius full, 14/20 600, icon 16, gap 6.

| Tag | Look |
|---|---|
| Matched | fill `--salmon-100`, text `--salmon-950`, check icon |
| Missing | white, `--line-dashed`, text `--grey-700`, minus icon; the group starts with the visible word "Missing" (14/20 600 `--grey-700`) |
| Trope link (work page) | 32 tall, fill `--grey-100`, text `--grey-900`, hover `--grey-200`, focus ring; it is an `<a href="/app?trope=…">` |

### 5.5 Cards

| Card | Fill | Radius | Padding | Border | Use |
|---|---|---|---|---|---|
| Large | white on grey band, or `--grey-100` on white | 32 | 40 (24 mobile) | none | Step cards, who-it's-for cards, comparison table |
| Medium | same rule | 24 | 24 | none | About card on the work page, vibe panel (16) |
| Content container | white | 16 | 24 | `--line-hair` | Result cards, menus, bordered lists |
| Navigation card | `--grey-100` | 16 | 16 | none | Whole-card links (examples on mobile); hover `--grey-200`, focus ring |
| Add / empty card | `--grey-50` | 16 | 24 | `--line-dashed-soft` | "Save your first search" prompts |

Cards never have shadows. Contrast comes from white on grey or grey on white.

### 5.6 Result card with coverage meter

The heart of the product. Built on the content container (5.5) and Wise's list-row rhythm (a04): a disc on the left, title over a grey line, value on the right.

```
[1]  Firefly                                     3 of 3   [save]
     TV series · 586 tropes                     ▬ ▬ ▬
     ✓ True Companions  ✓ The Caper  ✓ Anti-Hero

[4]  Blackadder                                  2 of 3   [save]
     TV series · 489 tropes                     ▬ ▬ ▭
     ✓ True Companions  ✓ Anti-Hero   Missing  ⁃ The Caper
```

| Part | Spec |
|---|---|
| Card | white, `--line-hair`, radius 16, padding 20 24 (16 mobile), gap 12 between cards |
| Rank disc | 40 round (32 mobile), 14/20 600 tabular. Full match: `--salmon-500` fill, `--salmon-950` text. Partial: `--grey-100`, `--grey-900` |
| Title | 18/28 600 `--text`, an `<a>` to `/work/{Namespace}/{Slug}`; underline on hover; focus ring |
| Meta | 14/20 `--text-secondary`: media label (5.6.1) · trope count ("586 tropes") |
| Coverage value | 16/24 600 tabular, right aligned: "3 of 3" |
| Coverage meter | under the value, 96 wide (72 mobile), one segment per wanted trope, 6 tall, 2 gap, each segment radius full; with more than 8 segments each one is 8 wide (118 for a 12-trope title). Matched `--meter-fill`, missing `--meter-track`. Above 12 wanted tropes, one continuous bar filled to the share. `aria-hidden="true"` because the text says the same. Same idea as Wise's 4 px segmented stepper (a09), used for coverage instead of progress |
| Tags | 12 below the title row, aligned with the title, wrap with 8 gap. All matched tags, then "Missing" and up to 3 missing tags, then a tertiary S "+7 more" that expands in place. "Missing" and its tags wrap as one group so the word never ends a line alone |
| Save | icon button 40 toggle (5.1) at the far right. Signed out it links to `/login?next=…` |

| State | Look |
|---|---|
| Default | as above |
| Hover | border `--grey-300` |
| Focus | ring on the focused title link or button, not on the card |
| Saved | save button pressed (filled bookmark on deep) |
| Loading | skeleton card (5.14) |
| Narrow (below `md`) | coverage value and meter move under the meta line, inline; save stays top right; tags wrap |

Accessible summary per card, read once: "1. Firefly, TV series, 586 tropes. Has 3 of 3 tropes." The list is an `<ol>`.

#### 5.6.1 Media labels

Never print a raw namespace. Map them:

| Namespace | Label | Namespace | Label |
|---|---|---|---|
| Film | Film | ComicBook | Comic book |
| Series | TV series | Webcomic | Webcomic |
| Anime | Anime | TabletopGame | Tabletop game |
| Manga | Manga | Fanfic | Fan fiction |
| Literature | Book | Music | Music |
| VideoGame | Video game | Wrestling | Wrestling |
| WesternAnimation | Western animation | WebVideo | Web video |
| VisualNovel | Visual novel | WebAnimation | Web animation |

Titles from the API that repeat the medium in brackets ("Quadrilateral Cowboy (Video Game)") drop the bracket when it matches the label.

### 5.7 Sidebar nav (app, `lg`+)

From a01 and a04.

| Part | Spec |
|---|---|
| Container | 264 wide, full height, sticky, white, padding 24 16, no border |
| Logo | fish mark 28 + wordmark, 16 px from the left, 56 px above the first item; links to `/` |
| Item | `<a>`, height 48, radius full, padding 0 16, icon 24 + 16 gap + label 16/24 |
| Items | Search (`/app`), Saved (`/saved`), History (`/history`) |
| Inactive | label `--grey-700` 400, outline icon `--grey-700` |
| Hover | fill `--grey-50`, label `--grey-900` |
| Active | `aria-current="page"`, fill `--grey-100`, label `--salmon-950` 600, filled icon `--salmon-950` |
| Focus | ring |

Below `lg` the same three items become a **bottom tab bar**: 64 tall plus the safe area, white, `--line-hair` on top, three equal tabs, icon 24 over label `micro`. Active tab: icon inside a 56 x 32 `--grey-100` pill, label and icon `--salmon-950`.

### 5.8 Top bars

**App top bar.** 80 tall (64 mobile), above the content column, right aligned, no border.
- Signed out: tertiary S "Log in" and primary S "Sign up".
- Signed in: account button = 40 disc (`--grey-100`, initials 16/24 600 `--salmon-950`) + name or email 14/20 600 + 16 chevron. It opens the account menu: white, radius 16, `--shadow-float`, 280 wide, padding 8. Header: name 16/24 600 and email 14/20 `--text-secondary`. Items 44 tall, 14/20 600, radius 10, hover `--grey-50`: "Saved", "History", a hairline, "Log out". Esc and outside click close it; focus returns to the button.
- Mobile: wordmark on the left (the sidebar is gone), account disc or "Log in" on the right.

**Marketing nav.** 80 tall (64 mobile), white, on the 1120 container. Left: logo. Then links "How it works", "Examples", "Questions", "GitHub" (16/24 600 `--text`, 32 apart, underline on hover). Right: text link "Log in" and primary S "Open salmon". Mobile: logo, primary S "Open salmon", and a 40 icon button "Menu" that opens a full-width sheet with the links as 56 tall rows.

**Focused-flow bar** (log in, sign up). 72 tall, `--line-hair` bottom, logo left, close icon button 40 right ("Close and go back").

### 5.9 Tabs and segmented control

**Tabs** (work page sections if needed): `role="tablist"`, 48 tall, 16/24. Inactive 400 `--grey-700`, hover `--grey-900`. Active 600 `--salmon-950` with a 2 px `--salmon-950` underline the width of the label, flush with a full-width `--line-hair`. Arrow keys move between tabs. Focus ring.

**Segmented control** (`/saved`: Searches | Works, from a07): track `--grey-100`, 44 tall, radius full, padding 4. Thumb white, 36 tall, radius full, no shadow. Labels 14/20 600 `--salmon-950` on both, with a count ("Searches 1"). Thumb slides 200 ms. Each segment is a tab; the URL keeps the choice (`/saved?tab=works`).

### 5.10 Modal

From a05 and a13.

| Part | Spec |
|---|---|
| Scrim | `--scrim`, fades in 200 ms |
| Panel | white, radius 24, `--shadow-modal`, width 540 (form, info) or 440 (confirm), max-width `calc(100% - 32px)` |
| Info | padding 24; title h3 (22/28) and close 40 on one row; body 16/24 `--text-secondary` |
| Form | padding 40 (24 mobile); close on its own row at the right; title 28/36 600; description 16/24 `--text-secondary`; fields; primary L full width |
| Confirm | padding 32; title h3; body 16/24; buttons right aligned: tertiary "Cancel", then destructive solid. Mobile: stacked, full width, action on top |
| Mobile (below `sm`) | bottom sheet: full width, radius 24 24 0 0, slides up 280 ms |

Behaviour: `role="dialog"`, `aria-modal="true"`, labelled by its title. Focus goes to the first field, or to Cancel in a destructive confirm. Tab is trapped. Esc and scrim click close it (not while submitting). Focus returns to the control that opened it.

Used for: Save search (name it), Rename search, Clear history (confirm).

### 5.11 Banner

From a01 and a24. Full content width, radius 16, padding 16 (24 on `md`+), gap 16, a 32 px icon disc on the left, text, optional action on the right (S button or text link), optional close 32.

| Variant | Fill | Disc | Text | Role | Example |
|---|---|---|---|---|---|
| Info | `--grey-100` | `--salmon-950` with an `--salmon-50` "i" | `--text` | `status` | The vibe field isn't set up on this server |
| Warning | `--yellow-300` | `--yellow-900` with a `--yellow-300` "!" | `--yellow-900` | `status` | Some of your tropes are weak matches |
| Error | `--red-50` | `--red-600` with a white "!" | title `--red-600` 600, body `--text` | `alert` | Google sign-in didn't work |
| Success | `--green-50` | `--green-700` with a white check | `--text` | `status` | rarely needed; prefer a toast |

Title 16/24 600, body 14/20. Banners never show stack traces, status codes, env var names or file paths.

### 5.12 Toast

From a11. One at a time, bottom centre, 24 above the viewport edge (16 above the tab bar on mobile). Min-height 48, max-width 480, radius 12, fill `--grey-900`, text 14/20 `--salmon-50`, padding 12 20 (12 8 12 20 with an action). Action: primary S ("Undo", "View"). `role="status"`, `aria-live="polite"`. Stays 5 s, 8 s with an action, pauses on hover or focus. Enter: rise 16 px and fade, 200 ms. Exit: fade 160 ms.

Copy is past tense, 2 to 4 words: "Search saved.", "Removed from saved.", "History cleared.", "Logged in as {name}."

### 5.13 Empty state

Centred in its container, padding 48 24. Icon disc 64 `--grey-100` with a 32 outline icon in `--salmon-950`. Title 20/28 600. Body 16/24 `--text-secondary`, max 400 wide, saying what will appear here and how. One action (primary or secondary M). Inside a bordered card: disc 48, title 18/28.

### 5.14 Skeleton loading

Blocks in `--grey-100`, text lines as pills 60 % of the line height tall, discs as circles. A result-card skeleton mirrors 5.6 exactly (disc, two lines, meter, three tags). Three cards while searching. Shimmer: `linear-gradient(90deg, var(--grey-100), var(--grey-50), var(--grey-100))` at 200 % size, 1.4 s linear infinite. Under reduced motion: no shimmer. Show skeletons only after 150 ms so fast answers don't flash. The results region gets `aria-busy="true"` and a live region says "Searching 85,633 works."

### 5.15 List row

From a04, a07, a22. Used on `/saved`, `/history` and the examples list.

- Min-height 72, disc 48 (`--grey-100`, or white with a 1 px `--grey-200` ring for actions), 16 gap, title 16/24 600, secondary 14/20 `--text-secondary` (one line, ellipsis), right side: S buttons and an overflow icon button 32 ("More actions for {name}").
- No dividers. Groups get a 14/20 `--text-secondary` label with a `--line-hair` under it, 16 above the first row.
- Clickable rows: hover `--grey-50` with radius 16 and 16 px inner padding; the row's main link carries the focus ring.

### 5.16 Accordion (FAQ)

From m13. Each item is a `<button aria-expanded>` with the question (18/26 600) and a 24 chevron in `--salmon-950` on the right, padding 20 0. Answer 16/24 `--text-secondary`, max 720 wide, 24 bottom padding, ending with a text link when there is somewhere to go. No dividers. First item open. Chevron rotates 180 degrees in 200 ms.

### 5.17 Comparison table

From m08. White card, radius 32, on a grey band, max 760 wide. Group headings 24/32 600. Rows: 24 check icon, label 18/26 600, optional sub-label 14/20 `--text-secondary`. The right column is a solid `--salmon-500` column 200 wide holding short answers in 18/26 600 `--salmon-950`, running full height with the card's right radius. Group separators `--line-hair`. On mobile the salmon column becomes a salmon pill under each label.

---

## 6. Motion

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 120 ms | colour and border changes, chip enter and exit |
| `--dur-base` | 200 ms | menus, toasts, accordion, segmented thumb, scrim |
| `--dur-slow` | 280 ms | modals, sheets |
| `--ease-standard` | `cubic-bezier(.2, 0, 0, 1)` | everything entering or moving |
| `--ease-exit` | `cubic-bezier(.4, 0, 1, 1)` | leaving |
| Press | `transform: scale(.98)`, 80 ms | buttons, chips |

Rules:

- Motion explains a change (a chip arrived, a menu opened). It never decorates.
- Nothing moves more than 16 px. No parallax, no auto-playing carousels, no animated counters.
- Results appear without animation; the list is the answer, not a show.
- `@media (prefers-reduced-motion: reduce)`: durations drop to 0 ms except opacity fades (keep 120 ms), no scale, no shimmer, spinners become a static "Loading" label with dots.

---

## 7. Accessibility

Target: WCAG 2.2 AA everywhere, AAA contrast for body text where the palette allows (it does for all primary text).

1. **Real elements.** Clicks go on `<button>` or `<a>`. No clickable `<span>`/`<div>`. Links go somewhere; buttons do something. Trope pills on the work page are links.
2. **Labels.** Every input has a visible `<label>` or, for the composer and filter fields, an `aria-label`. Placeholders are examples only.
3. **Focus.** Every interactive element shows the 2 px ring on `:focus-visible` (`--salmon-950`, or `--salmon-100` on the deep band). Inputs show a 2 px border on any focus. Never `outline: none` without a replacement.
4. **Targets.** Minimum 24 x 24 px for any target, 40 to 48 for primary ones. Chip remove buttons are 32.
5. **Structure.** One `h1` per page (visually hidden on `/app` once results show). Landmarks: `header`, `nav` (sidebar, tab bar and marketing nav each labelled), `main`, `footer`. A "Skip to content" link is the first focusable element.
6. **Live regions.** Search status ("Searching 85,633 works", "4,232 works found", "Search stopped") in one polite region. Errors in `role="alert"`. Toasts polite.
7. **After a search,** focus moves to the results heading (`tabindex="-1"`) and the page scrolls it into view under the composer. Never scroll to the bottom of the list.
8. **Dialogs and menus** trap focus, close on Esc, and return focus. Disclosures use `aria-expanded` and `aria-controls`.
9. **Colour is never the only signal** (2.4).
10. **Reduced motion** respected (6). No blinking cursors.
11. **Text resize.** Layout holds at 200 % zoom and 320 px width. No fixed heights on text containers.
12. **Document titles** per page: "Search · salmon", "Firefly · salmon", "Saved · salmon", "Log in · salmon", "Page not found · salmon".
13. **Language.** `<html lang="en">`. Media labels and trope names are left as written.

---

## 8. Voice and copy

### 8.1 Rules

- **Plain and short.** One idea per sentence. Most sentences under 15 words.
- **Second person.** "Your tropes", "you can". salmon is "salmon", lowercase, never "we" in product UI. Marketing may use "salmon" as the subject.
- **Sentence case** for everything, including buttons, headings and labels. The only uppercase is display type, and it is written in sentence case in the source.
- **Verb-first buttons, 1 to 4 words:** "Search", "Save search", "Run again", "Find works like this", "Open salmon".
- **Say what happened and what to do next.** Errors name the fix, not the fault: "Use at least 8 characters." not "Invalid password."
- **Be specific to tropes and stories.** Name real tropes and real works from the data in examples. No generic "content" or "items".
- **Honest limits.** Say that matching is loose, that results stop at 25, that the vibe field is optional.
- **Numbers:** only real ones from the data or the README. Thousands separators. "1 trope", "2 tropes", never "1 tropes".

### 8.2 Never

- These words: unlock, seamless, elevate, dive in, effortless, powerful, revolutionize, journey, harness, game-changer, cutting-edge, robust, supercharge, delve, leverage, empower.
- Em dashes. Use a full stop, a comma or a colon.
- Emojis. Exclamation marks.
- Invented numbers, ratings, reviews, testimonials, user counts or sample results.
- Jargon in the UI: "resolve", "namespace", "vds", "coverage", "vibe, don't search", "READY.", raw errors, env var names, HTTP codes.

### 8.3 Words we use

| Say | Not |
|---|---|
| trope | tag, keyword |
| work | item, title (when meaning the thing itself), content |
| title (what you type after "like") | seed |
| media type, or the label (Film, TV series) | namespace |
| has 2 of 3 tropes | covers 2/3, coverage |
| missing | not matched |
| matched (a phrase matched a trope) | resolved |
| search | vibe, query (in UI) |
| log in, log out (verbs); login (noun, rare) | sign in, signin |
| sign up | register |
| saved | bookmarks, favourites |

### 8.4 Key strings (old to new)

| Where | Old | New |
|---|---|---|
| `/app` empty heading | "Describe a vibe below, salmon turns it into tropes…" | display: "What story are you after?" body: "Add tropes in plain words, or a title. salmon ranks 85,633 works by how many of them each one has." |
| Composer placeholder | "add a trope or phrase, or a title like Firefly" | "Add a trope, or a title like Firefly" |
| Results summary | "4232 works cover some of 3 tropes, fullest first:" | h2 "4,232 works" + "have at least 1 of your 3 tropes. Showing the top 25, fullest first." |
| Title expansion | "expanded Firefly into tropes." | "Firefly became 12 tropes. Show them" |
| Medium bar | "MEDIUM: FILM ✕ · RESULTS LIMITED TO THIS MEDIUM" | "Only film" + "Clear filter" |
| Nothing resolved | "Nothing resolved to a real trope." | "None of those matched a trope. Try other wording, or start from a title with like." |
| Filter only | (same as above) | "Add a trope or a title too. Filters like movies only narrow a search but can't start one." |
| No results | "no work covers any of those tropes." | "No work has any of those tropes. Remove one, or try broader wording." |
| No results with a medium filter | (none) | "No works left after the filter." Body: "Works with those tropes exist, but none match the filter. Clear it to search every medium." With secondary M "Clear filter" |
| Stopped | "Stopped." | "Search stopped." + "Search again" |
| Search error | "Search failed. TypeError: Failed to fetch" | "salmon couldn't reach its search server. Try again in a moment." + "Try again" |
| Vibe not set up | "Could not read the vibe: ANTHROPIC_API_KEY is not set…" | "The vibe field isn't set up on this server. Trope search works without it." |
| Sign-up 422 | "[object Object]" | "Enter an email address like name@example.com." |
| Wrong password | "Wrong email or password." | "That email and password don't match. Try again." |
| Email taken | "An account with that email already exists." | "There's already an account with this email. Log in instead." |
| Google failed | (never shown) | "Google sign-in didn't work. Try again, or log in with email." |
| Google not set up | raw 503 JSON page | "Google sign-in isn't set up on this server." |
| Saved works empty | "no saved works yet. save one from a result with the star." | "No saved works yet" + "Save a work from your results or its page and it shows up here." |
| History empty | "no history yet. run a search." | "No searches yet" + "Searches you run while logged in show up here." |
| Clear history | "clear all history?" | "Clear all history?" + "This removes every search in your history. You can't undo it." |
| Work intro missing | "No description in this dataset." | (kept) |
| Work not found | "Not found." | "We couldn't find that work" + "There's no work at Film/NopeDoesNotExist in this dataset. Check the link, or search for it by title." |

---

## 9. Page blueprints

Reference codes (m01, a15 and so on) point to section 12.

### 9.1 `/` landing

Container 1120. Bands alternate white and `--grey-100`. Section padding 128 / 96 / 64. Copy lives in the landing copy doc; headlines quoted here are final.

| # | Section | Band | Layout | References |
|---|---|---|---|---|
| 1 | Marketing nav | white | 5.8 | m01, m19 |
| 2 | **Hero** | white, then salmon stage | Centred. `display-xl` headline "Name the tropes. Find the story." (2 lines desktop, 4 mobile). `body-l` subline opening with real numbers: "85,633 works. 33,164 tropes. 16 media types." max 560. Then the hero search: a 64 tall pill field (label "Tropes to search for", placeholder "true companions + the caper + anti-hero") with primary L "Search" inside, max 640; a plain GET form to `/app` with `name="q"`, so it works without JavaScript. Under it: tertiary L "See examples" and a 14/20 hint. Below, a salmon stage (1120 wide, radius 32 on top, `--salmon-500`) with a white app card rising out of it showing the real top 3 results for that query, cropped by the next band. | m01 (structure), m02 (accent stage), m03 (real UI as the image) |
| 3 | **Proof numbers** | grey | A 560 hairline centred, then 4 stats split by 1 px vertical hairlines: 85,633 works, 33,164 tropes, 16 media types, 12 tropes from one title. `stat` numbers, 18/26 600 labels. 2 x 2 on mobile. | m12 |
| 4 | **How it works** | grey (continues) or white | `display-m` title, one primary L "Try a search" above the cards, 3 white step cards (radius 32, padding 40, gap 24): big numeral in Inter 400 72 px `--grey-700`, step title h2, one-sentence body. Stacked on mobile. | m06, m07 |
| 5 | **Real results** (deep band) | deep | Left: `heading-xl` in `--salmon-500` + `body-l` intro in `--salmon-50`. Right: white result card list (radius 24) with the real query and 5 real rows. Under it, 3 features with 72 px `--salmon-900` icon discs and `--salmon-500` titles explaining ranking rules. | m10, m09 |
| 6 | **Start from a title** (split) | white | Text left (`heading-l`, `body-m`, primary L + text link), media right: a composer crop showing "like Cowboy Bebop" as a title chip and its expanded tropes. | m03, m04, m18 |
| 7 | **Filter by medium** (split, mirrored) | white | Media left (filter chips "Film only", "No fan fiction"), text right. | m04 |
| 8 | **What a search gives you** | grey | Comparison table (5.17): rows grouped Searching / Results / Access, salmon column with short honest answers ("Top 25", "Optional"). | m08, m11 |
| 9 | **Who it's for** | white | `display-m` title, 2 large `--grey-100` cards (radius 32) with a 48 white icon disc, `display-s` title (Fans, Writers) and `body-m`. | m11, m19 |
| 10 | **FAQ** | white | `display-m` title centred, accordion (5.16), 6 questions. | m13 |
| 11 | **Closing band** | salmon | Full bleed, 420 tall, centred `display-l` in `--grey-900`, one `body-m` line, inverse L "Open salmon". | m14 (structure only), m02 |
| 12 | **Footer** | grey | 4 link columns (salmon, Examples, Project, Data), hairline, logo + MIT line, then the centred licence paragraph (14/22) with the TVTropes CC BY-NC-SA credit. Footer links underlined. | m15, m16 |

Mobile: nav collapses (5.8), hero field 56 tall with Search full width under it, the stage shows 2 rows, splits stack media under text, the table becomes stacked rows with salmon pills.

### 9.2 `/app` search

App shell: sidebar (5.7) with Search active, top bar (5.8), content column 880. References: a01 (shell), a15 and a09 (search field, chips, flow heading), a04 and a02 (rows and cards), a14 (no results), a11 (toast), a13 (save modal).

Top to bottom:

1. **Heading.** Before the first search: `display-s` "What story are you after?" and a `body` line (8.4). After a search the display heading hides and a visually hidden `h1` "Search" remains.
2. **Composer** (5.3) with helper line and "Describe a vibe instead".
3. **Before any search: examples.** Group label "Try one of these" + hairline, then 4 list rows from the README (disc with a search icon, the query as title, the README result line as secondary, chevron). Each row is a link to `/app?q=…` and runs it.
4. **Results header** after a search: h2 "4,232 works" + body line, and on the right secondary M "Save search" (signed out: it goes to `/login?next=…`). Under it, only when relevant:
   - Filter row: chips "Only film" / "No fan fiction" (include and exclude both shown) + text button "Clear filter". Clearing removes only items the medium alias table recognises, then searches again.
   - Title row: "Firefly became 12 tropes." + text button "Show them" revealing the 12 tropes as tags.
   - Unmatched row: "No trope found for: zzz."
   - Weak-match banner (warning) if any chip is a weak match.
5. **Result list:** `<ol>` of 25 result cards (5.6).
6. **List footer:** 14/20 `--text-secondary`: "Showing the top 25 of 4,232. salmon returns 25 results per search." and the TVTropes credit link.

States:

| State | What shows |
|---|---|
| Empty (first visit) | heading, composer, examples |
| Chips added, not searched | chips in their states; examples stay |
| Searching | Search button loading, "Stop" next to it, 3 skeleton cards, live region "Searching 85,633 works." |
| Results | header + list; focus on the h2 |
| Stopped | info banner "Search stopped." + secondary S "Search again"; previous results stay if there were any |
| Error | error banner (8.4) + secondary S "Try again" |
| Nothing matched | empty state, title "None of those matched a trope", body as 8.4 |
| Filter only | empty state "Add a trope or a title too" |
| No results | empty state "No work has any of those tropes"; with a medium filter "No works left after the filter" and "Clear filter" (8.4) |
| Signed in | save toggles on cards, Save search active, history recorded silently |
| Google failed (`?auth=google_failed`) | error banner at the top of the content column, then the URL is cleaned |

Deep links: `?q=a + b + c` (literal `+` or `%2B`) seeds chips and runs the search. `?trope=Name` seeds one chip (first) and runs. `?auth=ok|google_failed` shows a toast or banner and is removed from the URL. After every search the URL becomes `/app?q=…` (items joined by ` + `, `+` encoded as `%2B`) so results can be shared, refreshed and reached with Back.

Mobile: top bar with logo and account, composer full width with Search under it, cards in narrow layout, bottom tab bar. The composer is not fixed to the bottom any more; results get the screen.

### 9.3 `/work/[...id]`

Same app shell (Search stays active). References: a12 (detail page with back button, big header, actions), a03 (empty state, back button), a17 (display-caps name), a08 (bordered sections).

1. Back icon button 48 "Back to results" (uses history when the previous page is `/app`, otherwise links to `/app`).
2. Eyebrow 14/20 600 `--text-secondary`: media label ("TV series").
3. Title: `display-m`, uppercase, wraps freely.
4. Meta 16/24 `--text-secondary`: "586 tropes".
5. Actions, gap 12: primary M "Find works like this" (`/app?q=like Firefly`), secondary M toggle "Save" / "Saved" with bookmark icon (signed out: `/login?next=`), tertiary M "Open on TVTropes" (external).
6. About card (medium, `--grey-100`, radius 24, padding 32): h3 "About", intro 16/24 max 680, or "No description in this dataset." in `--text-secondary`.
7. Tropes: h2 "586 tropes", a pill filter field 48 ("Filter tropes"), a hint "Select a trope to find works that share it.", then trope links (5.4) alphabetically, the first 60, then secondary M "Show all 586 tropes". Filtering shows "12 match" live.
8. Credit: "Trope list and description from TVTropes, under CC BY-NC-SA." + link to the work's page.

States: loading (skeleton title, meta, about card, 24 chip pills), not found (9.7), error (error banner + Try again). Document title "Firefly · salmon".

### 9.4 `/login` and `/signup`

Separate pages replacing the popover. Focused flow: no sidebar, focused-flow bar (5.8), 480 column, 64 from the bar (32 mobile). References: a18 (sign-up layout and social row), a21 (log in with errors), a20 (password rule panel), a24 (disabled button).

| | `/login` | `/signup` |
|---|---|---|
| Title (h1, centred) | "Log in to salmon" | "Create your salmon account" |
| Sub-line (14/20, centred) | "New to salmon? Sign up" | "Already have an account? Log in" |
| Why line | none | "An account saves your searches, works and history. You don't need one to search." |
| Fields (24 apart) | Email, Password (Show/Hide) | Email, Password (Show/Hide, rule panel "At least 8 characters"), Name (optional) |
| Autocomplete | `email`, `current-password` | `email`, `new-password`, `name` |
| Primary L, full width | "Log in" ("Logging in") | "Create account" ("Creating account") |
| Divider | hairline with "or" (14/20 `--text-secondary`) | same |
| Google | tertiary L full width with Google's "G" mark, "Continue with Google", a plain link to `{API}/api/auth/google/login` | same |
| After success | go to `next` (default `/app`), toast "Logged in as {name or email}." | same, toast "Account created." |

Errors: field errors under the field (5.2). Wrong email or password: error banner above the form, focus moves to it. The 422 array is mapped to the email field. Google not configured: the button is disabled with help text "Google sign-in isn't set up on this server." This needs a capability signal from the API or a probe before navigating; until then, keep the plain link and show the banner on return. `next` is validated to same-origin paths only.

### 9.5 `/saved`

App shell, Saved active. References: a07 (segmented control, list), a04 (rows), a17 (account rows, Log out pill), a03 (empty state), a13 (rename modal), a11 (undo toast).

1. h1 "Saved".
2. Segmented control: "Searches 1" | "Works 2".
3. Searches tab: list rows. Disc with a bookmark icon; title = the saved name; secondary = the items joined with " + "; right: secondary S "Run" and overflow 32 with a menu "Rename", "Delete". Run goes to `/app?q=…`. Rename opens a form modal ("Rename search", input prefilled, counter, Save). Delete removes at once with an "Undo" toast (re-saves the same name and items).
4. Works tab: list rows. Disc with the media icon; title = work title as a link to `/work/…`; secondary = "TV series · saved Nov 6"; right: save toggle icon button (pressed). Removing shows an "Undo" toast. Saved state stays in sync with result cards.
5. Empty searches: "No saved searches yet" / "Run a search, then choose Save search to keep it here." + secondary M "Go to search".
6. Empty works: "No saved works yet" / "Save a work from your results or its page and it shows up here." + "Go to search".
7. Signed out: empty state "Log in to see what you saved" / "Saving needs an account. Searching doesn't." + primary M "Log in" + tertiary M "Create account".
8. Loading: 3 skeleton rows. Error: error banner + Try again.

### 9.6 `/history`

App shell, History active. References: a06 (date-grouped list), a07 (rows), a03 (empty), a13 (confirm modal pattern).

1. Header row: h1 "History"; right, destructive M "Clear history" when the list has rows.
2. Note 14/20 `--text-secondary`: "Your last 100 searches, newest first."
3. Groups by local date: "Today", "Yesterday", "Wednesday, November 5". Rows: clock disc; title = items joined with " + "; secondary = time ("11:26 PM"); right: secondary S "Run again". Consecutive identical searches collapse into one row with "2 times".
4. Clear history: confirm modal "Clear all history?" / "This removes every search in your history. You can't undo it." / Cancel + "Clear history". Then toast "History cleared."
5. Empty: "No searches yet" / "Searches you run while logged in show up here." + "Go to search". Signed out: "Log in to keep a history" with the same buttons as 9.5.

### 9.7 Not found, empty and error states

| State | Layout | Copy | Actions | Reference |
|---|---|---|---|---|
| Unknown route (`app/not-found.tsx`) | marketing nav, centred, `display-l` | "Nothing here" / "That page doesn't exist. Search for a trope or a title instead." | hero-style search field (GET `/app`), tertiary L "Go to the home page" | m01, a14 |
| Work not found (`{found:false}`) | app shell, empty state | "We couldn't find that work" / "There's no work at {id} in this dataset. Check the link, or search for it by title." | primary M "Search for it" (`/app?q=like {slug split into words}`), tertiary M "Back to search" | a03, a14 |
| Work failed to load | app shell, error banner | "This work didn't load. Try again in a moment." | secondary S "Try again" | a01 |
| Page crashed (`app/error.tsx`) | focused bar, centred | "This page didn't load" / "Something broke while loading it. Your saved searches and works are not affected." | primary L "Try again", tertiary L "Go to search" | a14 |
| Empty lists | 5.13 | see 9.5 and 9.6 | one action | a03 |
| Search empty states | 5.13 inside the results area | see 9.2 | none or "Clear filter" | a14 |

---

## 10. Must keep working

The redesign changes how things look and read. It must not break any of these.

**API contract (`lib/api.ts`)**
- [ ] Base URL from `NEXT_PUBLIC_SALMON_API` (default `http://localhost:8000`); every call uses `credentials: "include"`; cookie session `salmon_session`, no tokens in JS.
- [ ] `POST /api/vds_search {items}` with raw item strings, including `like X` and filter clauses, unchanged wording.
- [ ] `POST /api/resolve {phrases}` for chip preview; titles and filter clauses skip it.
- [ ] `POST /api/vibe {vibe}`; the error arrives in `error` with HTTP 200.
- [ ] FastAPI `detail` shown as a message, including the 422 array form.
- [ ] Saved-work delete keeps the slash: `/api/saved_works/{ns}/{slug}`, each part encoded.

**Deep links**
- [ ] `/app?q=a + b + c` splits on `+`, literal or `%2B`.
- [ ] `/app?trope=Name` seeds one chip; combines with `q` (trope first).
- [ ] `/app?auth=ok|google_failed` is handled and cleaned from the URL.
- [ ] `/work/{Namespace}/{Slug}` catch-all, segments encoded when built and decoded on read.
- [ ] The landing search is a plain GET form to `/app` with `name="q"` and works without JavaScript.

**Auth**
- [ ] Search works fully logged out; auth only gates saved features.
- [ ] Sign up (email, password of 8+ characters, optional name), log in, log out, session restore via `GET /api/auth/me`.
- [ ] Google sign-in stays a full-page navigation to `{API}/api/auth/google/login`; callback returns to `/app?auth=…`.
- [ ] Signed-in user shown as name, or email when there is no name.

**Saved items**
- [ ] Saved searches: save under a name, list newest first, run (same raw items), rename, delete.
- [ ] Saved works: toggle from any result with an optimistic update and server reconcile on failure; list with links; remove; state in sync between cards, work page and `/saved`.
- [ ] History: recorded on every signed-in search, fire and forget; newest first; run; clear all with a confirm.

**Search**
- [ ] Coverage ranking, fullest first; `total`, matched/wanted and missing per row.
- [ ] Title expansion with the source removed; medium include and exclude filters, and clearing them.
- [ ] Stop an in-flight search.
- [ ] Case-insensitive chip dedupe; vibe adds only new phrases.

**Work page**
- [ ] Title, media type, trope count, intro with the "No description in this dataset." fallback, every trope linking to `/app?trope=`, and the TVTropes source link.

**Licence**
- [ ] "Trope data from TVTropes.org, CC BY-NC-SA" on the landing footer, under the search results, and on every work page with a link to that work's TVTropes page.

---

## 11. Implementation notes

- Replace `frontend/app/globals.css` tokens with 2.2, 3.1, 4.1 to 4.4 and 6. Remove the dither background, `-webkit-font-smoothing: none`, `image-rendering: pixelated` and the zero-radius rule.
- If Tailwind v4 stays, map the tokens in an `@theme` block (colours, radii, spacing, fonts) so utilities and components share one source.
- Move inline styles in the panels, `AuthBar` and `WorkView` into components that read tokens.
- New routes: `/login`, `/signup`, `/saved`, `/history`, `app/not-found.tsx`, `app/error.tsx`. `AuthBar` becomes the top-bar account button and menu.
- Per-page `metadata` titles (7.12).
- Medium alias table for filter chips lives in the frontend (copied from `backend/app/vds.py`) so filter clauses are recognised before search.
- Optional API additions that would let the UI avoid dead ends: a capability flag for the vibe field and Google sign-in.

---

## 12. Reference index

Screens studied on Mobbin (Wise, web). Structure only; nothing in this list is copied into salmon.

**Marketing (m)**

| Code | File | Used for | Mobbin |
|---|---|---|---|
| m01 | `01-home-hero-nav.jpg` | Hero structure, nav | https://mobbin.com/sites/sections/6519aa00-d71a-4aaa-be73-8f7de5e10dfd |
| m02 | `02-hero-lime-centered.jpg` | Full-bleed accent band, inverted nav pills, real UI rising from the bottom | https://mobbin.com/sites/sections/60a7108e-7961-402b-b337-c97179c21f4c |
| m03 | `03-hero-split-app.jpg` | Split layout with product UI | https://mobbin.com/sites/sections/622fd829-f613-4df0-b838-dc632c88d8c2 |
| m04 | `04-feature-photo-split.jpg` | Feature split, button pair | https://mobbin.com/sites/sections/e3c46749-cd4c-4bd3-ad5d-abb58aeae4bb |
| m05 | `05-feature-icons-3col.jpg` | Band alternation, 3 columns, inline links | https://mobbin.com/sites/sections/0312f120-3af5-40ed-804e-7466220e3146 |
| m06 | `06-steps-numbered-cards.jpg` | Numbered step cards on grey | https://mobbin.com/sites/sections/96d6e07b-b406-4314-b256-23ca5e0d76bc |
| m07 | `07-steps-illustrated-3col.jpg` | Numbered step titles | https://mobbin.com/sites/sections/a3a293ad-d3d1-4489-8d41-c8685c46c353 |
| m08 | `08-fees-comparison-table.jpg` | Table with an accent column | https://mobbin.com/sites/sections/fc55109b-710e-40dc-811b-9334772fa37c |
| m09 | `09-pricing-hero-cards.jpg` | White cards on a coloured band | https://mobbin.com/sites/sections/ad2c592f-5439-41a9-8c88-7b32902c5543 |
| m10 | `10-trust-forest-band.jpg` | Dark band with accent heading and icon discs | https://mobbin.com/sites/sections/0740a282-cb01-4c0f-9720-8d842a95359a |
| m11 | `11-trust-gray-cards.jpg` | Grey cards on white, honest limits | https://mobbin.com/sites/sections/86884925-0fbf-422b-a4cb-0b05900378af |
| m12 | `12-proof-stats-row.jpg` | Stats row with hairlines | https://mobbin.com/sites/sections/9ee1bd46-6fd5-4be7-8042-5641109b664e |
| m13 | `13-faq-accordion.jpg` | FAQ accordion | https://mobbin.com/sites/sections/ace1769f-7e25-4797-9aaa-207b201e6c67 |
| m14 | `14-cta-band-texture.jpg` | Closing band structure (not its artwork) | https://mobbin.com/sites/sections/83be77f7-4581-49bd-894e-bf9048e51b22 |
| m15 | `15-footer-sitemap.jpg` | Footer grid and legal paragraph | https://mobbin.com/sites/sections/971cf46e-6853-4dcd-8f00-70fb0cb1b176 |
| m16 | `16-footer-with-cta.jpg` | Footer with a call to action | https://mobbin.com/sites/sections/664bb15d-db1e-4525-a72f-267047e3dea1 |
| m18 | `18-about-story-split.jpg` | Story split, text link CTA | https://mobbin.com/sites/sections/4118e46b-a401-491c-a268-3cb53da1050f |
| m19 | `19-help-topic-cards.jpg` | Minimal header, topic cards | https://mobbin.com/sites/sections/8db1c1a4-d099-4d44-a74b-a897c715f813 |

**App (a)**

| Code | File | Used for | Mobbin |
|---|---|---|---|
| a01 | `01-home-dashboard-banner.jpg` | App shell, sidebar, top bar, banner, button trio | https://mobbin.com/screens/ede78e65-ca02-449f-96c0-f36420fe9281 |
| a02 | `02-payments-hub-list.jpg` | Grey cards, dashed add cards, row cards | https://mobbin.com/screens/f712f58b-b93e-45c2-9d0b-9343202ca1bf |
| a03 | `03-balance-empty-state-menu.jpg` | Back button, empty state, menu | https://mobbin.com/screens/ef617d17-16af-473d-847f-cef12f0c81fa |
| a04 | `04-cards-list-rows.jpg` | List rows, group label | https://mobbin.com/screens/e35e6d64-4168-4422-9d59-2b41cc08ff96 |
| a05 | `05-info-modal.jpg` | Info modal | https://mobbin.com/screens/e2d1976b-83c2-4381-a177-4c874d994db7 |
| a06 | `06-transactions-filter-drawer.jpg` | Date-grouped list | https://mobbin.com/screens/df55d675-aa05-4175-8618-5785dffcb9a4 |
| a07 | `07-payment-requests-segmented.jpg` | Segmented control, rows | https://mobbin.com/screens/eb611ac0-c79d-4783-b2a5-e4f959ac9ebb |
| a08 | `08-transaction-detail-timeline.jpg` | Bordered detail card, tabs | https://mobbin.com/screens/ea2fde3e-8b3e-4ef8-92d9-ea5dc9e51fda |
| a09 | `09-flow-stepper-split-bill.jpg` | Pill search field, segmented 4 px bar (coverage meter) | https://mobbin.com/screens/e548f9f7-a4a3-413e-9ef7-e35e9f90d557 |
| a11 | `11-detail-toast-undo.jpg` | Toast with Undo | https://mobbin.com/screens/cdebb2c8-108a-4a6c-9436-98b9725a15b9 |
| a12 | `12-recipient-detail-toggle.jpg` | Detail page header and actions | https://mobbin.com/screens/da55ae64-eaa0-417e-9b05-4ae3f7cb18ac |
| a13 | `13-modal-form-input.jpg` | Form modal | https://mobbin.com/screens/e62b7226-6fd3-46e5-abd9-595448cd7359 |
| a14 | `14-search-no-results.jpg` | Search with no results | https://mobbin.com/screens/e5df8364-16e9-446f-bc07-093905d825d2 |
| a15 | `15-recipient-picker-search-chips.jpg` | Display-caps flow heading, search pill, chips | https://mobbin.com/screens/db8c137e-4f58-4242-b275-59aac54c45b7 |
| a17 | `17-account-hub-menu.jpg` | Account rows, Log out pill | https://mobbin.com/screens/718ef2cb-909a-4825-8de4-4e7e0fadd0fa |
| a18 | `18-signup-email-social.jpg` | Sign-up page | https://mobbin.com/screens/fa52fce0-5032-40d6-90ad-7e7ce55d1ef9 |
| a20 | `20-password-validation-error.jpg` | Error field, rule panel | https://mobbin.com/screens/ba203514-7deb-4ff6-89eb-c11eca2b1860 |
| a21 | `21-login-errors-checkbox.jpg` | Log in with field errors | https://mobbin.com/screens/c8b89375-9fc9-42b0-9c4b-421c0214c58d |
| a22 | `22-settings-security-list.jpg` | Settings rows | https://mobbin.com/screens/7e7def86-cd0a-4342-9308-a0f2dc21bfa7 |
| a24 | `24-banner-input-disabled-button.jpg` | Info banner, disabled button | https://mobbin.com/screens/c0fd2686-ea15-4c2e-99c3-6a37771437fa |

---

salmon design system 2.0. Archivo and Inter under the SIL Open Font License. Trope data from TVTropes.org, CC BY-NC-SA.
