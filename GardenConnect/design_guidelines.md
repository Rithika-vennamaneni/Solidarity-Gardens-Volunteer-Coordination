# Solidarity Gardens Volunteer Matching Tool - Design Guidelines

## Design Approach
**Utility-Focused Application Design**  
This is a functional tool, not a marketing site. Design prioritizes clarity, ease of use, and quick task completion. Reference simple form-driven applications like Typeform and Google Forms for their clean, distraction-free interfaces.

## Layout System & Spacing
**Spacing Primitives**: Use Tailwind units of 4, 6, 8, and 12 consistently
- Form fields: mb-6 between fields
- Section padding: py-12 on mobile, py-16 on desktop
- Container max-width: max-w-2xl (keep forms narrow and focused)
- Page margins: px-4 on mobile, px-6 on desktop

**Layout Strategy**:
- Single-column centered layouts throughout
- Landing page: Centered content, vertically centered in viewport
- Form page: Top-aligned with generous top padding (pt-16)
- Results page: Stacked card layout, max-w-3xl container

## Typography Hierarchy
**Font Stack**: System fonts (ui-sans-serif, system-ui) for clean, fast-loading text

**Type Scale**:
- Page title (H1): text-4xl font-bold
- Section headers (H2): text-2xl font-semibold
- Card titles: text-xl font-semibold
- Form labels: text-sm font-medium uppercase tracking-wide
- Body text: text-base
- Helper text: text-sm
- Buttons: text-base font-medium

## Component Library

**Navigation (Minimal)**
- Simple header bar with logo/title on left, "Start Over" link on right
- Height: h-16
- Border bottom for subtle separation
- Sticky positioning on scroll (sticky top-0)

**Landing Page**
- Single focused section, vertically centered (min-h-screen with flex centering)
- Title + tagline + single CTA button
- No hero image (keep it clean and fast-loading)
- White background with centered content

**Form Components**
- Labels above inputs with consistent mb-2 spacing
- Text inputs: Full width with border, rounded corners (rounded-lg), padding p-3
- Checkboxes: Grid layout (grid-cols-2 on mobile, grid-cols-3 on desktop) with gap-4
- Dropdowns: Styled select elements matching text inputs
- Focus states: Visible border emphasis on active fields
- Submit button: Full width on mobile, auto width centered on desktop

**Garden Result Cards**
- White background with subtle border
- Rounded corners (rounded-xl)
- Padding: p-6
- Stack: Garden name (bold, large) → Location (text-sm) → Needs description → Contact button
- Spacing between cards: space-y-6
- Each card includes all information without requiring expansion

**Buttons**
- Primary CTA: Large, rounded (rounded-lg), full width on mobile
- Secondary actions: Outlined style, medium size
- Contact buttons: Smaller, right-aligned within cards
- All buttons: py-3 px-6 with font-medium text

## Form UX Patterns
**Progressive Disclosure**: Keep all form fields visible at once (no multi-step wizard) - this is a quick form
**Field Organization**:
- Personal info (name, email) at top
- Skills checkboxes in clear grid
- Availability/preferences grouped together
- Submit button at bottom with generous top margin (mt-8)

**Validation**:
- Inline validation messages below fields
- Required field indicators in labels
- Clear error states with helpful messaging

## Results Page Layout
**Header Section**:
- Success message: "We found X gardens that match your skills!"
- Brief explanation of matches
- "Start Over" button prominently placed

**Results Grid**:
- Single column card stack
- Each card fully self-contained with all info visible
- Contact button within each card
- Generous spacing between cards (space-y-6)

## Mobile Responsiveness
**Breakpoint Strategy**:
- Mobile-first approach (base styles for mobile)
- Tablet adjustments at md: breakpoint
- Desktop refinements at lg: breakpoint

**Mobile Optimizations**:
- Full-width buttons and form fields
- Skills checkboxes: 2 columns
- Reduced padding and margins
- Touch-friendly tap targets (min 44px height)

**Desktop Enhancements**:
- Constrained content width (max-w-2xl/3xl)
- Skills checkboxes: 3 columns
- Inline button layouts where appropriate

## Accessibility
- Semantic HTML throughout (form, label, button elements)
- Proper label-input associations with for/id attributes
- ARIA labels where needed
- Keyboard navigation support for all interactive elements
- Focus indicators on all focusable elements
- Sufficient color contrast for all text

## Animation & Interactions
**Minimal Animations**:
- Smooth transitions on hover states (transition-colors duration-200)
- Gentle fade-in for results cards (optional CSS animation)
- No distracting scroll effects or parallax

**Hover States**:
- Buttons: Slight opacity change or subtle background shift
- Cards: Subtle shadow increase on hover
- Links: Underline on hover

## Images
**No Images Required**: This tool prioritizes speed and simplicity. No hero images, no decorative graphics. The focus is purely on functionality and quick task completion.