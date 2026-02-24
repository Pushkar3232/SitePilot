# 🎨 Pallet Ross — UI Design System & Color Guide

> An art marketplace UI inspired by the **Pallet Ross** design — clean, editorial, bold typography with vibrant art imagery.

---

## 🖼️ Design Overview

The UI follows a **modern editorial / art-commerce** aesthetic with two distinct section styles:

| Section | Style |
|--------|-------|
| Hero (Light) | White background, left-aligned text, floating artwork cards |
| Hero (Dark) | Soft gray background, center-aligned headline, fan-spread artwork cards |

---

## 🎨 Color Palette

### Primary Colors

| Role | Color Name | Hex Code | Preview |
|------|-----------|----------|---------|
| Background (Light) | Off White | `#F5F5F5` | ⬜ |
| Background (Dark) | Light Gray | `#EBEBEB` | 🔲 |
| Primary Text | Near Black | `#0D0D0D` | ⬛ |
| Accent / Highlight | Deep Crimson Red | `#8B1A1A` | 🟥 |
| CTA Button | Jet Black | `#111111` | ⬛ |
| CTA Button Text | Pure White | `#FFFFFF` | ⬜ |

### Tag / Badge Colors

| Role | Color Name | Hex Code |
|------|-----------|----------|
| User Tag (Coral) | Salmon Red | `#E8533A` |
| User Tag (Teal) | Muted Teal | `#3A9E8A` |
| User Tag Text | White | `#FFFFFF` |

### Secondary / UI Colors

| Role | Color Name | Hex Code |
|------|-----------|----------|
| Border / Divider | Light Gray | `#E0E0E0` |
| Subheading Label | Medium Gray | `#888888` |
| Secondary Button Border | Gray | `#CCCCCC` |
| Secondary Button Text | Black | `#111111` |

---

## 🔤 Typography

### Font Stack
```css
font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
```

> The design uses a clean sans-serif with high contrast between weights.

### Type Scale

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Eyebrow Label (E-COMMERCE) | 12px | 500, Letter-spaced | `#888888` |
| H1 Headline | 64–72px | 800–900 (Black) | `#0D0D0D` |
| H1 Accent Line | 64–72px | 800–900 (Black) | `#8B1A1A` |
| H2 Headline | 56–64px | 800 | `#0D0D0D` |
| Body Copy | 14–16px | 400 | `#444444` |
| CTA Button Text | 14–15px | 600 | `#FFFFFF` |
| Secondary Button | 14–15px | 500 | `#111111` |

---

## 🧩 UI Components

### 1. Navigation Bar

```
[ Logo ]  Get Started  ⏺ Create Strategy  Pricing  Contact  Solution  E-Commerce  [ 👤 ] [ ⚙️ ]
```

- **Background:** Transparent / White
- **Height:** ~60px
- **Active Nav Item:** Slightly bold or underlined
- **Icons:** Simple monochrome (user, settings)
- **Logo:** Teal/green geometric mark + brand name in black

---

### 2. Hero Section — Light Variant

**Layout:** Two-column (Text Left | Art Cards Right)

```
┌────────────────────────────────────────────────┐
│  E-COMMERCE                                     │
│                                                 │
│  Showcase, Sell,                                │
│  & acquire arts to          [ Art Cards        │
│  our marketplace.             Fan / Stack ]     │
│                                                 │
│  Short description text                         │
│                                                 │
│  [Join for $9.99/m]  [Read more]               │
└────────────────────────────────────────────────┘
```

- Background: `#F5F5F5`
- Eyebrow: uppercase, letter-spaced, gray
- H1: Multi-line, bold black + crimson red accent line
- Description: ~2–3 lines, 14–16px gray text
- Art cards: Overlapping, slightly rotated, drop shadow

---

### 3. Hero Section — Dark Variant (Section 2)

**Layout:** Centered text with fan-spread cards below headline

```
┌────────────────────────────────────────────────┐
│                                                 │
│       A place to display your                  │
│             masterpiece.                        │
│                                                 │
│  @coplin 🗨               @andrea 🗨           │
│    [ Artwork cards spread in a fan arc ]        │
│                                                 │
│   Artists can display their masterpieces...    │
│                                                 │
│           [Join for $9.99/m]  [Read more]      │
└────────────────────────────────────────────────┘
```

- Background: `#EBEBEB`
- H1: Centered, 2 lines, heavy weight
- Cards: 6–8 artwork thumbnails spread in a fan/arc
- User tags float above cards with colored backgrounds

---

### 4. Artwork Cards

```css
.artwork-card {
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transform: rotate(±3deg to ±8deg); /* slight tilt */
  width: 180–220px;
  aspect-ratio: 1 / 1;
}
```

- Cards overlap each other
- Slight rotation for organic feel
- Drop shadow for depth

---

### 5. User Tags (Floating Bubbles)

```css
.user-tag {
  background: #E8533A;   /* or #3A9E8A for teal variant */
  color: #FFFFFF;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

Format: `@username`

---

### 6. CTA Buttons

#### Primary Button
```css
.btn-primary {
  background: #111111;
  color: #FFFFFF;
  border-radius: 50px;       /* Pill shape */
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
```

#### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: #111111;
  border-radius: 50px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  border: 1.5px solid #CCCCCC;
  cursor: pointer;
}
```

---

## 📐 Layout & Spacing

| Property | Value |
|----------|-------|
| Max Container Width | 1200–1400px |
| Section Padding (Vertical) | 80–100px |
| Section Padding (Horizontal) | 48–80px |
| Column Gap | 48–64px |
| Card Border Radius | 14–18px |
| Button Border Radius | 50px (pill) |
| Grid | 12-column, CSS Grid or Flexbox |

---

## 🌗 Light vs Dark Section Comparison

| Property | Section 1 (Light) | Section 2 (Dark) |
|----------|-------------------|------------------|
| Background | `#F5F5F5` | `#EBEBEB` |
| Text Align | Left | Center |
| Headline Size | ~64px | ~60px |
| Card Layout | Stacked / overlapping right | Fan arc spread |
| Tag Colors | Coral (`#E8533A`) | Teal (`#3A9E8A`) |
| CTA Position | Left-aligned | Centered |
| Description | Yes, visible | Shorter, center |

---

## 💡 Design Principles

1. **Minimal chrome** — Let the artwork do the talking; UI elements are clean and unobtrusive.
2. **Bold typography** — Extra-heavy headline weights create editorial impact.
3. **Color restraint** — Palette is almost monochrome (black/white/gray) with a single accent color (crimson) for energy.
4. **Art as hero** — Rotating, overlapping cards make artwork the visual centerpiece.
5. **Pill-shaped CTAs** — Rounded buttons feel modern and approachable.
6. **Social proof via tags** — Floating `@username` bubbles suggest community/activity organically.

---

## 🛠️ Suggested Tech Stack

| Layer | Recommendation |
|-------|---------------|
| Framework | React / Next.js |
| Styling | Tailwind CSS or CSS Modules |
| Animation | Framer Motion (for card fan animation) |
| Font | Google Fonts — `Inter` or `Sora` |
| Icons | Lucide Icons |
| Image Handling | Next.js `<Image>` with object-fit: cover |

---

## 📦 CSS Variables (Ready to Use)

```css
:root {
  /* Backgrounds */
  --bg-light: #F5F5F5;
  --bg-dark: #EBEBEB;
  --bg-white: #FFFFFF;

  /* Text */
  --text-primary: #0D0D0D;
  --text-secondary: #444444;
  --text-muted: #888888;

  /* Accent */
  --accent-red: #8B1A1A;
  --tag-coral: #E8533A;
  --tag-teal: #3A9E8A;

  /* Buttons */
  --btn-primary-bg: #111111;
  --btn-primary-text: #FFFFFF;
  --btn-secondary-border: #CCCCCC;

  /* Borders */
  --border-light: #E0E0E0;

  /* Shadows */
  --shadow-card: 0 8px 30px rgba(0, 0, 0, 0.15);
  --shadow-tag: 0 4px 12px rgba(0, 0, 0, 0.15);

  /* Border Radius */
  --radius-card: 16px;
  --radius-btn: 50px;
  --radius-tag: 20px;

  /* Typography */
  --font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  --font-hero: clamp(48px, 6vw, 72px);
  --font-body: 15px;
  --font-label: 12px;
}
```

---

*Design reference: Pallet Ross Art Marketplace UI — documented for replication and adaptation.*
