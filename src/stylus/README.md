# 🎨 Modern Styling System

A comprehensive, production-ready styling system with glassmorphism, smooth animations, and scroll reveals.

## 📁 Structure

```
stylus/
├── base/
│   ├── _reset.scss              # CSS reset
│   ├── _tokens.scss             # Design tokens (colors, spacing, etc.)
│   ├── _globals.scss            # Global styles
│   ├── _utilities.scss          # Basic utility classes
│   ├── _modern-utilities.scss   # Modern utility classes
│   ├── _animations.scss         # Animation system
│   └── _reveal.scss             # Scroll reveal system
├── components/
│   └── *.module.scss            # Component-specific styles
├── sections/
│   └── *.module.scss            # Page section styles
├── theme/
│   ├── light.scss               # Light theme overrides
│   └── dark.scss                # Dark theme overrides
└── util/
    └── mixins.scss              # SCSS mixins
```

## 🚀 Quick Start

### 1. Import in your component
```jsx
import styles from './MyComponent.module.scss';
```

### 2. Use utility classes
```jsx
<div className="card glass hover-lift" data-reveal="up">
  <h2 className="gradient-text">Hello World</h2>
</div>
```

### 3. Use design tokens
```scss
.my-component {
  background: var(--surface-1);
  color: var(--on-surface-0);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-subtle);
}
```

## 🎨 Design Tokens

### Colors
```scss
// Brand colors
--brand          // Primary brand color
--accent         // Secondary accent
--brand-soft     // Soft brand background
--accent-soft    // Soft accent background

// Surfaces (glassmorphism)
--surface-0      // Base surface
--surface-1      // Elevated surface
--surface-2      // Highest surface

// Text colors
--on-surface-0   // Primary text
--on-surface-1   // Heading text
--on-surface-muted // Secondary text

// Status colors
--danger, --success, --info
--danger-soft, --success-soft, --info-soft

// Borders
--border-soft    // Subtle borders
--border-strong  // Prominent borders
```

### Spacing
```scss
--space-1: 4px   --space-5: 20px
--space-2: 8px   --space-6: 24px
--space-3: 12px  --space-7: 28px
--space-4: 16px  --space-8: 32px
```

### Border Radius
```scss
--radius-xs: 6px    --radius-lg: 18px
--radius-sm: 10px   --radius-xl: 24px
--radius-md: 14px   --radius-pill: 9999px
```

### Shadows
```scss
--shadow-subtle  // Light shadow
--shadow-soft    // Medium shadow
--shadow-strong  // Heavy shadow
```

### Motion
```scss
--motion-fast: 200ms
--motion-med: 300ms
--motion-slow: 500ms
--motion-ease-out: cubic-bezier(0.22, 0.61, 0.36, 1)
```

## 🎬 Scroll Reveal

### Basic Usage
```html
<!-- Single element -->
<div data-reveal="up">Fade in from bottom</div>
<div data-reveal="scale">Scale in</div>
<div data-reveal="blur">Blur in</div>

<!-- List with stagger -->
<ul data-reveal="list-up">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

### Directions
- `up` - Fade in from bottom
- `down` - Fade in from top
- `left` - Fade in from left
- `right` - Fade in from right
- `scale` - Scale in
- `zoom` - Zoom in
- `blur` - Blur in

### Speed Modifiers
```html
<div data-reveal="up snappy">Fast</div>
<div data-reveal="up slow">Slow</div>
<div data-reveal="up smooth">Extra smooth</div>
```

### Custom Delays
```html
<div data-reveal="up" style="--reveal-delay: 200ms">
  Delayed reveal
</div>
```

## 🎭 Animations

### Entrance Animations
```html
<div class="fade-in">Fade in</div>
<div class="fade-in-up">Fade in from bottom</div>
<div class="scale-in">Scale in with bounce</div>
<div class="slide-in-blur">Slide with blur</div>
```

### Hover Effects
```html
<div class="hover-lift">Lifts on hover</div>
<div class="hover-scale">Scales on hover</div>
<div class="hover-glow">Glows on hover</div>
```

### Continuous Animations
```html
<div class="float">Floating</div>
<div class="pulse-glow">Pulsing glow</div>
<div class="shimmer">Shimmer effect</div>
```

## 🎴 Components

### Cards
```html
<!-- Basic card -->
<div class="card">Content</div>

<!-- Hover card -->
<div class="card card-hover">Lifts on hover</div>

<!-- Interactive card -->
<div class="card card-interactive">Clickable</div>

<!-- Glass card -->
<div class="card glass">Glassmorphism</div>
```

### Badges
```html
<span class="badge">Default</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-danger">Danger</span>
<span class="badge badge-info">Info</span>
```

### Gradients
```html
<!-- Gradient background -->
<div class="gradient-brand">Content</div>

<!-- Gradient text -->
<h1 class="gradient-text">Heading</h1>

<!-- Gradient border -->
<div class="gradient-border">Content</div>
```

## 📦 Layout

### Container
```html
<div class="container">
  Max-width container with padding
</div>

<div class="container-narrow">
  Narrow container for reading
</div>
```

### Grid
```html
<!-- Auto-fit responsive grid -->
<div class="grid-auto">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- 2-column grid -->
<div class="grid-2">
  <div>Column 1</div>
  <div>Column 2</div>
</div>
```

### Stack & Cluster
```html
<!-- Vertical spacing -->
<div class="stack-md">
  <p>Item 1</p>
  <p>Item 2</p>
</div>

<!-- Horizontal spacing -->
<div class="cluster-md">
  <button>Button 1</button>
  <button>Button 2</button>
</div>
```

## 🎯 Best Practices

### ✅ Do
- Use design tokens for consistency
- Apply scroll reveal to important content
- Use glassmorphism for overlays
- Respect reduced motion preferences
- Use semantic HTML

### ❌ Don't
- Animate everything
- Use heavy animations on mobile
- Ignore accessibility
- Overuse glassmorphism
- Nest too many animated elements

## 🌙 Dark Mode

Dark mode is automatically supported via `data-theme="dark"` on the root element.

```jsx
// Toggle dark mode
document.documentElement.setAttribute('data-theme', 'dark');
```

All design tokens automatically adjust for dark mode.

## ♿ Accessibility

### Reduced Motion
All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are disabled */
}
```

### Focus States
All interactive elements have visible focus states:

```scss
:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
```

### Contrast
All color combinations meet WCAG AA standards.

## ⚡ Performance

### Optimizations
- IntersectionObserver for scroll reveals
- GPU-accelerated transforms
- will-change for animated elements
- Efficient backdrop-filter usage
- Debounced event handlers

### Tips
1. Use `transform` over `position`
2. Add `will-change` sparingly
3. Prefer `opacity` over `visibility`
4. Use IntersectionObserver (already implemented)
5. Debounce scroll handlers

## 📚 Examples

See `src/examples/ModernUIExamples.jsx` for complete examples:
- Hero sections
- Feature cards
- Stats sections
- Testimonials
- Interactive lists
- Loading states
- Badge showcases

## 🔧 Customization

### Custom Reveal
```html
<div 
  data-reveal="up"
  style="
    --reveal-distance: 50px;
    --reveal-dur: 1s;
    --reveal-delay: 300ms;
  "
>
  Custom reveal
</div>
```

### Custom Animation
```scss
.my-element {
  animation: fade-in-up 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
  animation-delay: 200ms;
}
```

### Custom Token
```scss
.my-component {
  --my-custom-color: color-mix(in oklab, var(--brand) 50%, white);
  background: var(--my-custom-color);
}
```

## 📖 Documentation

- **Full Guide**: `/STYLING_IMPROVEMENTS.md`
- **Quick Reference**: `/src/stylus/QUICK_REFERENCE.md`
- **Summary**: `/MODERNIZATION_SUMMARY.md`
- **Examples**: `/src/examples/ModernUIExamples.jsx`

## 🐛 Troubleshooting

### Animations not working?
1. Check if element has `data-reveal` attribute
2. Verify scroll reveal is initialized
3. Check browser console for errors
4. Ensure element is in viewport

### Glassmorphism not showing?
1. Check browser support for `backdrop-filter`
2. Verify element has `.glass` class
3. Check if parent has background

### Dark mode not working?
1. Verify `data-theme="dark"` on root element
2. Check if tokens are properly imported
3. Clear browser cache

## 🤝 Contributing

When adding new styles:
1. Use design tokens
2. Follow naming conventions
3. Add documentation
4. Test in both themes
5. Check accessibility

## 📝 License

Part of Habesha Community project.

---

**Need help?** Check the documentation files or review the examples!
