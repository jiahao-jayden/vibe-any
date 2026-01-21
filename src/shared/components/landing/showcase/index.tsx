/**
 * Showcase Components
 *
 * This module exports all showcase-related components for the landing page.
 * These components are designed with accessibility in mind and provide
 * flexible layouts for displaying content items.
 *
 * Structure:
 * - variants/ - Different showcase layout variants (grid, horizontal)
 * - shared/ - Common components
 * - utils/ - Utility functions and helpers
 */

// Export utils for advanced usage
export { getScrollButtonClasses } from "./get-scroll-button-classes"
// Export variants with clearer naming
// Maintain backward compatibility
export { GridShowcase, GridShowcase as BaseShowcase } from "./grid-showcase"
export { HorizontalShowcase } from "./horizontal-showcase"
// Export shared components for advanced usage
export { ShowcaseCard } from "./shared/showcase-card"
export { ShowcaseHeader } from "./shared/showcase-header"
