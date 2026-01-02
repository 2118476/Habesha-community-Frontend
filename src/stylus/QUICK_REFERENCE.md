# Quick Reference - Modern Styling System

## 🎨 Design Tokens

### Colors
```scss
--brand          // Primary brand color (cyan/sky blue)
--accent         // Secondary accent (purple)
--danger         // Error/danger states
--success        // Success states
--info           // Info states

--surface-0      // Base surface (cards, panels)
--surface-1      // Elevated surface (dialogs)
--surface-2      // Highest surface (popovers)

--on-surface-0   // Primary text
--on-surface-1   // Heading text
--on-surface-muted // Secondary text

--border-soft    // Subtle borders
--border-strong  // Prominent borders
```

### Spacing
```scss
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-7: 28px
--space-8: 32px
```

### Radius
```scss
--radius-xs: 6px
--radius-sm: 10px
--radius-md: 14px
--radius-lg: 18px
--radius-xl: 24px
--radius-pill: 9999px
```

### Shadows
```scss
--shadow-subtle  // Light shadow for cards
--shadow-soft    // Medium shadow for elevated elements
--shadow-strong  // Heavy shadow for modals
```

## 🎬 Scroll Reveal

### Basic Usage
```html
<!-- Fade in from bottom -->
<div data-reveal="up">Content</div>

<!-- Fade in from top -->
<div data-reveal="down">Content</div>

<!-- Fade in from left -->
<div data-reveal="left">Content</div>

<!-- Fade in from right -->
<div data-reveal="right">Content</div>

<!-- Scale in -->
<div data-reveal="scale">Content</div>

<!-- Zoom in -->
<div data-reveal="zoom">Content</div>

<!-- Blur in -->
<div data-reveal="blur">Content</div>
```

### Speed Modifiers
```html
<div data-reveal="up snappy">Fast animation</div>
<div data-reveal="up slow">Slow animation</div>
<div data-reveal="up smooth">Extra smooth</div>
```

### List Animations (Staggered)
```html
<ul data-reveal="list-up">
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

### Custom Delays
```html
<div data-reveal="up" style="--reveal-delay: 200ms">
  Delayed reveal
</div>
```

## 🎭 Animation Classes

### Entrance Animations
```html
<div class="fade-in">Fade in</div>
<div class="fade-in-up">Fade in from bottom</div>
<div class="fade-in-down">Fade in from top</div>
<div class="fade-in-left">Fade in from left</div>
<div class="fade-in-right">Fade in from right</div>
<div class="scale-in">Scale in with bounce</div>
<div class="slide-in-blur">Slide with blur</div>
<div class="bounce-in">Bounce in</div>
```

### Continuous Animations
```html
<div class="float">Floating element</div>
<div class="pulse-glow">Pulsing glow</div>
<div class="shimmer">Shimmer effect</div>
```

### Hover Effects
```html
<div class="hover-lift">Lifts on hover</div>
<div class="hover-scale">Scales on hover</div>
<div class="hover-glow">Glows on hover</div>
```

### Delays
```html
<div class="fade-in delay-100">100ms delay</div>
<div class="fade-in delay-200">200ms delay</div>
<div class="fade-in delay-300">300ms delay</div>
```

## 🎴 Card Components

### Basic Card
```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

### Hover Card
```html
<div class="card card-hover">
  Lifts on hover
</div>
```

### Interactive Card
```html
<div class="card card-interactive">
  Clickable card with effects
</div>
```

### Glass Card
```html
<div class="card glass">
  Glassmorphism card
</div>
```

## 🌈 Gradient Utilities

### Gradient Background
```html
<div class="gradient-brand">
  Brand gradient background
</div>
```

### Gradient Text
```html
<h1 class="gradient-text">
  Beautiful gradient text
</h1>
```

### Gradient Border
```html
<div class="gradient-border">
  Content with gradient border
</div>
```

## 📦 Layout Utilities

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
<div class="grid-auto">
  Auto-fit responsive grid
</div>

<div class="grid-2">
  2-column grid (responsive)
</div>

<div class="grid-3">
  3-column grid (responsive)
</div>
```

### Stack (Vertical Spacing)
```html
<div class="stack-sm">
  <p>Item 1</p>
  <p>Item 2</p>
</div>
```

### Cluster (Horizontal Spacing)
```html
<div class="cluster-md">
  <button>Button 1</button>
  <button>Button 2</button>
</div>
```

## 🏷️ Badge Components

```html
<span class="badge">Default</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-danger">Danger</span>
<span class="badge badge-info">Info</span>
```

## 💀 Loading States

### Skeleton
```html
<div class="skeleton" style="height: 20px; width: 200px;"></div>
```

### Pulse
```html
<div class="pulse">Loading...</div>
```

## 🎯 Elevation

```html
<div class="elevation-0">No shadow</div>
<div class="elevation-1">Subtle shadow</div>
<div class="elevation-2">Soft shadow</div>
<div class="elevation-3">Strong shadow</div>
```

## 🎨 Glassmorphism

```html
<div class="glass">
  Light glass effect
</div>

<div class="glass-strong">
  Strong glass effect
</div>
```

## 📱 Responsive Utilities

```html
<div class="sm:hidden">Hidden on small screens</div>
<div class="md:hidden">Hidden on medium screens</div>
<div class="lg:hidden">Hidden on large screens</div>
```

## 🎪 Flex Utilities

```html
<div class="flex items-center justify-between">
  <span>Left</span>
  <span>Right</span>
</div>

<div class="flex flex-col items-center">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## 🎨 Text Utilities

```html
<p class="text-muted">Muted text</p>
<p class="text-gradient">Gradient text</p>
<p class="text-shadow">Text with shadow</p>
<p class="text-balance">Balanced text wrapping</p>
<p class="truncate">Truncated text...</p>
<p class="line-clamp-2">Clamped to 2 lines...</p>
```

## 🔧 Interactive States

```html
<button class="clickable">Clickable element</button>
<button class="disabled">Disabled element</button>
```

## 🎯 Best Practices

### ✅ Do
- Use scroll reveal for important content
- Apply hover effects to interactive elements
- Use glassmorphism for overlays
- Respect reduced motion preferences
- Use semantic HTML with utility classes

### ❌ Don't
- Animate everything (causes distraction)
- Use heavy animations on mobile
- Ignore accessibility
- Overuse glassmorphism
- Nest too many animated elements

## 🚀 Performance Tips

1. **Use transform over position** - Better GPU acceleration
2. **Add will-change sparingly** - Only on animating elements
3. **Prefer opacity over visibility** - Smoother transitions
4. **Use IntersectionObserver** - Already implemented for scroll reveal
5. **Debounce scroll handlers** - Reduce computation

## 🌙 Dark Mode

All utilities automatically support dark mode via `data-theme="dark"` on the root element. No additional classes needed!

---

**Need help?** Check `STYLING_IMPROVEMENTS.md` for detailed documentation.
