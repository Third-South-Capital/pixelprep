# PixelPrep EntryThingy Design System

## Overview

PixelPrep implements the **EntryThingy design system** to provide a professional, consistent user experience that matches the visual language of EntryThingy's platform. This ensures brand consistency and creates a familiar interface for users across both applications.

## Design Principles

### 1. Professional Minimalism
Clean, uncluttered interfaces that prioritize content and functionality over decorative elements.

### 2. Semantic Color System
Colors have meaning and purpose, not just aesthetic value. Each color communicates specific states or actions.

### 3. Accessible by Default
All components meet WCAG AA accessibility standards with proper contrast ratios, keyboard navigation, and screen reader support.

### 4. Responsive Design
Mobile-first approach that scales beautifully across all device sizes and orientations.

## Color System

### Primary Color Palette

#### Light Mode (Default)
```css
/* Background Colors */
--color-bg-primary: #ffffff        /* Main backgrounds, cards */
--color-bg-secondary: #f9fafb      /* Secondary areas, hover states */
--color-bg-tertiary: #f3f4f6       /* Disabled states, subtle areas */
--color-bg-inverse: #111827        /* Dark elements in light mode */

/* Text Colors */
--color-text-primary: #111827      /* Main text, headings */
--color-text-secondary: #4b5563    /* Secondary text, descriptions */
--color-text-tertiary: #6b7280     /* Metadata, timestamps, placeholders */
--color-text-inverse: #ffffff      /* Text on dark backgrounds */

/* Border Colors */
--color-border-primary: #e5e7eb    /* Main borders, dividers */
--color-border-secondary: #f3f4f6  /* Subtle borders */

/* Action Colors */
--color-accent-primary: #3b82f6    /* Primary actions, links, CTAs */
--color-accent-primary-hover: #2563eb  /* Primary hover state */
--color-accent-secondary: #16a34a  /* Success, positive actions */
--color-accent-purple: #6b21a8     /* Admin, special functions */
--color-accent-purple-hover: #581c87   /* Purple hover state */
```

#### Dark Mode
```css
/* Background Colors */
--color-bg-primary: #111827        /* Main backgrounds */
--color-bg-secondary: #1f2937      /* Secondary areas */
--color-bg-tertiary: #374151       /* Tertiary areas */
--color-bg-inverse: #ffffff        /* Light elements in dark mode */

/* Text Colors */
--color-text-primary: #f3f4f6      /* Main text */
--color-text-secondary: #d1d5db    /* Secondary text */
--color-text-tertiary: #9ca3af     /* Tertiary text */
--color-text-inverse: #111827      /* Text on light backgrounds */

/* Border Colors */
--color-border-primary: #374151    /* Main borders */
--color-border-secondary: #1f2937  /* Subtle borders */

/* Action Colors */
--color-accent-primary: #60a5fa    /* Primary actions */
--color-accent-primary-hover: #93c5fd  /* Primary hover */
--color-accent-secondary: #4ade80  /* Success states */
--color-accent-purple: #a855f7     /* Admin functions */
--color-accent-purple-hover: #c084fc   /* Purple hover */
```

### Color Usage Guidelines

#### When to Use Each Color

**Primary Blue (`--color-accent-primary`)**
- Main call-to-action buttons
- Primary navigation links
- Form submission buttons
- Active states

**Secondary Green (`--color-accent-secondary`)**
- Success messages and states
- Confirmation actions
- Positive feedback indicators
- Completed process states

**Accent Purple (`--color-accent-purple`)**
- Admin or advanced functions
- Gallery/user management actions
- Secondary CTAs that need distinction

**Text Hierarchy**
- Primary: Main headings, important labels
- Secondary: Body text, descriptions, captions
- Tertiary: Timestamps, metadata, placeholders

## Typography

### Font Stack
```css
font-family: 'Outfit', 'Inter', 'system-ui', 'sans-serif';
```

### Font Weights
- **100-300**: Light weights (rarely used, special emphasis)
- **400**: Regular body text
- **500**: Medium (form labels, secondary emphasis)
- **600**: Semibold (button text, card titles)
- **700**: Bold (section headings)
- **800-900**: Black (main headings, hero text)

### Typography Scale

#### Headings
```css
/* Main page heading */
.heading-hero: text-4xl md:text-5xl font-black

/* Section headings */
.heading-section: text-2xl font-bold

/* Subsection headings */
.heading-subsection: text-xl font-semibold

/* Card/component titles */
.heading-card: text-lg font-semibold
```

#### Body Text
```css
/* Large body text (hero descriptions) */
.text-large: text-xl

/* Standard body text */
.text-body: text-base (16px)

/* Small text (metadata, captions) */
.text-small: text-sm (14px)

/* Tiny text (legal, fine print) */
.text-tiny: text-xs (12px)
```

## Component Patterns

### Buttons

#### Primary Button
```tsx
<button className="accent-primary-bg text-inverse px-8 py-3 rounded-lg font-semibold accent-primary-hover transition-colors">
  Primary Action
</button>
```

#### Secondary Button
```tsx
<button className="accent-purple-bg text-inverse px-4 py-2 rounded-full font-semibold accent-purple-hover transition-colors">
  Secondary Action
</button>
```

#### Tertiary Button
```tsx
<button className="bg-primary border border-primary font-semibold px-8 py-3 rounded-lg hover:bg-secondary transition-colors">
  Tertiary Action
</button>
```

### Cards

#### Basic Card
```tsx
<div className="bg-primary rounded-xl shadow-lg border border-primary p-6">
  <h3 className="text-lg font-semibold text-primary mb-2">Card Title</h3>
  <p className="text-secondary">Card content goes here.</p>
</div>
```

#### Interactive Card
```tsx
<button className="bg-primary rounded-xl border-2 border-primary hover:border-accent-primary hover:bg-secondary transition-all duration-300 p-6 text-left">
  <h3 className="text-lg font-semibold text-primary">Interactive Card</h3>
  <p className="text-secondary">Clickable card content.</p>
</button>
```

### Forms

#### Input Field
```tsx
<input className="w-full px-4 py-3 rounded-lg border border-primary bg-primary text-primary placeholder:text-tertiary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors" />
```

#### Checkbox
```tsx
<input
  type="checkbox"
  className="rounded border-primary accent-primary focus:ring-2 focus:ring-accent-primary"
/>
```

## Layout System

### Container Sizes
```css
/* Main content container */
.container-main: max-w-5xl mx-auto

/* Section containers */
.container-section: py-16 px-4

/* Component containers */
.container-component: space-y-8
```

### Spacing Scale
```css
/* Micro spacing */
gap-1, gap-2: 4px, 8px

/* Component spacing */
gap-4, gap-6, gap-8: 16px, 24px, 32px

/* Layout spacing */
space-y-8, space-y-12: 32px, 48px vertical

/* Section spacing */
space-y-32: 128px between major sections
```

### Grid Systems
```css
/* Preset selector grid */
grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6

/* Two-column layout */
grid md:grid-cols-2 gap-8

/* Responsive flex layout */
flex flex-col sm:flex-row gap-4
```

## Interaction States

### Hover States
- **Buttons**: Background color change + subtle scale/shadow
- **Cards**: Border color change + background tint
- **Links**: Underline appearance + color change

### Focus States
- **All Interactive Elements**: 2px accent-primary ring
- **Keyboard Navigation**: Clear visual indication
- **Skip Links**: Available for screen readers

### Loading States
- **Spinners**: Accent-primary colored with opacity variations
- **Skeleton**: Subtle gray pulse animation
- **Progress**: Accent-primary filled bars

## Dark Mode Implementation

### Toggle Behavior
1. **Default State**: Light mode
2. **User Preference**: Remembered via localStorage
3. **System Preference**: Optional respect for OS setting
4. **Toggle Location**: Top-left corner (moon/sun icon)

### Transition Handling
```css
transition-colors duration-300
```
Applied to all elements that change between themes for smooth transitions.

### Component Adaptations
- All colors use CSS variables
- Images may have dark mode variants
- Shadows are reduced/adjusted in dark mode
- Text contrast maintained across all themes

## Accessibility

### Color Contrast
- **Text on Background**: 4.5:1 minimum ratio (WCAG AA)
- **Interactive Elements**: 3:1 minimum ratio
- **Focus Indicators**: High contrast, never color-only

### Keyboard Navigation
- **Tab Order**: Logical, follows visual hierarchy
- **Focus Traps**: In modals and dropdowns
- **Skip Links**: Available to bypass navigation
- **Shortcuts**: Arrow keys for grid navigation

### Screen Reader Support
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Descriptive labels for interactive elements
- **Live Regions**: Status updates announced
- **Alternative Text**: Meaningful descriptions for images

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## File Structure

### Core Design System Files
```
frontend/src/
├── index.css              # CSS variables, base styles, utilities
├── tailwind.config.js     # Extended Tailwind configuration
├── hooks/
│   └── useDarkMode.ts     # Dark mode state management
└── components/
    └── DarkModeToggle.tsx # Theme switching component
```

### CSS Architecture
```css
/* index.css structure */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Font imports */
@font-face { ... }

/* CSS Variables for theming */
@layer base {
  :root { /* light mode variables */ }
  :root.dark { /* dark mode variables */ }
  body { /* base styles */ }
}

/* Accessibility */
@layer base {
  @media (prefers-reduced-motion: reduce) { ... }
}

/* Utility classes */
@layer utilities {
  .bg-primary { background-color: var(--color-bg-primary); }
  /* ... */
}
```

## Design System Maintenance

### Adding New Colors
1. Define in CSS variables (light & dark modes)
2. Add to Tailwind config
3. Create utility classes
4. Document usage guidelines
5. Test accessibility compliance

### Creating New Components
1. Use existing design tokens
2. Follow established patterns
3. Ensure accessibility compliance
4. Test in both light and dark modes
5. Document usage examples

### Updating the System
1. Maintain backward compatibility
2. Update all affected components
3. Test across all user flows
4. Update documentation
5. Consider migration guides for breaking changes