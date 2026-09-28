# FLOW.md

## Implementation Flow

```text
START
  |
  v
Inspect existing Next.js project
  |
  v
Check package.json / styling / routing
  |
  v
Identify reusable existing components
  |
  v
Create landing-page data
  |
  v
Build global layout + Header
  |
  v
Build Hero
  |
  v
Build Membership Registration Steps
  |
  v
Build About Section
  |
  v
Build Renewal Steps
  |
  v
Build Partner Logos
  |
  v
Build News & Information
  |
  v
Build SBU Registration Steps
  |
  v
Build Member Works
  |
  v
Build Footer
  |
  v
Responsive pass
  |
  v
Visual comparison with reference
  |
  v
Fix spacing / typography / colors / alignment
  |
  v
Run lint / typecheck / build
  |
  v
DONE
```

## Development Phases

### Phase 1 — Project Inspection
Do not immediately rewrite the project.

Inspect:
- package.json
- app/pages structure
- existing CSS/Tailwind setup
- existing components
- existing assets

### Phase 2 — Structure
Implement all landing-page sections and their responsive containers.

At this stage prioritize:
- correct section order
- correct proportions
- correct layout
- reusable components

### Phase 3 — Visual Matching
Compare implementation against the reference.

Adjust:
- section heights
- container width
- vertical spacing
- typography sizes
- icon sizes
- colors
- image ratios
- card proportions
- alignment

### Phase 4 — Responsive
Check:
- desktop
- tablet
- mobile

Do not simply scale the desktop layout down. Reflow content where necessary.

### Phase 5 — Validation
Run available:
- lint
- typecheck
- build

Fix implementation errors before finishing.

## Content Flow

User visits page
  ↓
Hero / organization introduction
  ↓
Membership registration process
  ↓
About organization
  ↓
Membership renewal process
  ↓
Partners
  ↓
News & information
  ↓
SBU registration process
  ↓
Member works
  ↓
Partners
  ↓
Footer / contact information

## Important Constraint
The first implementation should be a polished frontend prototype.

Real backend functionality, authentication, payment processing, CMS, and database integration are intentionally outside this phase.
