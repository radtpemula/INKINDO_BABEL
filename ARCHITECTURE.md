# ARCHITECTURE.md

## Overview
The landing page should be component-based, responsive, and easy to maintain.

Suggested structure:

```text
app/
  page.tsx
  globals.css

components/
  Header.tsx
  Hero.tsx
  MembershipSteps.tsx
  AboutSection.tsx
  RenewalSteps.tsx
  Partners.tsx
  NewsSection.tsx
  SbuRegistration.tsx
  MemberWorks.tsx
  Footer.tsx

data/
  landing.ts

public/
  images/
```

Adapt this structure to the existing project rather than forcing a new architecture.

## Component Responsibilities

### Header
Navigation, logo, primary navigation links, and mobile menu.

### Hero
Large visual/banner area, headline, CTA, and any secondary navigation/search element visible in the reference.

### MembershipSteps
Reusable four-step process:
- Registrasi
- Terima Notifikasi
- Pembayaran
- Berhasil

### AboutSection
Organization description, Vision, Mission, and supporting illustration.

### RenewalSteps
Four-step membership renewal process:
- Login
- Edit Data
- Pembayaran
- Berhasil

### Partners
Reusable partner/sponsor logo grid.

### NewsSection
Three-column desktop news cards containing date, image, category/title, description, and metadata.

### SbuRegistration
Four-step SBU registration process:
- Anggota INKINDO BABEL
- Pengisian Formulir Online
- Pembayaran
- Berhasil

### MemberWorks
Member work/article gallery.

### Footer
Dark navy footer with organization information, contact details, social links, and copyright.

## Data-Driven Content
Repeated content should come from arrays/objects instead of duplicated JSX.

Example:

```ts
export const registrationSteps = [
  {
    title: "Registrasi",
    description: "...",
    icon: "..."
  },
  // ...
];
```

Keep content separate from presentation where practical.

## Responsive Layout
Desktop:
- Full-width hero
- Horizontal process steps
- Two-column About section
- Three-column news
- Multi-column member works

Tablet:
- Reduce container width and spacing
- Allow grids to wrap

Mobile:
- Collapsible navigation
- Single-column content where appropriate
- Process steps stack or use a compact two-column grid
- News and member works become single-column
- Partner logos wrap cleanly
- Footer stacks vertically

## Styling Principles
- Use a centered max-width container around 1100–1200px.
- Use generous section spacing.
- Alternate white and light-gray sections as shown in the reference.
- Navy is the primary structural color.
- Orange is used mainly for accents, icons, and CTAs.
- Avoid excessive rounded cards when the reference uses flatter sections.
- Preserve whitespace and visual hierarchy.

## Reusability
If multiple sections use the same visual process-step pattern, create a reusable component rather than duplicating markup.

If multiple sections use the same card pattern, create a reusable card component where it improves consistency without over-engineering.

## Accessibility
- Semantic headings in correct order.
- Meaningful alt text.
- Keyboard-accessible controls.
- Visible focus states.
- Sufficient color contrast.
- Mobile menu must be keyboard usable.
