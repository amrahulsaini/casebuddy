# 🎯 Quick Responsive Design Reference

## Common Patterns Used in Your Website

### 1. Responsive Grid Pattern
```css
/* Desktop: 4 columns */
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
}

/* Tablet: 2 columns */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

/* Mobile: 1 column */
@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
```

### 2. Responsive Typography
```css
/* Use clamp() for fluid typography */
.heading {
  font-size: clamp(1.5rem, 5vw, 3rem);
}

/* OR use media queries */
.title {
  font-size: 48px;
}

@media (max-width: 768px) {
  .title {
    font-size: 32px;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 24px;
  }
}
```

### 3. Mobile Navigation Pattern
```css
/* Desktop: Horizontal nav */
.nav {
  display: flex;
  gap: 2rem;
}

/* Mobile: Hidden, show hamburger */
@media (max-width: 768px) {
  .nav {
    display: none;
  }
  
  .mobileMenu {
    display: block;
  }
  
  .nav.open {
    display: flex;
    flex-direction: column;
    position: fixed;
    inset: 0;
    background: white;
    z-index: 1000;
  }
}
```

### 4. Responsive Images
```css
.image {
  width: 100%;
  height: auto;
  max-width: 100%;
  object-fit: cover;
}

/* Adaptive height */
.imageWrapper {
  aspect-ratio: 16 / 9;
}

@media (max-width: 768px) {
  .imageWrapper {
    aspect-ratio: 4 / 3;
  }
}
```

### 5. Flex Layout Pattern
```css
/* Desktop: Row */
.container {
  display: flex;
  gap: 2rem;
}

/* Mobile: Column */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
    gap: 1rem;
  }
}
```

### 6. Responsive Spacing
```css
.section {
  padding: 4rem 2rem;
}

@media (max-width: 768px) {
  .section {
    padding: 3rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .section {
    padding: 2rem 1rem;
  }
}
```

### 7. Touch-Friendly Buttons
```css
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .button {
    min-height: 48px;
    padding: 14px 28px;
  }
}
```

### 8. Sticky Elements
```css
/* Desktop: Sticky sidebar */
.sidebar {
  position: sticky;
  top: 100px;
}

/* Mobile: No sticky (normal flow) */
@media (max-width: 768px) {
  .sidebar {
    position: static;
  }
}
```

### 9. Horizontal Scroll on Mobile
```css
.scrollContainer {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.scrollContainer::-webkit-scrollbar {
  display: none;
}

.scrollContent {
  display: flex;
  gap: 1rem;
  width: max-content;
}
```

### 10. Modal/Overlay Pattern
```css
.modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.modalContent {
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

@media (max-width: 768px) {
  .modalContent {
    max-width: 95vw;
    margin: 1rem;
  }
}
```

## CSS Variables for Consistency

```css
:root {
  /* Breakpoints */
  --breakpoint-xs: 480px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Typography */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
}
```

## Quick Testing Checklist

- [ ] Test on Chrome DevTools (all breakpoints)
- [ ] Test on Firefox Responsive Mode
- [ ] Check iPhone SE (375px)
- [ ] Check iPad (768px)
- [ ] Check Desktop (1280px+)
- [ ] Test landscape orientation
- [ ] Verify touch targets (44px min)
- [ ] Check horizontal scrolling
- [ ] Test navigation on mobile
- [ ] Verify forms work on mobile

## Common Issues & Solutions

### Issue: Horizontal Scroll on Mobile
```css
/* Solution */
* {
  box-sizing: border-box;
}

body {
  overflow-x: hidden;
}
```

### Issue: Text Too Small on Mobile
```css
/* Solution: Use relative units */
body {
  font-size: 16px; /* Never below 16px */
}

@media (max-width: 480px) {
  body {
    font-size: 14px; /* Minimum readable size */
  }
}
```

### Issue: Buttons Too Small to Tap
```css
/* Solution: Minimum 44x44px touch target */
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 20px;
}
```

### Issue: Images Breaking Layout
```css
/* Solution */
img {
  max-width: 100%;
  height: auto;
  display: block;
}
```

## Performance Tips

1. **Use CSS Grid and Flexbox** instead of floats
2. **Minimize media queries** by using flexible units
3. **Use transform** for animations (GPU accelerated)
4. **Avoid fixed widths** - use max-width instead
5. **Use relative units** (rem, em, %) over px
6. **Lazy load images** below the fold
7. **Use CSS containment** for better performance

---

## Remember

✅ **Mobile First** - Design for small screens first
✅ **Progressive Enhancement** - Add features for larger screens
✅ **Touch Friendly** - 44px minimum touch targets
✅ **Performance** - Optimize for mobile networks
✅ **Accessibility** - Ensure keyboard navigation works
✅ **Testing** - Test on real devices when possible

Happy coding! 🚀
