/**
 * Media Components
 *
 * This module exports all media-related components for the landing page.
 * These components are designed with accessibility in mind and provide
 * flexible layouts for displaying media coverage items.
 *
 * Structure:
 * - variants/ - Different media layout variants (horizontal)
 * - shared/ - Common components
 * - utils/ - Utility functions and helpers
 */

// Export shared components for advanced usage
export { MediaCard } from "./shared/media-card"
export { MediaHeader } from "./shared/media-header"
// Export utils for advanced usage
export { getScrollButtonClasses } from "./utils/get-scroll-button-classes"
// Export variants with clearer naming
// Maintain backward compatibility
export { HorizontalMedia, HorizontalMedia as MediaCoverage } from "./variants/horizontal-media"
