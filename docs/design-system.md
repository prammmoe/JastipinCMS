# JASTIPin CMS Design System

## Direction

JASTIPin uses a quiet, operational interface inspired by modern analytics and commerce admin tools. White and warm gray remain the foundation, while a focused rose-pink accent creates hierarchy across primary actions, active navigation, focus states, and compact highlights. Pink is used deliberately rather than as a large background so dense operational data remains the focus.

## Foundations

### Color

| Token | Value | Usage |
| --- | --- | --- |
| `--neutral-0` | `#FFFFFF` | Main canvas, cards, inputs |
| `--neutral-50` | `#F7F7F7` | Subtle surfaces and feedback |
| `--neutral-100` | `#F1F1F1` | Table headers, avatars |
| `--neutral-200` | `#E5E5E5` | Default borders, active navigation |
| `--neutral-300` | `#D4D4D4` | Strong borders |
| `--neutral-500` | `#737373` | Secondary text |
| `--neutral-700` | `#404040` | Supporting foreground |
| `--neutral-900` | `#171717` | Primary text |
| `--neutral-950` | `#0A0A0A` | Destructive actions and maximum contrast |
| `--pink-50` | `#FFF5F7` | Row hover and subtle accent surface |
| `--pink-100` | `#FFE7EE` | Active navigation and feedback surface |
| `--pink-200` | `#FFCDDB` | Accent borders |
| `--pink-500` | `#E93468` | Focus border and decorative emphasis |
| `--pink-600` | `#D51E55` | Primary actions and brand mark |
| `--pink-700` | `#B61445` | Hover state and accent text |
| `--pink-900` | `#7C1538` | High-contrast feedback text |

Pink is an interface accent, not the sole carrier of meaning. Status pills retain visible text and borders so states remain understandable without color perception. Destructive actions stay charcoal/black to separate them from constructive primary actions.

### Typography

- Typeface: Inter, downloaded from Google Fonts and served locally through `next/font/local`.
- Weights: 400 body, 500 UI labels, 600 headings and actions, 700 available for exceptional emphasis.
- Page title: 24–30 px, 600 weight, tight tracking.
- Section title: 20 px, 600 weight.
- Body/UI: 13–14 px.
- Metadata: 10–12 px.

### Shape and elevation

- Inputs and buttons: 7 px radius.
- Navigation: 10 px radius.
- Cards and data panels: 12 px radius.
- Borders provide separation; shadows are limited to a nearly invisible one-pixel lift.

### Spacing

- Main content: 32 px desktop, 18 px mobile.
- Card content: 20–24 px.
- Form fields: 16 px gaps.
- Table cells: 14 px vertical and 16 px horizontal.

## Components

### Application shell

- 264 px fixed warm-gray sidebar with a border on the right.
- 72 px sticky white top bar focused on user identity; resource-level search remains inside the relevant data screen.
- Active navigation uses a pale pink fill, pink icon, and dark pink text.
- On mobile, the sidebar becomes an interruptible 220 ms drawer.

### Buttons

- Primary: accessible dark rose-pink background with white text.
- Secondary: white background, gray border.
- Ghost: transparent, used for icon-only utilities.
- Buttons scale to `0.97` on press for immediate feedback.
- Potentially destructive actions use charcoal/black and explicit wording rather than sharing the constructive pink treatment.

### Inputs

- White surface, gray border, 42 px minimum height.
- Focus uses a pink border with a subtle translucent pink ring.
- Labels remain visible above the field; placeholders are examples, not replacements for labels.

### Data panels and tables

- A bordered panel contains the toolbar and table.
- Toolbar includes the resource count, search, refresh, and relevant actions.
- Header rows use a light gray fill without uppercase letter spacing.
- Rows rely on dividers and a very pale pink hover surface rather than zebra striping.

### Feedback and statuses

- Feedback uses pale pink surfaces and increasingly dark pink text/borders for emphasis.
- Copy and icons explain the state; status badges are compact pink-tinted bordered pills.

## Motion and accessibility

- Frequent workflows such as scanner input and table navigation do not animate.
- Hover and press transitions stay between 120–220 ms and affect only color, opacity, or transform.
- Hover styling is gated to fine pointers.
- Reduced-motion preferences collapse transitions to near-instant feedback.
- Focus states remain visible and all icon-only controls require accessible labels.

## Implementation Sources

- Tokens and component classes: `src/app/globals.css`
- Local Inter setup: `src/app/layout.tsx`
- Application shell: `src/components/layout/dashboard-shell.tsx`
- Shared page header: `src/components/ui/page-header.tsx`
