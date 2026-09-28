# AGENTS.md

## Project Goal
Build a professional, responsive landing page in Next.js based on the provided reference screenshot.

The screenshot is the primary visual reference. Match its overall structure, spacing, proportions, colors, typography, section hierarchy, and professional organizational style without copying source code.

## Working Rules
- Inspect the existing project before changing anything.
- Preserve the existing Next.js setup and conventions.
- Use TypeScript when the project already uses it.
- Use Tailwind CSS when already installed; otherwise use the project's existing styling approach.
- Do not add unnecessary dependencies.
- Do not build backend, authentication, database, dashboard, or API features.
- Focus on frontend landing-page implementation.
- Do not use emoji as UI icons.
- Prefer an existing icon library such as Lucide if available.
- Avoid excessive gradients, glassmorphism, and flashy animations.
- Keep the visual language formal, clean, and similar to the reference.
- Use reusable components and data-driven lists.
- Use `next/image` where appropriate.
- Use semantic HTML and accessible labels.
- Make every section responsive.

## Reference
The reference image should be available to the coding agent as the screenshot supplied with this task. If the project contains a local copy, prefer that local asset.

## Visual Direction
Primary colors:
- Navy: approximately #14245C
- Orange: approximately #FF6600
- Light gray: approximately #F3F3F3
- White: #FFFFFF
- Dark text: approximately #222222

The exact values may be adjusted after visual comparison with the reference.

## Required Sections
1. Header / Hero
2. Membership Registration Steps
3. About Us
4. Membership Renewal Steps
5. Partner Logos
6. News & Information
7. SBU Registration Steps
8. Member Works
9. Additional Partner Logos
10. Footer

## Image Policy
Do not fetch random images from the internet just to fill the page.
Use local assets or clean placeholders until real assets are provided.

## Validation
Before finishing:
- Run the project's available lint/typecheck/build commands.
- Fix errors introduced by the implementation.
- Verify desktop and mobile layouts.
- Check spacing, alignment, typography, and overflow.
- Do not modify unrelated project functionality.

## Communication
After implementation, report:
- files created/changed
- validation commands run
- remaining limitations or assets that still need replacement
